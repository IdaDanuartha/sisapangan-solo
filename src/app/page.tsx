import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { RolesSection } from "@/components/landing/RolesSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CtaBannerSection, Footer } from "@/components/landing/CtaFooter";

export const metadata: Metadata = {
  title:
    "SisaPangan Solo | Platform Penyelamatan Pangan Solo Raya",
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
    url: "https://sisapangan-solo.vercel.app",
    siteName: "SisaPangan Solo",
    images: [
      {
        url: "/images/logo_full.png",
        width: 1200,
        height: 630,
        alt: "SisaPangan Solo Logo",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SisaPangan Solo | Pangan Sisa, Bukan Sampah.",
    description:
      "Menghubungkan UMKM kuliner, relawan, dan penerima manfaat dalam satu alur digital penyelamatan pangan.",
    images: ["/images/logo_full.png"],
  },
};

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <HowItWorksSection />
        <RolesSection />
        <FAQSection />
        <CtaBannerSection />
      </main>
      <Footer />
    </>
  );
}
