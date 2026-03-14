"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Player = {
  id: string;
  name: string;
  is_gk: boolean;
};

type TeamWithPlayers = {
  id: string;
  name: string;
  players: Player[];
};

export default function LigaSelasaSpin() {
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeamsAndPlayers() {
      try {
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("id, name")
          .order("name");

        if (teamsError) throw teamsError;

        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select("id, name, is_gk, team_id")
          .order("is_gk", { ascending: false }); // GK first

        if (playersError) throw playersError;

        // Group players by team
        const formattedTeams = teamsData.map((team) => ({
          ...team,
          players: playersData.filter((p) => p.team_id === team.id),
        }));

        setTeams(formattedTeams);
      } catch (err: unknown) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTeamsAndPlayers();
  }, []);

  if (isLoading) {
    return (
      <section id="liga-selasa" className="py-24 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl font-bold text-slate-400">Memuat Data Tim...</div>
      </section>
    );
  }

  if (error) {
     return (
       <section id="liga-selasa" className="py-24 bg-slate-50 min-h-screen flex items-center justify-center">
         <div className="text-red-500 text-center">
            <h2 className="text-2xl font-bold mb-2">Gagal Memuat Data</h2>
            <p>{error}</p>
         </div>
       </section>
     )
  }

  return (
    <section id="liga-selasa" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 z-10 relative">
        <div className="text-center mb-16 relative">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            Tim{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-600">
              LigaSelasa
            </span>
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed mb-6">
            Daftar tim dan pemain yang telah ditetapkan secara resmi.
          </p>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-3xl p-8 shadow-lg border-2 border-slate-100 hover:border-primary/30 hover:shadow-xl transition-all duration-300 flex flex-col h-full"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-slate-100">
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                  {team.name}
                </h4>
                <div className="px-4 py-1.5 rounded-full text-sm font-bold bg-primary/10 text-primary-dark flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>{team.players.length} Pemain</span>
                </div>
              </div>

              <ul className="space-y-3 flex-grow">
                {team.players.map((player, idx) => (
                  <li
                    key={player.id}
                    className="p-4 rounded-2xl flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border border-transparent"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Pemain {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800">
                        {player.name}
                        {player.is_gk && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary/20 text-slate-700">
                            GK
                          </span>
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
