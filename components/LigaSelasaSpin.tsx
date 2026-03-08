"use client";

import { useEffect, useRef, useState } from "react";

const TEAM_NAMES = [
  "Pokemon",
  "Naruto",
  "Tsubasa",
  "Power Rangers",
  "Doraemon",
  "Jumbo",
];

const CATEGORIES = [
  "Kategori 1 (Kiper)",
  "Kategori 2",
  "Kategori 3",
  "Kategori 4",
  "Kategori 5",
  "Kategori 6",
  "Kategori 7",
  "Kategori 8",
];

type Player = {
  id: string;
  name: string;
  categoryId: number; // 1 to 8 index based
};

const CATEGORY_DATA: Record<number, string[]> = {
  1: [
    "(GK) Dimas",
    "(GK) Mamun",
    "(GK) Bayu",
    "(GK) Gilang",
    "(GK) Fatih",
    "(GK) Rizal",
  ],
  2: ["Kaji", "Ambon", "Ari", "Alvin", "Pumandala", "Mas windo"],
  3: ["Abidin", "Somad", "Fido", "Oki", "Fayed", "Yai"],
  4: ["Riza", "Rafliagusta", "Abdul", "Adit", "Dobleh", "Anif", "Qodri"],
  5: ["Ziyan", "Kaukaba", "Raja", "Aldo", "Dimas Arya", "Shadiq"],
  6: ["El", "Aufa", "Soman", "Altan", "Farel", "Reza Andika"],
  7: ["Jeki", "Poci", "Wafa", "Rizal", "Vino", "Praja"],
  8: ["Baim", "Ikal", "Fadhil", "Rizky dembele", "Mirza", "Rapi"],
};

const INITIAL_PLAYERS: Player[] = [];
for (let c = 1; c <= CATEGORIES.length; c++) {
  const players = CATEGORY_DATA[c];
  players.forEach((playerName, idx) => {
    INITIAL_PLAYERS.push({
      id: `c${c}-p${idx + 1}`,
      name: playerName,
      categoryId: c,
    });
  });
}

export default function LigaSelasaSpin() {
  const [availablePlayers, setAvailablePlayers] =
    useState<Player[]>(INITIAL_PLAYERS);
  const [teams, setTeams] = useState<Player[][]>(TEAM_NAMES.map(() => []));
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(1);

  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<Player | null>(null);
  const [displayValue, setDisplayValue] = useState<string>("Siap Mengacak!");

  const [isMounted, setIsMounted] = useState(false);
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial state from local storage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedAvailablePlayers = localStorage.getItem("ls_availablePlayers");
    const savedTeams = localStorage.getItem("ls_teams");
    const savedTeamIdx = localStorage.getItem("ls_currentTeamIndex");
    const savedCatIdx = localStorage.getItem("ls_currentCategoryIndex");

    if (savedAvailablePlayers)
      setAvailablePlayers(JSON.parse(savedAvailablePlayers));
    if (savedTeams) setTeams(JSON.parse(savedTeams));
    if (savedTeamIdx) setCurrentTeamIndex(parseInt(savedTeamIdx, 10));
    if (savedCatIdx) setCurrentCategoryIndex(parseInt(savedCatIdx, 10));

    if (savedTeamIdx && parseInt(savedTeamIdx, 10) >= TEAM_NAMES.length) {
      if (
        savedAvailablePlayers &&
        JSON.parse(savedAvailablePlayers).length > 0
      ) {
        setDisplayValue("Siap Mengacak!");
      } else {
        setDisplayValue("Draft Selesai 🎉");
      }
    }

    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    };
  }, []);

  // Save state to local storage whenever it changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(
        "ls_availablePlayers",
        JSON.stringify(availablePlayers),
      );
      localStorage.setItem("ls_teams", JSON.stringify(teams));
      localStorage.setItem("ls_currentTeamIndex", currentTeamIndex.toString());
      localStorage.setItem(
        "ls_currentCategoryIndex",
        currentCategoryIndex.toString(),
      );
    }
  }, [
    availablePlayers,
    teams,
    currentTeamIndex,
    currentCategoryIndex,
    isMounted,
  ]);

  const handleReset = () => {
    if (confirm("Apakah Anda yakin ingin mereset seluruh hasil draft?")) {
      setAvailablePlayers(INITIAL_PLAYERS);
      setTeams(TEAM_NAMES.map(() => []));
      setCurrentTeamIndex(0);
      setCurrentCategoryIndex(1);
      setDisplayValue("Siap Mengacak!");
      setSpinResult(null);
    }
  };

  const handleAutoFill = () => {
    if (confirm("Acak cepat seluruh sisa pemain (Mode Dev)?")) {
      let currentAvail = [...availablePlayers];
      const currentTms = teams.map((t) => [...t]);
      let currTeamIdx = currentTeamIndex;
      let currCatIdx = currentCategoryIndex;

      // Regular categories
      while (currTeamIdx < TEAM_NAMES.length) {
        const catPlayers = currentAvail.filter(
          (p) => p.categoryId === currCatIdx,
        );

        if (catPlayers.length > 0) {
          const winnerIndex = Math.floor(Math.random() * catPlayers.length);
          const winner = catPlayers[winnerIndex];

          currentAvail = currentAvail.filter((p) => p.id !== winner.id);
          currentTms[currTeamIdx].push(winner);
        }

        currCatIdx++;
        if (currCatIdx > CATEGORIES.length) {
          currCatIdx = 1;
          currTeamIdx++;
        }
      }

      // Extra players
      while (currentAvail.length > 0) {
        const extraPlayer = currentAvail[0];
        const winnerTeamIndex = Math.floor(Math.random() * TEAM_NAMES.length);

        currentAvail = currentAvail.filter((p) => p.id !== extraPlayer.id);
        currentTms[winnerTeamIndex].push(extraPlayer);
      }

      setAvailablePlayers(currentAvail);
      setTeams(currentTms);
      setCurrentTeamIndex(TEAM_NAMES.length);
      setCurrentCategoryIndex(CATEGORIES.length + 1);
      setDisplayValue("Draft Selesai 🎉");
      setSpinResult(null);
    }
  };

  const handleSpin = () => {
    if (isSpinning) return;
    if (currentTeamIndex >= TEAM_NAMES.length && availablePlayers.length === 0)
      return;

    if (currentTeamIndex >= TEAM_NAMES.length && availablePlayers.length > 0) {
      setIsSpinning(true);
      setSpinResult(null);

      const extraPlayer = availablePlayers[0];
      const winnerTeamIndex = Math.floor(Math.random() * TEAM_NAMES.length);
      const winnerTeamName = TEAM_NAMES[winnerTeamIndex];

      let spinCount = 0;
      const maxSpins = 20;
      const spinSpeed = 100;

      spinIntervalRef.current = setInterval(() => {
        setDisplayValue(
          TEAM_NAMES[Math.floor(Math.random() * TEAM_NAMES.length)],
        );
        spinCount++;
        if (spinCount >= maxSpins) {
          if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);

          setDisplayValue(winnerTeamName);
          setSpinResult(extraPlayer);
          setIsSpinning(false);

          setTimeout(() => {
            setAvailablePlayers((prev) =>
              prev.filter((p) => p.id !== extraPlayer.id),
            );
            setTeams((prevTeams) => {
              const newTeams = [...prevTeams];
              newTeams[winnerTeamIndex] = [
                ...newTeams[winnerTeamIndex],
                extraPlayer,
              ];
              return newTeams;
            });

            setDisplayValue(
              availablePlayers.length > 1
                ? "Siap Mengacak!"
                : "Draft Selesai 🎉",
            );
            setSpinResult(null);
          }, 1500);
        }
      }, spinSpeed);
      return;
    }

    setIsSpinning(true);
    setSpinResult(null);

    const categoryPlayers = availablePlayers.filter(
      (p) => p.categoryId === currentCategoryIndex,
    );

    if (categoryPlayers.length === 0) {
      setIsSpinning(false);
      return;
    }

    const winnerIndex = Math.floor(Math.random() * categoryPlayers.length);
    const winner = categoryPlayers[winnerIndex];

    let spinCount = 0;
    const maxSpins = 20;
    const spinSpeed = 100;

    const teamIdx = currentTeamIndex;
    const catIdx = currentCategoryIndex;

    spinIntervalRef.current = setInterval(() => {
      const randomDisplayIndex = Math.floor(
        Math.random() * categoryPlayers.length,
      );
      setDisplayValue(categoryPlayers[randomDisplayIndex].name);

      spinCount++;
      if (spinCount >= maxSpins) {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);

        setDisplayValue(winner.name);
        setSpinResult(winner);
        setIsSpinning(false);

        // Advance draft state after a short delay so user can see result
        setTimeout(() => {
          setAvailablePlayers((prev) => prev.filter((p) => p.id !== winner.id));

          setTeams((prevTeams) => {
            const newTeams = [...prevTeams];
            newTeams[teamIdx] = [...newTeams[teamIdx], winner];
            return newTeams;
          });

          let nextCategory = catIdx + 1;
          let nextTeam = teamIdx;

          if (nextCategory > CATEGORIES.length) {
            nextCategory = 1;
            nextTeam++;
          }

          setCurrentCategoryIndex(nextCategory);
          setCurrentTeamIndex(nextTeam);
          setDisplayValue(
            nextTeam < TEAM_NAMES.length || availablePlayers.length > 1
              ? "Siap Mengacak!"
              : "Draft Selesai 🎉",
          );
          setSpinResult(null);
        }, 1500);
      }
    }, spinSpeed);
  };

  // Prevent hydration mismatch by not rendering main UI until mounted
  if (!isMounted) return <div className="py-24 bg-slate-50 min-h-screen"></div>;

  return (
    <section
      id="liga-selasa"
      className="py-24 bg-slate-50 relative overflow-hidden"
    >
      {/* Custom Keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes popIn {
            0% { transform: scale(0.5); opacity: 0; }
            70% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-popIn {
            animation: popIn 0.3s ease-out forwards;
          }
        `,
        }}
      />

      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 z-10 relative">
        <div className="text-center mb-16 relative">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            Draft{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-600">
              LigaSelasa
            </span>
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed mb-6">
            Sistem pengundian acak untuk mendistribusikan pemain ke dalam 6 tim
            secara adil berdasarkan 8 kategori. Progres Anda otomatis tersimpan.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-full transition-colors active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reset Draft
            </button>
            {process.env.NODE_ENV === "development" && (
              <button
                onClick={handleAutoFill}
                disabled={
                  currentTeamIndex >= TEAM_NAMES.length &&
                  availablePlayers.length === 0
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-sm font-bold rounded-full transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⚡ Acak Cepat (Dev)
              </button>
            )}
          </div>
        </div>

        {/* Spin Area Main Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden mb-20 border border-slate-100">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
            <h3 className="text-3xl font-black uppercase tracking-widest relative z-10 text-secondary drop-shadow-md">
              {currentTeamIndex < TEAM_NAMES.length
                ? `Drafting: ${TEAM_NAMES[currentTeamIndex]}`
                : availablePlayers.length > 0
                  ? "Extra Draft"
                  : "Draft Selesai 🎉"}
            </h3>
            <p className="text-slate-300 mt-2 text-lg font-medium relative z-10">
              {currentTeamIndex < TEAM_NAMES.length
                ? `Mencari Pemain untuk ${CATEGORIES[currentCategoryIndex - 1]}`
                : availablePlayers.length > 0
                  ? `Mencari Tim untuk ${availablePlayers[0].name}`
                  : "Semua tim telah berhasil terbentuk!"}
            </p>
          </div>

          <div className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[350px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-white">
            <div className="w-full max-w-2xl bg-white rounded-3xl p-8 md:p-12 mb-10 flex items-center justify-center shadow-[inset_0_2px_20px_rgba(0,0,0,0.05)] border-2 border-slate-100 relative overflow-hidden transition-all duration-300 min-h-[160px]">
              <span
                className={`text-3xl md:text-5xl lg:text-6xl font-black text-center transition-all duration-200 z-10 ${
                  isSpinning
                    ? "text-slate-400 blur-[1px] scale-105"
                    : spinResult
                      ? "text-primary scale-110 drop-shadow-lg"
                      : "text-slate-700"
                }`}
              >
                {displayValue}
              </span>

              {spinResult && (
                <div className="absolute inset-0 border-4 border-primary rounded-3xl animate-pulse pointer-events-none"></div>
              )}
            </div>

            {(currentTeamIndex < TEAM_NAMES.length ||
              availablePlayers.length > 0) && (
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className="group relative bg-secondary hover:bg-[#e6c200] text-slate-900 font-bold text-xl md:text-2xl py-5 px-14 rounded-full shadow-xl hover:shadow-2xl transition-all active:scale-95 uppercase tracking-widest overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                <span className="relative">
                  {isSpinning
                    ? "Mengacak..."
                    : currentTeamIndex < TEAM_NAMES.length
                      ? `Spin Kategori ${currentCategoryIndex}`
                      : `Spin Tim`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TEAM_NAMES.map((name, idx) => ({ teamName: name, idx }))
            .sort((a, b) => {
              if (a.idx === currentTeamIndex) return -1;
              if (b.idx === currentTeamIndex) return 1;
              return a.idx - b.idx;
            })
            .map(({ teamName, idx }) => (
              <div
                key={teamName}
                className={`bg-white rounded-3xl p-8 shadow-lg border-2 transition-all duration-500 ease-out flex flex-col ${
                  currentTeamIndex === idx
                    ? "border-secondary shadow-secondary/20 shadow-[-5px_-5px_20px_rgba(0,0,0,0.05),_5px_5px_20px_rgba(250,204,21,0.2)] scale-[1.03] ring-4 ring-secondary/20 z-10"
                    : teams[idx].length >= CATEGORIES.length
                      ? "border-primary/30 bg-primary/[0.02]"
                      : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-slate-100">
                  <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                    {teamName}
                  </h4>
                  <div
                    className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${
                      teams[idx].length >= CATEGORIES.length
                        ? "bg-primary/20 text-primary-dark"
                        : currentTeamIndex === idx
                          ? "bg-secondary/20 text-slate-800"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {teams[idx].length >= CATEGORIES.length && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-primary font-bold"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    )}
                    <span>
                      {teams[idx].length} / {CATEGORIES.length}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 flex-grow">
                  {Array.from({
                    length: Math.max(CATEGORIES.length, teams[idx].length),
                  }).map((_, slotIdx) => {
                    const player = teams[idx][slotIdx];
                    let catLabel = `Kat ${slotIdx + 1}`;
                    if (player) {
                      catLabel = `Kat ${player.categoryId}`;
                    } else if (slotIdx >= CATEGORIES.length) {
                      catLabel = "Extra";
                    }

                    const isCurrentBeingDrafted =
                      currentTeamIndex === idx &&
                      currentCategoryIndex === slotIdx + 1 &&
                      slotIdx < CATEGORIES.length;

                    return (
                      <li
                        key={slotIdx}
                        className={`p-4 rounded-2xl flex items-center justify-between transition-all duration-300 ${
                          player
                            ? "bg-primary/10 border border-primary/20"
                            : isCurrentBeingDrafted
                              ? "bg-secondary/10 border-2 border-secondary/50 shadow-inner"
                              : "bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                            {catLabel}
                          </span>
                          <span
                            className={`font-bold transition-all truncate max-w-[150px] ${
                              player
                                ? "text-slate-800"
                                : isCurrentBeingDrafted
                                  ? "text-slate-600 animate-pulse"
                                  : "text-slate-400"
                            }`}
                          >
                            {player ? player.name.split(" (")[0] : "..."}
                          </span>
                        </div>
                        {player && (
                          <div className="min-w-[28px] h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md animate-popIn">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
