import Hero from "@/components/Hero";
import Achievements from "@/components/Achievements";
import RamadhanCup from "@/components/RamadhanCup";
import LigaSelasaSpin from "@/components/LigaSelasaSpin";
import LigaSelasaStandings from "@/components/LigaSelasaStandings";
import StaffGrid from "@/components/StaffGrid";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <Achievements />
      <RamadhanCup />
      <LigaSelasaSpin />
      <LigaSelasaStandings />
      <StaffGrid />

      {/* Simple Footer */}
      <footer className="bg-primary text-white py-8 text-center border-t-4 border-secondary">
        <p className="text-sm text-slate-300">
          &copy; {new Date().getFullYear()} GBU Futsal Academy. All rights
          reserved.
        </p>
      </footer>
    </main>
  );
}
