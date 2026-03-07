"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Users, Trophy, Shield, Activity, Plus, Trash2 } from "lucide-react";

// --- TYPES ---
type PlayerDraft = {
  id: string;
  name: string;
  categoryId: number; // Cat 1 is Goalkeeper usually
};

type GoalInput = {
  scoringTeamId: string; // "home" or "away"
  playerId: string;
};

type Match = {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  homeGoals: number;
  awayGoals: number;
  goalDetails: GoalInput[]; // Record who scored
  timestamp: number;
};

// Derived types for calculations
type TeamStat = {
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

const TEAM_NAMES = [
  "Pokemon",
  "Naruto",
  "Tsubasa",
  "Power Rangers",
  "Doraemon",
  "Jumbo",
];

export default function LigaSelasaStandings() {
  const [activeTab, setActiveTab] = useState<
    "standings" | "topscorer" | "bestgk" | "matches"
  >("standings");
  const [isMounted, setIsMounted] = useState(false);

  // --- RAW STATE ---
  const [teamsData, setTeamsData] = useState<PlayerDraft[][]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  // -- MATCH FORM STATE --
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [homeTeam, setHomeTeam] = useState<string>("");
  const [awayTeam, setAwayTeam] = useState<string>("");
  const [homeGoals, setHomeGoals] = useState<number>(0);
  const [awayGoals, setAwayGoals] = useState<number>(0);
  const [goalDetails, setGoalDetails] = useState<GoalInput[]>([]);

  useEffect(() => {
    setIsMounted(true);
    // Load teams from spin draft
    const savedTeams = localStorage.getItem("ls_teams");
    if (savedTeams) {
      setTeamsData(JSON.parse(savedTeams));
    } else {
      setTeamsData(TEAM_NAMES.map(() => []));
    }

    // Load matches
    const savedMatches = localStorage.getItem("ls_matches");
    if (savedMatches) {
      setMatches(JSON.parse(savedMatches));
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("ls_matches", JSON.stringify(matches));
    }
  }, [matches, isMounted]);

  // Adjust goalDetails array size when home/away goals change
  useEffect(() => {
    const totalGoals = homeGoals + awayGoals;
    let newDetails = [...goalDetails];

    // Determine how many home/away goals we expect vs what we have
    const currentHomeGoalsInDetails = newDetails.filter(
      (d) => d.scoringTeamId === "home",
    ).length;
    const currentAwayGoalsInDetails = newDetails.filter(
      (d) => d.scoringTeamId === "away",
    ).length;

    // Add lacking home goal slots
    for (let i = 0; i < homeGoals - currentHomeGoalsInDetails; i++) {
      newDetails.push({ scoringTeamId: "home", playerId: "" });
    }
    // Remove excess home goal slots
    while (
      newDetails.filter((d) => d.scoringTeamId === "home").length > homeGoals
    ) {
      const idx = newDetails.findLastIndex((d) => d.scoringTeamId === "home");
      if (idx !== -1) newDetails.splice(idx, 1);
    }

    // Add lacking away goal slots
    for (let i = 0; i < awayGoals - currentAwayGoalsInDetails; i++) {
      newDetails.push({ scoringTeamId: "away", playerId: "" });
    }
    // Remove excess away goal slots
    while (
      newDetails.filter((d) => d.scoringTeamId === "away").length > awayGoals
    ) {
      const idx = newDetails.findLastIndex((d) => d.scoringTeamId === "away");
      if (idx !== -1) newDetails.splice(idx, 1);
    }

    // Sort details so home is first, then away for better UX
    newDetails.sort((a, b) => (a.scoringTeamId === "home" ? -1 : 1));
    setGoalDetails(newDetails);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeGoals, awayGoals]);

  const getPlayersByTeam = (teamName: string) => {
    const idx = TEAM_NAMES.indexOf(teamName);
    if (idx === -1) return [];
    return teamsData[idx] || [];
  };

  const handleAddMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeam || !awayTeam || homeTeam === awayTeam) {
      alert("Pilih tim home dan away dengan benar!");
      return;
    }

    // Basic validation for goal details
    const missingScorer = goalDetails.some((g) => !g.playerId);
    if (missingScorer && (homeGoals > 0 || awayGoals > 0)) {
      if (
        !confirm(
          "Ada gol yang belum ditentukan pencetaknya. Lanjutkan tanpa pencetak gol?",
        )
      )
        return;
    }

    const newMatch: Match = {
      id: Date.now().toString(),
      homeTeamName: homeTeam,
      awayTeamName: awayTeam,
      homeGoals,
      awayGoals,
      goalDetails,
      timestamp: Date.now(),
    };

    setMatches([newMatch, ...matches]);

    // Reset form
    setIsAddingMatch(false);
    setHomeTeam("");
    setAwayTeam("");
    setHomeGoals(0);
    setAwayGoals(0);
    setGoalDetails([]);
  };

  const handleDeleteMatch = (id: string) => {
    if (confirm("Hapus pertandingan ini? Statistik akan dihitung ulang.")) {
      setMatches(matches.filter((m) => m.id !== id));
    }
  };

  // --- CALCULATIONS ---

  // 1. Calculate Team Standings dynamically
  const standingsMap = new Map<string, TeamStat>();

  TEAM_NAMES.forEach((name, idx) => {
    // Generate a consistent logo per team name
    const seed = name.replace(/\s/g, "");
    standingsMap.set(name, {
      name: name,
      logo: `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=047857`,
      played: 0,
      win: 0,
      draw: 0,
      lose: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  });

  matches.forEach((m) => {
    const home = standingsMap.get(m.homeTeamName);
    const away = standingsMap.get(m.awayTeamName);

    if (home && away) {
      home.played += 1;
      home.goalsFor += m.homeGoals;
      home.goalsAgainst += m.awayGoals;

      away.played += 1;
      away.goalsFor += m.awayGoals;
      away.goalsAgainst += m.homeGoals;

      if (m.homeGoals > m.awayGoals) {
        home.win += 1;
        home.points += 3;
        away.lose += 1;
      } else if (m.homeGoals < m.awayGoals) {
        away.win += 1;
        away.points += 3;
        home.lose += 1;
      } else {
        home.draw += 1;
        home.points += 1;
        away.draw += 1;
        away.points += 1;
      }
    }
  });

  const standings = Array.from(standingsMap.values())
    .map((sw) => {
      sw.goalDifference = sw.goalsFor - sw.goalsAgainst;
      return sw;
    })
    .sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.goalDifference !== b.goalDifference)
        return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

  // 2. Calculate Top Scorers dynamically
  const playerGoalCount: Record<string, number> = {};

  matches.forEach((m) => {
    m.goalDetails.forEach((g) => {
      if (g.playerId) {
        playerGoalCount[g.playerId] = (playerGoalCount[g.playerId] || 0) + 1;
      }
    });
  });

  const topScorers: PlayerStat[] = [];
  TEAM_NAMES.forEach((teamName, idx) => {
    const teamPlayers = teamsData[idx] || [];
    teamPlayers.forEach((p) => {
      if (p.categoryId !== 1 && playerGoalCount[p.id]) {
        // Exclude Goalkeepers generically (Cat 1 is GK in spin logic)
        topScorers.push({
          id: p.id,
          name: p.name.replace(/\(GK\)/g, "").trim(),
          teamName: teamName,
          goals: playerGoalCount[p.id],
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`,
          isGoalkeeper: false,
        });
      }
    });
  });

  topScorers.sort((a, b) => b.goals - a.goals);
  const top5Scorers = topScorers.slice(0, 5);

  // 3. Calculate Best Goalkeepers
  const goalkeepers: PlayerStat[] = [];
  TEAM_NAMES.forEach((teamName, idx) => {
    const teamPlayers = teamsData[idx] || [];
    // Assume categoryId 1 or name contains (GK) is goalkeeper
    teamPlayers
      .filter((p) => p.categoryId === 1 || p.name.includes("(GK)"))
      .forEach((gk) => {
        const teamStat = standingsMap.get(teamName);
        if (teamStat && teamStat.played > 0) {
          // Only rank if team played
          goalkeepers.push({
            id: gk.id,
            name: gk.name.replace(/\(GK\)/g, "").trim(),
            teamName: teamName,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${gk.name}`,
            goals: teamStat.goalsAgainst, // We temporarily use 'goals' to store goals conceded for the GK struct
            isGoalkeeper: true,
          });
        }
      });
  });

  // Sort GKs by goals conceded (ascending)
  goalkeepers.sort((a, b) => a.goals - b.goals);
  const best3Goalkeepers = goalkeepers.slice(0, 3);

  // Keep Hydration clean
  if (!isMounted) return <div className="py-24 bg-slate-50 min-h-screen"></div>;

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 relative z-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
            Liga Selasa{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Statistik
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Klasemen sementara hasil pertandingan, pencetak gol terbanyak, dan
            kiper terbaik dinamis.
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
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-300">
          {/* STANDINGS TABLE */}
          {activeTab === "standings" && (
            <div className="overflow-x-auto">
              {standings.every((s) => s.played === 0) ? (
                <div className="p-12 text-center text-slate-500">
                  <p>
                    Belum ada pertandingan dicatat. Beralih ke tab{" "}
                    <b>Pertandingan</b> untuk menginput skor.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="p-4 text-center w-16">Pos</th>
                      <th className="p-4">Klub</th>
                      <th className="p-4 text-center" title="Main">
                        M
                      </th>
                      <th className="p-4 text-center" title="Menang">
                        M
                      </th>
                      <th className="p-4 text-center" title="Seri">
                        S
                      </th>
                      <th className="p-4 text-center" title="Kalah">
                        K
                      </th>
                      <th
                        className="p-4 text-center hidden sm:table-cell"
                        title="Gol Memasukan"
                      >
                        GM
                      </th>
                      <th
                        className="p-4 text-center hidden sm:table-cell"
                        title="Gol Kemasukan"
                      >
                        GK
                      </th>
                      <th
                        className="p-4 text-center font-bold"
                        title="Selisih Gol"
                      >
                        SG
                      </th>
                      <th className="p-4 text-center font-bold text-primary dark:text-green-400 text-base">
                        PTS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {standings.map((team, index) => (
                      <tr
                        key={team.name}
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
              {top5Scorers.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  Belum ada pemain yang mencetak gol.
                </div>
              ) : (
                <div className="grid gap-4">
                  {top5Scorers.map((player, index) => (
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
              {best3Goalkeepers.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  Belum ada kiper yang bermain. Pastikan tim sudah melakukan
                  pertandingan.
                </div>
              ) : (
                <div className="grid gap-4">
                  {best3Goalkeepers.map((gk, index) => (
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
                          className="w-full bg-slate-50 border border-slate-300 dark:bg-slate-900 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={homeTeam}
                          onChange={(e) => setHomeTeam(e.target.value)}
                        >
                          <option value="">Pilih Tim</option>
                          {TEAM_NAMES.map((t) => (
                            <option key={t} value={t} disabled={t === awayTeam}>
                              {t}
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
                          className="w-full bg-slate-50 border border-slate-300 dark:bg-slate-900 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={awayTeam}
                          onChange={(e) => setAwayTeam(e.target.value)}
                        >
                          <option value="">Pilih Tim</option>
                          {TEAM_NAMES.map((t) => (
                            <option key={t} value={t} disabled={t === homeTeam}>
                              {t}
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
                            {homeTeam}
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
                            {awayTeam}
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
                              ? getPlayersByTeam(homeTeam)
                              : getPlayersByTeam(awayTeam);
                            const teamL = isHome ? homeTeam : awayTeam;

                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 sm:p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm"
                              >
                                <span
                                  className={`text-xs font-bold w-16 px-2 py-1.5 rounded text-center whitespace-nowrap ${
                                    isHome
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                                      : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
                                  }`}
                                >
                                  Skor {isHome ? "Home" : "Away"}
                                </span>
                                <select
                                  className="flex-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-sm rounded-md outline-none p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                  value={detail.playerId}
                                  onChange={(e) => {
                                    const newDetails = [...goalDetails];
                                    newDetails[idx].playerId = e.target.value;
                                    setGoalDetails(newDetails);
                                  }}
                                >
                                  <option value="">
                                    (Pilih Pemain {teamL})
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
                          * Kosongkan jika tim {homeTeam} / {awayTeam} belum
                          dibuat di draft atas / bunuh diri
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        className="bg-secondary text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-[#eacc00] transition-colors w-full sm:w-auto shadow-md"
                      >
                        Simpan Pertandingan
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
                    Belum ada hasil pertandingan. <br />
                    Klik Tambah Hasil untuk memasukkan data.
                  </div>
                ) : (
                  matches.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 group"
                    >
                      <div className="flex-1 flex justify-end items-center gap-3 w-full">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {m.homeTeamName}
                        </span>
                        <span
                          className={`text-2xl font-black ${m.homeGoals > m.awayGoals ? "text-primary" : "text-slate-600"}`}
                        >
                          {m.homeGoals}
                        </span>
                      </div>

                      <div className="bg-slate-100 dark:bg-slate-700 text-slate-500 font-bold px-3 py-1 rounded-md text-xs tracking-widest uppercase mb-2 sm:mb-0">
                        VS
                      </div>

                      <div className="flex-1 flex justify-start items-center gap-3 w-full">
                        <span
                          className={`text-2xl font-black ${m.awayGoals > m.homeGoals ? "text-primary" : "text-slate-600"}`}
                        >
                          {m.awayGoals}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {m.awayTeamName}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteMatch(m.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all absolute right-4 sm:relative sm:right-0"
                        title="Hapus pertandingan"
                      >
                        <Trash2 size={18} />
                      </button>
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
