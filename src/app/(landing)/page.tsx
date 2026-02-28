import { NavBar } from "@/components/landing/NavBar";
import { Hero } from "@/components/landing/Hero";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fdf6ee] bg-[radial-gradient(ellipse_at_20%_80%,#e8c9a822_0%,transparent_60%),radial-gradient(ellipse_at_80%_20%,#d9775722_0%,transparent_60%)]">
      <NavBar />
      <Hero />
      <Footer />
    </div>
  );
}
