"use client";

import { Activity, Plus, Shield, Trash2, Trophy, Users } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// --- TYPES ---

type TeamStat = {
  id: string;
  name: string;
  logo: string;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

type PlayerStat = {
  id: string;
  name: string;
  teamName: string;
  avatar: string;
  goals: number;
  isGoalkeeper: boolean;
};

type MatchDisplay = {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  homeGoals: number;
  awayGoals: number;
  timestamp: string;
};

type GoalInput = {
  scoringTeamId: "home" | "away";
  playerId: string;
};

const TEAM_LOGOS: Record<string, string> = {
  Pokemon: "/TeamLogoAssets/pokemon_logo.jpeg",
  Naruto: "/TeamLogoAssets/naruto_logo.jpeg",
  Tsubasa: "/TeamLogoAssets/tsubasa_logo.jpeg",
  "Power Rangers": "/TeamLogoAssets/power_rangers_logo.jpeg",
  Doraemon: "/TeamLogoAssets/doraemon_logo.jpeg",
  Jumbo: "/TeamLogoAssets/jumbo_logo.jpeg",
};

export default function LigaSelasaStandings() {
  const [activeTab, setActiveTab] = useState<
    "standings" | "topscorer" | "bestgk" | "matches"
  >("standings");
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Operator PIN Setup
  const OPERATOR_PIN = "ligaselasa123";

  // --- RAW DATA ---
  const [standings, setStandings] = useState<TeamStat[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<MatchDisplay[]>([]);
  
  // Derived Stats
  const [topScorers, setTopScorers] = useState<PlayerStat[]>([]);
  const [bestGks, setBestGks] = useState<PlayerStat[]>([]);

  // -- MATCH FORM STATE --
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [homeTeam, setHomeTeam] = useState<string>("");
  const [awayTeam, setAwayTeam] = useState<string>("");
  const [homeGoals, setHomeGoals] = useState<number>(0);
  const [awayGoals, setAwayGoals] = useState<number>(0);
  const [goalDetails, setGoalDetails] = useState<GoalInput[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Teams & Players
      const { data: teamsData, error: teamsErr } = await supabase.from("teams").select("*");
      if (teamsErr) throw teamsErr;
      setTeams(teamsData);

      const { data: playersData, error: playersErr } = await supabase.from("players").select("*");
      if (playersErr) throw playersErr;
      setPlayers(playersData);

      // 2. Formulate Standings derived entirely from teams and matches
      // This is dynamic and foolproof, circumventing any RLS UPDATE errors on the standings table forever.
      const initialStandings: TeamStat[] = (teamsData || []).map((t: any) => {
         const seed = t.name.replace(/\s/g, "");
         return {
           id: t.id,
           name: t.name,
           logo: TEAM_LOGOS[t.name] || `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=047857`,
           played: 0,
           win: 0,
           draw: 0,
           lose: 0,
           goalsFor: 0,
           goalsAgainst: 0,
           goalDifference: 0,
           points: 0
         };
      });

      // 3. Fetch Matches
      const { data: matchesData, error: matchesErr } = await supabase
        .from("matches")
        .select(`
           id,
           home_team_id,
           away_team_id,
           home_goals,
           away_goals,
           created_at,
           home_team:teams!matches_home_team_id_fkey(name),
           away_team:teams!matches_away_team_id_fkey(name)
        `)
        .order("created_at", { ascending: false });
        
      if (matchesErr) throw matchesErr;

      const formattedMatches: MatchDisplay[] = (matchesData || []).map((m: any) => ({
         id: m.id,
         homeTeamName: m.home_team.name,
         awayTeamName: m.away_team.name,
         homeGoals: m.home_goals,
         awayGoals: m.away_goals,
         timestamp: m.created_at,
      }));
      setMatches(formattedMatches);

      // Process Matches to populate Standings
      (matchesData || []).forEach((m: any) => {
          const homeTeam = initialStandings.find((t) => t.id === m.home_team_id);
          const awayTeam = initialStandings.find((t) => t.id === m.away_team_id);

          if (homeTeam && awayTeam) {
              homeTeam.played += 1;
              awayTeam.played += 1;
              homeTeam.goalsFor += m.home_goals;
              homeTeam.goalsAgainst += m.away_goals;
              awayTeam.goalsFor += m.away_goals;
              awayTeam.goalsAgainst += m.home_goals;

              if (m.home_goals > m.away_goals) {
                  homeTeam.win += 1;
                  homeTeam.points += 3;
                  awayTeam.lose += 1;
              } else if (m.home_goals < m.away_goals) {
                  awayTeam.win += 1;
                  awayTeam.points += 3;
                  homeTeam.lose += 1;
              } else {
                  homeTeam.draw += 1;
                  awayTeam.draw += 1;
                  homeTeam.points += 1;
                  awayTeam.points += 1;
              }

              homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
              awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;
          }
      });

      initialStandings.sort((a, b) => {
         if (a.points !== b.points) return b.points - a.points;
         if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
         return b.goalsFor - a.goalsFor;
      });
      setStandings(initialStandings);

      // 4. Calculate Top Scorers based on goals table
      const { data: goalsData, error: goalsErr } = await supabase
        .from("goals")
        .select(`player_id, players (name, is_gk, team_id), teams (name)`);
        
      if (goalsErr) throw goalsErr;

      const goalCounts: Record<string, number> = {};
      (goalsData || []).forEach((g: any) => {
         if (g.player_id) {
           goalCounts[g.player_id] = (goalCounts[g.player_id] || 0) + 1;
         }
      });

      const scorers: PlayerStat[] = [];
      Object.keys(goalCounts).forEach(playerId => {
         const playerRef = (playersData || []).find((p: any) => p.id === playerId);
         const teamRef = (teamsData || []).find((t: any) => t.id === playerRef?.team_id);
         
         if (playerRef) {
             scorers.push({
               id: playerId,
               name: playerRef.name,
               teamName: teamRef ? teamRef.name : "Unknown",
               avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerRef.name}`,
               goals: goalCounts[playerId],
               isGoalkeeper: playerRef.is_gk
             });
         }
      });
      
      scorers.sort((a, b) => b.goals - a.goals);
      setTopScorers(scorers.slice(0, 5));

      // 5. Calculate Best GK
      // A simple logic: lowest goals conceded.
      // We look at the standings for goals_against per team, and assign that to the GK of that team.
      const gks: PlayerStat[] = [];
      (playersData || []).filter((p: any) => p.is_gk).forEach((gk: any) => {
         const teamStat = initialStandings.find(s => s.id === gk.team_id);
         if (teamStat && teamStat.played > 0) {
             gks.push({
                 id: gk.id,
                 name: gk.name,
                 teamName: teamStat.name,
                 avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`,
                 goals: teamStat.goalsAgainst, // represents goals conceded here
                 isGoalkeeper: true
             });
         }
      });
      
      gks.sort((a, b) => a.goals - b.goals);
      setBestGks(gks.slice(0, 3));

    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
       setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Adjust goalDetails array size when home/away goals change
  useEffect(() => {
    let newDetails = [...goalDetails];

    const currentHomeGoalsInDetails = newDetails.filter((d) => d.scoringTeamId === "home").length;
    const currentAwayGoalsInDetails = newDetails.filter((d) => d.scoringTeamId === "away").length;

    // Add/remove home
    for (let i = 0; i < homeGoals - currentHomeGoalsInDetails; i++) {
       newDetails.push({ scoringTeamId: "home", playerId: "" });
    }
    while (newDetails.filter((d) => d.scoringTeamId === "home").length > homeGoals) {
       const idx = newDetails.findLastIndex((d) => d.scoringTeamId === "home");
       if (idx !== -1) newDetails.splice(idx, 1);
    }

    // Add/remove away
    for (let i = 0; i < awayGoals - currentAwayGoalsInDetails; i++) {
       newDetails.push({ scoringTeamId: "away", playerId: "" });
    }
    while (newDetails.filter((d) => d.scoringTeamId === "away").length > awayGoals) {
       const idx = newDetails.findLastIndex((d) => d.scoringTeamId === "away");
       if (idx !== -1) newDetails.splice(idx, 1);
    }

    newDetails.sort((a, b) => (a.scoringTeamId === "home" ? -1 : 1));
    setGoalDetails(newDetails);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeGoals, awayGoals]);

  const getPlayersByTeamId = (teamId: string) => {
    return players.filter(p => p.team_id === teamId);
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();

    // -- SECURITY PROMPT --
    const pin = window.prompt("Masukkan PIN Operator untuk menyimpan skor:");
    if (pin !== OPERATOR_PIN) {
        alert("PIN Salah! Anda tidak memiliki izin untuk menambah pertandingan.");
        return;
    }

    if (!homeTeam || !awayTeam || homeTeam === awayTeam) {
      alert("Pilih tim home dan away dengan benar!");
      return;
    }

    const missingScorer = goalDetails.some((g) => !g.playerId);
    if (missingScorer && (homeGoals > 0 || awayGoals > 0)) {
      if (!confirm("Ada gol yang belum ditentukan pencetaknya. Lanjutkan tanpa pencetak gol?")) {
         return;
      }
    }

    setIsSubmitting(true);
    try {
      // 1. Insert Match
      const { data: matchObj, error: matchErr } = await supabase
        .from("matches")
        .insert({
           home_team_id: homeTeam,
           away_team_id: awayTeam,
           home_goals: homeGoals,
           away_goals: awayGoals
        })
        .select("id")
        .single();

      if (matchErr) throw matchErr;
      const matchId = matchObj.id;

      // 2. Insert Goals
      const validGoals = goalDetails.filter(g => g.playerId).map(g => ({
         match_id: matchId,
         player_id: g.playerId,
         team_id: g.scoringTeamId === "home" ? homeTeam : awayTeam
      }));
      
      if (validGoals.length > 0) {
         const { error: goalErr } = await supabase.from("goals").insert(validGoals);
         if (goalErr) throw goalErr;
      }

      // 3. We no longer manually upsert into 'standings' table to avoid complex RLS and desync bugs.
      // Standings are purely generated dynamically based on matches in the code above.

      // Reset and refresh
      setHomeTeam("");
      setAwayTeam("");
      setHomeGoals(0);
      setAwayGoals(0);
      setGoalDetails([]);
      setIsAddingMatch(false);
      
      await fetchData();

    } catch (err: any) {
       console.error("Submission error:", err);
       alert("Gagal menyimpan hasil pertandingan: " + err.message);
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
     // -- SECURITY PROMPT --
     const pin = window.prompt("Masukkan PIN Operator untuk MENGHAPUS pertandingan:");
     if (pin !== OPERATOR_PIN) {
         alert("PIN Salah! Anda tidak memiliki izin untuk menghapus pertandingan.");
         return;
     }

     if (!confirm("Yakin ingin menghapus pertandingan ini? Data klasemen dan skor akan dihitung ulang secara otomatis.")) {
        return;
     }

     setIsLoading(true);
     try {
        // Goals are safely foreign-key cascaded or at least isolated. We just delete the match.
        // For absolute safety, delete goals first if no cascade is setup
        await supabase.from("goals").delete().eq("match_id", matchId);
        
        const { error } = await supabase.from("matches").delete().eq("id", matchId);
        if (error) throw error;

        await fetchData();
     } catch(err: any) {
        console.error("Delete error:", err);
        alert("Gagal menghapus pertandingan: " + err.message);
     } finally {
        setIsLoading(false);
     }
  };

  const getTeamNameById = (id: string) => teams.find(t => t.id === id)?.name || "Unknown";

  if (isLoading) {
    return (
      <section className="py-24 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl font-bold text-slate-400">Memuat Statistik...</div>
      </section>
    );
  }

  if (error) {
     return (
       <section className="py-24 bg-slate-50 min-h-screen flex items-center justify-center">
         <div className="text-red-500 text-center">
            <h2 className="text-2xl font-bold mb-2">Gagal Memuat Klasemen</h2>
            <p>{error}</p>
         </div>
       </section>
     )
  }

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 relative z-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
            LigaSelasa{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Statistik
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Klasemen resmi, Top Scorer, dan Best GK yang terintegrasi secara Real-Time.
          </p>
        </div>

        {/* Custom Tabs */}
        <div className="flex justify-start sm:justify-center mb-10 overflow-x-auto pb-4 snap-x hide-scrollbar">
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 w-max mx-auto md:w-auto">
            <button
              onClick={() => setActiveTab("standings")}
              className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === "standings"
                  ? "bg-primary text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              }`}
            >
              <Users size={18} />
              <span className="whitespace-nowrap text-sm sm:text-base">
                Klasemen Tim
              </span>
            </button>
            <button
               onClick={() => setActiveTab("topscorer")}
               className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 ${
                 activeTab === "topscorer"
                   ? "bg-primary text-white shadow-md"
                   : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
               }`}
            >
              <Trophy size={18} />
              <span className="whitespace-nowrap text-sm sm:text-base">
                Top Score
              </span>
            </button>
            <button
              onClick={() => setActiveTab("bestgk")}
              className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === "bestgk"
                  ? "bg-primary text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              }`}
            >
              <Shield size={18} />
              <span className="whitespace-nowrap text-sm sm:text-base">
                Best GK
              </span>
            </button>
            <button
               onClick={() => setActiveTab("matches")}
               className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 ${
                 activeTab === "matches"
                   ? "bg-secondary text-slate-900 shadow-md"
                   : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
               }`}
            >
              <Activity size={18} />
              <span className="whitespace-nowrap text-sm sm:text-base">
                Pertandingan
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-300 min-h-[400px]">
          
          {/* STANDINGS TABLE */}
          {activeTab === "standings" && (
            <div className="overflow-x-auto">
               {standings.every(s => s.played === 0) ? (
                 <div className="p-12 text-center text-slate-500">
                    Belum ada pertandingan dicatat. Beralih ke tab <b>Pertandingan</b> untuk menginput skor.
                 </div>
               ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="p-4 text-center w-16">Pos</th>
                    <th className="p-4">Klub</th>
                    <th className="p-4 text-center" title="Main">M</th>
                    <th className="p-4 text-center" title="Menang">M</th>
                    <th className="p-4 text-center" title="Seri">S</th>
                    <th className="p-4 text-center" title="Kalah">K</th>
                    <th className="p-4 text-center hidden sm:table-cell" title="Gol Memasukan">GM</th>
                    <th className="p-4 text-center hidden sm:table-cell" title="Gol Kemasukan">GK</th>
                    <th className="p-4 text-center font-bold" title="Selisih Gol">SG</th>
                    <th className="p-4 text-center font-bold text-primary dark:text-green-400 text-base">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {standings.map((team, index) => (
                    <tr
                      key={team.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                        index === 0
                          ? "bg-green-50/50 dark:bg-green-900/10"
                          : ""
                      }`}
                    >
                      <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {index + 1}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                            <Image
                              src={team.logo}
                              alt={team.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {team.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-400 font-medium">
                        {team.played}
                      </td>
                      <td className="p-4 text-center text-green-600 dark:text-green-400 font-medium">
                        {team.win}
                      </td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-400 font-medium">
                        {team.draw}
                      </td>
                      <td className="p-4 text-center text-red-600 dark:text-red-400 font-medium">
                        {team.lose}
                      </td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                        {team.goalsFor}
                      </td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                        {team.goalsAgainst}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {team.goalDifference > 0
                          ? `+${team.goalDifference}`
                          : team.goalDifference}
                      </td>
                      <td className="p-4 text-center font-bold text-lg text-primary dark:text-green-400">
                        {team.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
               )}
            </div>
          )}

          {/* TOP SCORERS */}
          {activeTab === "topscorer" && (
            <div className="p-6 md:p-8">
              {topScorers.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  Belum ada pemain yang mencetak gol tercatat.
                </div>
              ) : (
                <div className="grid gap-4">
                  {topScorers.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-primary/30 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : index === 1
                                ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                : index === 2
                                  ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                                  : "text-slate-400"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                          <Image
                            src={player.avatar}
                            alt={player.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-primary transition-colors">
                            {player.name}
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {player.teamName}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg text-green-700 dark:text-green-400 font-bold text-xl">
                          {player.goals}{" "}
                          <span className="text-xs font-medium uppercase tracking-wider text-green-600/70 dark:text-green-400/70 hidden sm:inline">
                            Gol
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BEST GOALKEEPERS */}
          {activeTab === "bestgk" && (
            <div className="p-6 md:p-8">
              {bestGks.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  Belum ada kiper yang bermain. Pastikan tim sudah melakukan
                  pertandingan.
                </div>
              ) : (
                <div className="grid gap-4">
                  {bestGks.map((gk, index) => (
                    <div
                      key={gk.id}
                      className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-primary/30 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : index === 1
                                ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                : index === 2
                                  ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                                  : "text-slate-400"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                          <Image
                            src={gk.avatar}
                            alt={gk.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-primary transition-colors">
                            {gk.name}
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {gk.teamName}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xl">
                          {gk.goals}{" "}
                          <span className="text-xs font-medium uppercase tracking-wider text-blue-600/70 dark:text-blue-400/70 hidden sm:inline">
                            Kem
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider hidden sm:block">
                          Kemasukan
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MATCHES (INPUT) */}
          {activeTab === "matches" && (
            <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-900/30">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  Daftar Pertandingan
                </h3>
                <button
                  onClick={() => setIsAddingMatch(!isAddingMatch)}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm w-full sm:w-auto justify-center"
                >
                  {isAddingMatch ? (
                    "Batal"
                  ) : (
                    <>
                      <Plus size={16} /> Tambah Hasil
                    </>
                  )}
                </button>
              </div>

              {isAddingMatch && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8 animate-in slide-in-from-top-4">
                  <h4 className="font-bold text-lg mb-4 text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2">
                    Input Hasil Pertandingan
                  </h4>
                  <form onSubmit={handleAddMatch} className="space-y-6">
                    {/* Team Selection */}
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="flex-1 w-full">
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Tim Kandang (Home)
                        </label>
                        <select
                          required
                          className="w-full bg-slate-50 border border-slate-300 dark:bg-slate-900 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          value={homeTeam}
                          onChange={(e) => setHomeTeam(e.target.value)}
                        >
                          <option value="">Pilih Tim</option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.id} disabled={t.id === awayTeam}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-shrink-0 bg-slate-200 dark:bg-slate-700 text-slate-500 font-bold px-4 py-2 rounded-full text-sm">
                        VS
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Tim Tandang (Away)
                        </label>
                        <select
                          required
                          className="w-full bg-slate-50 border border-slate-300 dark:bg-slate-900 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          value={awayTeam}
                          onChange={(e) => setAwayTeam(e.target.value)}
                        >
                          <option value="">Pilih Tim</option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.id} disabled={t.id === homeTeam}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Scores Setup */}
                    {homeTeam && awayTeam && (
                      <div className="grid grid-cols-2 gap-4 sm:gap-8 py-6 border-t border-slate-100 dark:border-slate-700 mt-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 sm:p-6 border">
                        <div className="text-center flex flex-col items-center">
                          <label className="block font-bold text-emerald-700 dark:text-emerald-400 mb-3 text-sm sm:text-base">
                            {getTeamNameById(homeTeam)}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            required
                            className="w-20 sm:w-24 text-center text-3xl font-black bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-100 rounded-2xl p-3 outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-inner"
                            value={homeGoals}
                            onChange={(e) =>
                              setHomeGoals(parseInt(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div className="text-center flex flex-col items-center border-l-2 border-slate-200 dark:border-slate-700 border-dashed pl-4 sm:pl-8">
                          <label className="block font-bold text-indigo-700 dark:text-indigo-400 mb-3 text-sm sm:text-base">
                            {getTeamNameById(awayTeam)}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            required
                            className="w-20 sm:w-24 text-center text-3xl font-black bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-100 rounded-2xl p-3 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
                            value={awayGoals}
                            onChange={(e) =>
                              setAwayGoals(parseInt(e.target.value) || 0)
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* Goal Scorers Setup */}
                    {goalDetails.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h5 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <Trophy size={14} /> Pencetak Gol
                        </h5>
                        <div className="space-y-2">
                          {goalDetails.map((detail, idx) => {
                            const isHome = detail.scoringTeamId === "home";
                            const availablePlayers = isHome
                              ? getPlayersByTeamId(homeTeam)
                              : getPlayersByTeamId(awayTeam);
                            const teamName = isHome ? getTeamNameById(homeTeam) : getTeamNameById(awayTeam);

                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 sm:p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm"
                              >
                                {isHome ? (
                                  <span className="text-xs font-bold w-16 px-2 py-1.5 rounded text-center whitespace-nowrap bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                    Skor Home
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold w-16 px-2 py-1.5 rounded text-center whitespace-nowrap bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                                    Skor Away
                                  </span>
                                )}
                                <select
                                  className="flex-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-sm rounded-md outline-none p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                  value={detail.playerId}
                                  onChange={(e) => {
                                    const newDetails = [...goalDetails];
                                    newDetails[idx].playerId = e.target.value;
                                    setGoalDetails(newDetails);
                                  }}
                                >
                                  <option value="">
                                    (Pilih Pemain {teamName})
                                  </option>
                                  {availablePlayers.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-slate-500 mt-3 italic">
                          * Kosongkan jika bunuh diri/pemain tidak terdaftar
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-secondary text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-[#eacc00] transition-colors w-full sm:w-auto shadow-md disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? "Menyimpan..." : "Simpan Pertandingan"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Matches List */}
              <div className="space-y-3">
                {matches.length === 0 ? (
                  <div className="text-center text-slate-400 py-10 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl border-dashed">
                    <Activity size={32} className="mx-auto mb-3 opacity-30" />
                    Belum ada hasil pertandingan tersimpan. <br />
                    Klik Tambah Hasil untuk memasukkan data.
                  </div>
                ) : (
                  matches.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-row items-center justify-between gap-2 sm:gap-4 group relative"
                    >
                      {/* Home Team */}
                      <div className="flex-1 flex flex-col sm:flex-row justify-end items-center sm:gap-3 w-full text-center sm:text-right">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base order-2 sm:order-1 leading-tight mt-1 sm:mt-0">
                          {m.homeTeamName}
                        </span>
                        <span
                          className={`text-2xl sm:text-3xl font-black order-1 sm:order-2 ${m.homeGoals > m.awayGoals ? "text-primary" : "text-slate-600"}`}
                        >
                          {m.homeGoals}
                        </span>
                      </div>

                      {/* VS Badge */}
                      <div className="bg-slate-100 dark:bg-slate-700 text-slate-500 font-bold px-2 py-1 rounded-md text-[10px] sm:text-xs tracking-widest uppercase flex-shrink-0 mt-3 sm:mt-0 flex flex-col items-center">
                        VS
                        <span className="text-[8px] font-normal leading-none mt-1">{new Date(m.timestamp).toLocaleDateString('id-ID')}</span>
                      </div>

                      {/* Away Team */}
                      <div className="flex-1 flex flex-col sm:flex-row justify-start items-center sm:gap-3 w-full text-center sm:text-left">
                        <span
                          className={`text-2xl sm:text-3xl font-black ${m.awayGoals > m.homeGoals ? "text-primary" : "text-slate-600"}`}
                        >
                          {m.awayGoals}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-tight mt-1 sm:mt-0">
                          {m.awayTeamName}
                        </span>
                      </div>

                      {/* Delete Button (Hover Reveal) */}
                      <div className="absolute top-2 right-2 sm:top-1/2 sm:-translate-y-1/2 sm:right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                         <button
                           onClick={() => handleDeleteMatch(m.id)}
                           className="bg-red-100 text-red-600 hover:bg-red-600 hover:text-white p-2 text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                           title="Hapus Pertandingan"
                         >
                            <Trash2 size={14} />
                            <span className="hidden sm:inline font-medium">Hapus</span>
                         </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
