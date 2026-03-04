import React from "react";

const staffs = [
  {
    id: 1,
    name: "Lorem",
    position: "Manajer Tim",
  },
  {
    id: 2,
    name: "Lorem",
    position: "Pelatih Kepala",
  },
  {
    id: 3,
    name: "Lorem",
    position: "Asisten Pelatih",
  },
  {
    id: 4,
    name: "Lorem",
    position: "Fisioterapis",
  },
  {
    id: 5,
    name: "Lorem",
    position: "Kitman",
  },
  {
    id: 6,
    name: "Lorem",
    position: "Media Officer",
  },
];

export default function StaffGrid() {
  return (
    <section
      id="staf"
      className="py-20 md:py-32 bg-slate-50 relative overflow-hidden border-t border-slate-200"
    >
      {/* Decorative Grid Line */}
      <div className="absolute top-1/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10 max-w-6xl">
        <div className="text-center mb-16 md:mb-24">
          <h2 className="text-sm font-bold text-secondary uppercase tracking-widest mb-2">
            Di Balik Layar
          </h2>
          <h3 className="text-3xl md:text-5xl font-black text-primary uppercase drop-shadow-sm">
            Jajaran Staf & Manajer
          </h3>
          <div className="w-24 h-1.5 bg-secondary mx-auto mt-6 rounded-full"></div>
          <p className="mt-6 text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">
            Merekalah sosok-sosok penting yang mendedikasikan waktu dan tenaga
            untuk memastikan GBU Futsal Club selalu tampil maksimal di setiap
            pertandingan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-y-16 gap-x-8">
          {staffs.map((staff) => (
            <div key={staff.id} className="group flex flex-col items-center">
              <div className="relative w-40 h-40 mb-6 rounded-full overflow-hidden border-4 border-white shadow-xl group-hover:border-secondary transition-colors duration-500 transform group-hover:-translate-y-2">
                {/* Image Placeholder using UI Avatars API */}
                <div className="w-full h-full bg-slate-200 flex items-center justify-center relative overflow-hidden">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(staff.name)}&background=1b3a68&color=ffffff&size=160&font-size=0.33`}
                    alt={staff.name}
                    className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300"></div>
                </div>
              </div>

              <h4 className="text-xl font-bold text-primary group-hover:text-secondary transition-colors duration-300 text-center">
                {staff.name}
              </h4>
              <p className="text-slate-500 font-medium text-sm text-center mt-2 bg-white px-5 py-1.5 rounded-full shadow-sm border border-slate-100 group-hover:shadow-md transition-shadow">
                {staff.position}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
