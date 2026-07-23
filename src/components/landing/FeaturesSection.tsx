"use client";

import { useEffect, useRef } from "react";
import {
  Gauge,
  MapPin,
  QrCode,
  BarChart3,
  Route,
  RefreshCcw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";

const features = [
  {
    icon: Gauge,
    title: "Freshness & Risk Score",
    description:
      "Skor kesegaran otomatis (hijau/kuning/merah) berdasarkan kategori makanan, kondisi simpan, dan sisa waktu layak konsumsi.",
    color: "#2F6E4F",
    bg: "#E4F0E8",
  },
  {
    icon: MapPin,
    title: "Smart Matching",
    description:
      "Relawan terdekat dengan kapasitas yang sesuai otomatis diprioritaskan berdasarkan urgensi dan jarak, bukan hanya jarak saja.",
    color: "#E88C2D",
    bg: "#FBEBD8",
  },
  {
    icon: QrCode,
    title: "QR Traceability",
    description:
      "Setiap batch punya QR code unik. Riwayat distribusi bisa dipindai siapa saja, tanpa login, untuk transparansi penuh.",
    color: "#2F6E4F",
    bg: "#E4F0E8",
  },
  {
    icon: BarChart3,
    title: "Impact Dashboard",
    description:
      "Dashboard real-time dengan data total kg diselamatkan, estimasi porsi, dan tren mingguan yang siap dipakai langsung untuk laporan pemerintah.",
    color: "#C1502E",
    bg: "#FBEBD8",
  },
  {
    icon: Route,
    title: "Rute Pickup Relawan",
    description:
      "Relawan bisa lihat daftar pickup yang diklaim, diurutkan berdasarkan urgensi, dan buka rute langsung di Google Maps.",
    color: "#2F6E4F",
    bg: "#E4F0E8",
  },
  {
    icon: RefreshCcw,
    title: "Surplus Rutin",
    description:
      "Kantin dan katering bisa simpan template surplus berulang, sehingga konfirmasi batch harian hanya butuh satu ketukan.",
    color: "#E88C2D",
    bg: "#FBEBD8",
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const loadAnimations = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section) return;

      gsap.fromTo(
        section.querySelectorAll(".feature-card"),
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
            once: true,
          },
        }
      );
    };

    loadAnimations();
  }, []);

  return (
    <section ref={sectionRef} id="fitur" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#1E4A35] mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Fitur Utama Platform
          </h2>
          <p className="text-[#5B655D] max-w-lg mx-auto">
            Dirancang untuk kecepatan lapangan, mulai dari UMKM yang sibuk hingga
            relawan yang bergerak cepat.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, idx) => (
            <Card
              key={idx}
              hover
              className="feature-card opacity-0 group cursor-default"
            >
              <div
                className="w-11 h-11 rounded-[10px] flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                style={{ background: feat.bg }}
              >
                <feat.icon size={22} style={{ color: feat.color }} />
              </div>
              <h3 className="text-base font-semibold text-[#1B1F1C] mb-2">
                {feat.title}
              </h3>
              <p className="text-sm text-[#5B655D] leading-relaxed">
                {feat.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
