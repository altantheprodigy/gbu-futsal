"use client";

import React, { useState } from "react";

const achievements = [
  {
    id: 1,
    year: "2025",
    title: "Juara 1 Kejuaraan Tarkam Kemenpora",
    description:
      "Meraih gelar juara pertama di Kejuaraan Tarkam Kemenpora dengan performa gemilang.",
    type: "gold",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-100",
    image: "/ChampionAssets/kemenpora_1.jpeg",
  },
  {
    id: 2,
    year: "Terbaru",
    title: "Juara 1 Sukun Futsal League",
    description:
      "Menjadi kampiun dalam kompetisi Sukun Futsal League setelah menampilkan permainan solid tak terkalahkan.",
    type: "gold",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-100",
    image: "/ChampionAssets/sukun_1.jpeg",
  },
  {
    id: 3,
    year: "2014",
    title: "Juara 1 Kompi Cup",
    description:
      "Membawa pulang piala utama di turnamen Kompi berkat kerja sama tim dan strategi efektif.",
    type: "gold",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-100",
    image: "/ChampionAssets/kompi_1.jpeg",
  },
  {
    id: 4,
    year: "Terbaru",
    title: "Juara 3 AD Astra Cup",
    description:
      "Berhasil mengamankan posisi ketiga di AD Astra Cup dengan semangat juang ekstra.",
    type: "bronze",
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100",
    image: "/ChampionAssets/ad_3.jpeg",
  },
  {
    id: 5,
    year: "2024",
    title: "Juara 3 Ketupat Futsal Cup",
    description:
      "Meraih posisi podium pada turnamen Ketupat Futsal Cup antar komunitas yang sangat kompetitif.",
    type: "bronze",
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100",
    image: "/ChampionAssets/ketupat_3.jpeg",
  },
];

export default function Achievements() {
  const [showAll, setShowAll] = useState(false);
  const displayedAchievements = showAll
    ? achievements
    : achievements.slice(0, 2);

  return (
    <section
      id="prestasi"
      className="py-20 md:py-32 bg-slate-50 relative overflow-hidden border-t-4 border-secondary"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 transform origin-top-right pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-secondary uppercase tracking-widest mb-2">
            Hall of Fame
          </h2>
          <h3 className="text-3xl md:text-5xl font-black text-primary uppercase drop-shadow-sm">
            Prestasi Tim
          </h3>
          <div className="w-24 h-1.5 bg-secondary mx-auto mt-6 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {displayedAchievements.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-b-4 border-transparent hover:border-secondary flex flex-col relative overflow-hidden"
            >
              <div className="w-full relative overflow-hidden bg-slate-200 aspect-[4/3] md:aspect-video rounded-t-2xl">
                <img
                  src={item.image}
                  alt={item.title}
                  className="object-contain w-full h-full transform group-hover:scale-105 transition-transform duration-700 bg-white/5 backdrop-blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${item.iconBg}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-6 w-6 ${item.iconColor}`}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C8.686 2 6 4.686 6 8C6 8.356 6.035 8.705 6.101 9.043C4.301 9.489 3 11.089 3 13C3 15.206 4.794 17 7 17H8.261C9.648 20.354 12.067 22 12.067 22C12.067 22 14.352 20.354 15.739 17H17C19.206 17 21 15.206 21 13C21 11.089 19.699 9.489 17.899 9.043C17.965 8.705 18 8.356 18 8C18 4.686 15.314 2 12 2ZM7 15C5.897 15 5 14.103 5 13C5 11.897 5.897 11 7 11H7.551C7.818 12.427 8.361 13.784 9.141 15H7ZM17 15H14.859C15.639 13.784 16.182 12.427 16.449 11H17C18.103 11 19 11.897 19 13C19 14.103 18.103 15 17 15Z" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-white bg-primary px-3 py-1 rounded-full shadow-sm">
                    {item.year}
                  </span>
                </div>
              </div>

              <div className="p-6 md:p-8 flex-1 flex flex-col">
                <h4 className="text-xl font-bold text-primary mb-3">
                  {item.title}
                </h4>
                <p className="text-slate-600 font-light text-sm md:text-base leading-relaxed flex-1">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {achievements.length > 2 && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-8 py-3 bg-white border-2 border-primary text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-all duration-300 shadow-sm"
            >
              {showAll ? "Tampilkan Lebih Sedikit" : "Lihat Selengkapnya"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
