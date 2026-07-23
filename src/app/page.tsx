import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import {
  ImpactSection,
  CtaSection,
  Footer,
} from "@/components/landing/ImpactCtaFooter";

export const metadata: Metadata = {
  title:
    "SisaPangan Solo | Platform Koordinasi Penyelamatan Pangan Solo Raya",
  description:
    "Platform digital yang menghubungkan donor pangan (UMKM, restoran, katering), relawan, dan penerima manfaat untuk mengurangi pemborosan makanan di kawasan Solo Raya.",
  keywords: [
    "food rescue Solo",
    "penyelamatan pangan Surakarta",
    "donasi makanan Solo",
    "relawan pangan Solo Raya",
    "food waste reduction",
    "UMKM kuliner Solo",
  ],
  openGraph: {
    title: "SisaPangan Solo | Pangan Sisa, Bukan Sampah.",
    description:
      "Menghubungkan UMKM kuliner, relawan, dan penerima manfaat dalam satu alur digital penyelamatan pangan.",
    locale: "id_ID",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <ImpactSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
