"use client";

import React, { useState } from "react";

const history = [
  {
    year: "2026",
    edition: "Edisi Ke-4",
    champion: "Tim Bima",
    mvp: "Andi 'The Flash'",
    description:
      "Pertandingan final yang sangat sengit melawan Tim Yudhistira, dimenangkan lewat adu penalti yang mendebarkan di menit terakhir.",
  },
  {
    year: "2025",
    edition: "Edisi Ke-4",
    champion: "Tim Bima",
    mvp: "Andi 'The Flash'",
    description:
      "Pertandingan final yang sangat sengit melawan Tim Yudhistira, dimenangkan lewat adu penalti yang mendebarkan di menit terakhir.",
  },
  {
    year: "2024",
    edition: "Edisi Ke-4",
    champion: "Tim Bima",
    mvp: "Andi 'The Flash'",
    description:
      "Pertandingan final yang sangat sengit melawan Tim Yudhistira, dimenangkan lewat adu penalti yang mendebarkan di menit terakhir.",
  },
  {
    year: "2023",
    edition: "Edisi Ke-3",
    champion: "Tim Arjuna",
    mvp: "Budi Santoso",
    description:
      "Dominasi penuh dari Tim Arjuna sepanjang turnamen tanpa menelan satu kekalahan pun, mencatat rekor gol terbanyak dalam satu edisi.",
  },
  {
    year: "2022",
    edition: "Edisi Ke-2",
    champion: "Tim Nakula",
    mvp: "Reza Pratama",
    description:
      "Kejutan luar biasa dari tim kuda hitam yang berhasil menembus final dan menjuarai turnamen berkat strategi pertahanan grendel.",
  },
  {
    year: "2021",
    edition: "Edisi Ke-1",
    champion: "Tim Bima",
    mvp: "Fajar Rizky",
    description:
      "Edisi perdana yang sukses besar, meletakkan fondasi tradisi Ramadhan Cup kita yang mengedepankan silaturahmi dan kompetisi sehat.",
  },
];

export default function RamadhanCup() {
  const [showAll, setShowAll] = useState(false);
  const displayedHistory = showAll ? history : history.slice(0, 3);

  return (
    <section id="ramadhancup" className="py-20 md:py-32 bg-white relative">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16 md:mb-24 relative z-10">
          <h2 className="text-sm font-bold text-secondary uppercase tracking-widest mb-2">
            Event Internal Tahunan
          </h2>
          <h3 className="text-3xl md:text-5xl font-black text-primary uppercase drop-shadow-sm">
            Liga Selasa <span className="text-secondary">Ramadhan Cup</span>
          </h3>
          <p className="mt-6 text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">
            Sejarah panjang persaingan sehat antar anggota GBU Futsal Club yang
            selalu dinanti setiap bulan suci Ramadhan. Tradisi, kehormatan, dan
            persaudaraan.
          </p>
        </div>

        <div className="relative border-l-4 border-slate-100 ml-4 md:ml-0 md:mx-auto md:w-full md:flex md:flex-col md:items-center md:border-none z-10">
          {/* Central Line for Desktop */}
          <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-1 md:-ml-[2px] bg-slate-100"></div>

          <div className="flex flex-col gap-12 md:gap-20 w-full">
            {displayedHistory.map((item, index) => (
              <div
                key={item.year}
                className={`relative flex flex-col md:flex-row items-start md:items-center w-full ${index % 2 === 0 ? "md:flex-row-reverse" : ""}`}
              >
                {/* Timeline Dot */}
                <div className="absolute -left-[14px] md:static md:left-auto mt-1.5 md:mt-0 w-8 h-8 rounded-full bg-secondary border-4 border-white shadow-md z-10 md:mx-8 flex-shrink-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>

                {/* Content Panel */}
                <div className="ml-8 md:ml-0 md:w-1/2 w-[calc(100%-2.5rem)] group pr-4 md:pr-0">
                  <div
                    className={`bg-slate-50 p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-primary/20 max-w-lg relative overflow-hidden ${index % 2 === 0 ? "md:ml-auto md:text-right" : "md:mr-auto"}`}
                  >
                    <div
                      className={`absolute top-0 w-full h-1 bg-gradient-to-r from-primary to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ${index % 2 === 0 ? "right-0 origin-right" : "left-0 origin-left"}`}
                    ></div>

                    <span className="inline-block px-4 py-1.5 bg-primary/5 text-primary font-bold text-xs rounded-full mb-4 md:mb-5">
                      {item.edition} - {item.year}
                    </span>
                    <h4
                      className={`text-2xl font-bold text-primary mb-2 flex items-center gap-2 ${index % 2 === 0 ? "md:justify-end" : ""}`}
                    >
                      {item.champion}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-amber-500 hidden sm:block"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C8.686 2 6 4.686 6 8C6 8.356 6.035 8.705 6.101 9.043C4.301 9.489 3 11.089 3 13C3 15.206 4.794 17 7 17H8.261C9.648 20.354 12.067 22 12.067 22C12.067 22 14.352 20.354 15.739 17H17C19.206 17 21 15.206 21 13C21 11.089 19.699 9.489 17.899 9.043C17.965 8.705 18 8.356 18 8C18 4.686 15.314 2 12 2ZM7 15C5.897 15 5 14.103 5 13C5 11.897 5.897 11 7 11H7.551C7.818 12.427 8.361 13.784 9.141 15H7ZM17 15H14.859C15.639 13.784 16.182 12.427 16.449 11H17C18.103 11 19 11.897 19 13C19 14.103 18.103 15 17 15Z" />
                      </svg>
                    </h4>
                    <p
                      className={`text-sm font-medium text-slate-500 mb-4 block ${index % 2 === 0 ? "md:justify-end" : ""}`}
                    >
                      MVP: <span className="text-secondary">{item.mvp}</span>
                    </p>
                    <p className="text-slate-600 font-light text-sm md:text-base leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {history.length > 3 && (
            <div className="mt-16 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-8 py-3 bg-white border-2 border-primary text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-all duration-300 shadow-sm relative z-20"
              >
                {showAll ? "Semua Edisi Ditampilkan ()" : "Lihat Selengkapnya"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
