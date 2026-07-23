"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Building2, Users, Heart, ShieldCheck } from "lucide-react";

const roles = [
  {
    icon: Building2,
    title: "Donor",
    description:
      "Restoran, UMKM kuliner, katering, dan ritel yang melaporkan surplus makanan layak konsumsi setiap hari.",
    color: "#2F6E4F",
    bg: "#E4F0E8",
  },
  {
    icon: Users,
    title: "Volunteer",
    description:
      "Relawan yang menjemput surplus dari donor dan mengantarkan ke non-consumption partner dengan rute teroptimasi.",
    color: "#E88C2D",
    bg: "#FBEBD8",
  },
  {
    icon: Heart,
    title: "Non-Consumption Partner",
    description:
      "Panti asuhan, posyandu, dapur umum, dan komunitas penerima yang mendapatkan distribusi pangan terverifikasi.",
    color: "#C1502E",
    bg: "#FAEAEA",
  },
  {
    icon: ShieldCheck,
    title: "Monitor & Admin",
    description:
      "Tim yang memverifikasi distribusi, mengelola laporan dampak, dan menjalankan sistem gamifikasi badge.",
    color: "#2F6E4F",
    bg: "#E4F0E8",
  },
];

export function RolesSection() {
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
        section.querySelectorAll(".role-item"),
        { opacity: 0, x: 20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 72%",
            once: true,
          },
        }
      );
    };

    loadAnimations();
  }, []);

  return (
    <section ref={sectionRef} id="peran" className="py-20 bg-[#FBEBD8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="mb-12">
          <p className="text-xs font-semibold text-[#E88C2D] uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-5 h-px bg-[#E88C2D] inline-block" />
            Peran & Kontribusi
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#1B1F1C] leading-[1.15]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Siapa Saja yang Bisa Bergabung?
          </h2>
        </div>

        {/* 2-column: image left, roles list right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden h-[400px] lg:h-[480px]">
            <Image
              src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80&fit=crop"
              alt="Para peran dalam ekosistem SisaPangan Solo"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Overlay badge */}
            <div className="absolute bottom-6 left-6 bg-white rounded-2xl shadow-lg px-5 py-4 max-w-[200px]">
              <p className="text-2xl font-bold text-[#2F6E4F] mb-0.5">5 Peran</p>
              <p className="text-xs text-[#5B655D]">
                ekosistem lengkap, satu platform
              </p>
            </div>
          </div>

          {/* Roles list */}
          <div className="flex flex-col gap-5">
            {roles.map((role, idx) => (
              <div
                key={idx}
                className="role-item opacity-0 flex items-start gap-4 p-4 rounded-2xl bg-white border border-[#E88C2D]/10 hover:border-[#E88C2D]/30 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: role.bg, color: role.color }}
                >
                  <role.icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1B1F1C] text-sm mb-1">
                    {role.title}
                  </h3>
                  <p className="text-xs text-[#5B655D] leading-relaxed">
                    {role.description}
                  </p>
                </div>
              </div>
            ))}

            <Link href="/register" className="mt-2">
              <Button variant="primary" size="md" id="cta-roles" className="w-full sm:w-auto">
                Lihat Semua Peran & Daftar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
