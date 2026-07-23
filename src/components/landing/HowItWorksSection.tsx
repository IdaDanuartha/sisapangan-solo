"use client";

import { useEffect, useRef } from "react";
import { ClipboardList, Gauge, MapPin, QrCode } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Donor Posting Surplus",
    description:
      "UMKM atau restoran mengisi form singkat berisi foto, jenis makanan, lokasi, dan estimasi waktu layak konsumsi dalam 90 detik.",
    color: "#2F6E4F",
    bg: "#E4F0E8",
  },
  {
    icon: Gauge,
    title: "Sistem Memberi Skor Kesegaran",
    description:
      "Sistem otomatis menghitung Freshness & Risk Score (hijau/kuning/merah) berdasarkan kategori makanan, kondisi simpan, dan sisa waktu.",
    color: "#E88C2D",
    bg: "#FBEBD8",
  },
  {
    icon: MapPin,
    title: "Matching ke Penerima Terdekat",
    description:
      "Relawan atau penerima manfaat terdekat mendapat notifikasi dan bisa klaim surplus langsung dari peta interaktif.",
    color: "#2F6E4F",
    bg: "#E4F0E8",
  },
  {
    icon: QrCode,
    title: "Distribusi Tercatat via QR",
    description:
      "Setiap batch punya QR code. Setelah pickup selesai, riwayat distribusi tersimpan dan bisa dipindai siapa saja untuk transparansi.",
    color: "#C1502E",
    bg: "#FBEBD8",
  },
];

export function HowItWorksSection() {
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

      const stepEls = section.querySelectorAll(".step-item");
      const connectors = section.querySelectorAll(".step-connector");

      gsap.fromTo(
        stepEls,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
            once: true,
          },
        }
      );

      connectors.forEach((connector) => {
        gsap.fromTo(
          connector,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            duration: 0.5,
            ease: "power1.inOut",
            scrollTrigger: {
              trigger: section,
              start: "top 65%",
              once: true,
            },
          }
        );
      });
    };

    loadAnimations();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="cara-kerja"
      className="py-20 bg-[#F4F6F3]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#1E4A35] mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Bagaimana SisaPangan Bekerja?
          </h2>
          <p className="text-[#5B655D] max-w-lg mx-auto">
            Empat langkah yang mengubah sisa makanan menjadi berkah bagi
            komunitas Solo Raya.
          </p>
        </div>

        {/* Desktop: horizontal timeline */}
        <div className="hidden md:flex items-start gap-0">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start flex-1">
              <div className="step-item opacity-0 flex flex-col items-center text-center px-4 flex-1">
                {/* Step number + icon */}
                <div className="relative mb-4">
                  <div
                    className="w-16 h-16 rounded-[16px] flex items-center justify-center shadow-sm"
                    style={{ background: step.bg }}
                  >
                    <step.icon size={28} style={{ color: step.color }} />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#2F6E4F] text-white text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-[#1B1F1C] mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-[#5B655D] leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connector line (not after last step) */}
              {idx < steps.length - 1 && (
                <div className="flex items-center mt-8 flex-shrink-0">
                  <div
                    className="step-connector h-0.5 w-8 bg-[#2F6E4F]/30"
                    style={{ transformOrigin: "left" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical timeline */}
        <div className="flex md:hidden flex-col gap-0">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-4">
              {/* Left: icon + connector */}
              <div className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-[12px] flex items-center justify-center flex-shrink-0"
                  style={{ background: step.bg }}
                >
                  <step.icon size={22} style={{ color: step.color }} />
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-0.5 flex-1 bg-[#2F6E4F]/20 my-2" />
                )}
              </div>
              {/* Right: text */}
              <div className="pb-8">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-[#2F6E4F]">
                    Langkah {idx + 1}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-[#1B1F1C] mb-1">
                  {step.title}
                </h3>
                <p className="text-xs text-[#5B655D] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
