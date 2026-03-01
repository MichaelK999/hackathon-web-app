import { NavBar } from "@/components/landing/NavBar";
import { Hero } from "@/components/landing/Hero";
import { Footer } from "@/components/landing/Footer";
import { ParisMapSection } from "@/components/landing/ParisMapSection";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f23]">
      <NavBar />
      <Hero />
      <ParisMapSection />
      <Footer />
    </div>
  );
}
