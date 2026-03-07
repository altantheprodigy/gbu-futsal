import React from "react";

export default function Hero() {
  return (
    <section className="relative w-full bg-white text-primary overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-white to-white pointer-events-none"></div>

      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

      <div className="container mx-auto px-4 py-24 md:py-32 lg:py-40 flex flex-col items-center text-center relative z-10">
        <div className="mb-8 relative group cursor-default">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative h-32 w-32 md:h-40 md:w-40 bg-white rounded-full flex flex-col items-center justify-center border-4 border-primary shadow-2xl overflow-hidden p-2">
            <img
              src="/logo.png"
              alt="GBU Futsal Logo"
              className="object-contain w-full h-full transform group-hover:scale-110 transition-transform duration-300"
            />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 text-primary drop-shadow-sm uppercase">
          GBU Futsal <span className="text-secondary">Academy</span>
        </h1>

        <p className="text-lg md:text-2xl text-slate-600 mb-10 max-w-2xl font-light leading-relaxed">
          Selamat datang di markas virtual kebanggaan kita. Tempat di mana
          semangat, kerja keras, dan sportivitas berpadu menjadi{" "}
          <strong className="font-semibold text-primary">JUARA</strong>.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 w-full px-4 mt-4">
          <a
            href="#prestasi"
            className="px-8 py-4 bg-secondary text-white font-bold rounded-full hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-secondary/40 transform hover:-translate-y-1 block max-w-xs text-center w-full sm:w-auto min-w-[200px]"
          >
            Lihat Prestasi
          </a>
          <a
            href="#staf"
            className="px-8 py-4 bg-white border-2 border-primary text-primary font-bold rounded-full hover:bg-primary/5 transition-all duration-300 shadow-sm block max-w-xs text-center w-full sm:w-auto min-w-[200px]"
          >
            Jajaran Staf
          </a>
        </div>
      </div>
    </section>
  );
}
