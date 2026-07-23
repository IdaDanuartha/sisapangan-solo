"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const stats = [
  {
    value: 12480,
    suffix: " kg",
    label: "Pangan Terselamatkan",
    desc: "total surplus yang berhasil didistribusikan",
    solid: true,
  },
  {
    value: 137,
    suffix: "+",
    label: "Donor & Mitra Aktif",
    desc: "UMKM, restoran, relawan, & pengelola non-konsumsi",
    solid: false,
  },
  {
    value: 86,
    suffix: "+",
    label: "Volunteer Terdaftar",
    desc: "relawan aktif di wilayah Solo Raya",
    solid: false,
  },
  {
    value: 6240,
    suffix: " kg",
    label: "Emisi CO₂ Dicegah",
    desc: "estimasi jejak karbon yang berhasil dikurangi",
    solid: false,
  },
];

function useCountUp(target: number, animate: boolean) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!animate) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { setCurrent(target); return; }

    const duration = 1800;
    let startTime: number | null = null;
    const tick = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCurrent(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [animate, target]);
  return current;
}

function StatCard({
  stat,
  animate,
  index,
}: {
  stat: typeof stats[0];
  animate: boolean;
  index: number;
}) {
  const count = useCountUp(stat.value, animate);
  const display = count >= 1000
    ? count.toLocaleString("id-ID")
    : count.toString();

  if (stat.solid) {
    return (
      <div className="rounded-2xl bg-[#2F6E4F] p-6 text-white">
        <p className="text-5xl font-bold tracking-tight mb-1">
          {display}
          <span className="text-3xl">{stat.suffix}</span>
        </p>
        <p className="font-semibold text-sm text-white/90 mb-1">{stat.label}</p>
        <p className="text-xs text-white/60 leading-relaxed">{stat.desc}</p>
      </div>
    );
  }

  const colors = [
    { bg: "bg-[#F4F6F3]", val: "text-[#1B1F1C]", lbl: "text-[#1B1F1C]", desc: "text-[#5B655D]" },
    { bg: "bg-[#FBEBD8]", val: "text-[#E88C2D]", lbl: "text-[#1B1F1C]", desc: "text-[#5B655D]" },
    { bg: "bg-[#F4F6F3]", val: "text-[#1B1F1C]", lbl: "text-[#1B1F1C]", desc: "text-[#5B655D]" },
  ];
  const c = colors[(index - 1) % colors.length];

  return (
    <div className={`rounded-2xl ${c.bg} p-6`}>
      <p className={`text-5xl font-bold tracking-tight mb-1 ${c.val}`}>
        {display}
        <span className="text-3xl">{stat.suffix}</span>
      </p>
      <p className={`font-semibold text-sm mb-1 ${c.lbl}`}>{stat.label}</p>
      <p className={`text-xs leading-relaxed ${c.desc}`}>{stat.desc}</p>
    </div>
  );
}

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        setAnimate(true);
      },
      { threshold: 0.2 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="tentang" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header row — label kiri, paragraf kanan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-10">
          <div>
            <p className="text-xs font-semibold text-[#E88C2D] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-5 h-px bg-[#E88C2D] inline-block" />
              Tentang Kami
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#1B1F1C] leading-[1.15]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Membangun Masa Depan<br />
              <span className="text-[#2F6E4F]">Pangan yang Berkelanjutan</span>
            </h2>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <p className="text-[#5B655D] leading-relaxed">
              SisaPangan Solo adalah platform koordinasi digital yang menghubungkan
              UMKM kuliner, relawan, penerima manfaat, dan pengelola non-konsumsi di Solo Raya
              dalam satu alur penyelamatan pangan yang terverifikasi dan transparan.
            </p>
            <p className="text-[#5B655D] leading-relaxed">
              Kami hadir bukan untuk menggantikan gerakan berbagi yang sudah ada,
              melainkan untuk memperkuatnya dengan infrastruktur digital yang bisa
              dipertanggungjawabkan kepada pemerintah daerah dan masyarakat luas.
            </p>
          </div>
        </div>

        {/* Full-width image */}
        <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden mb-10">
          <Image
            src="/images/about-img.jpeg"
            alt="Tim SisaPangan Solo bergerak bersama mendistribusikan pangan"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1E4A35]/60 via-transparent to-transparent" />
          <div className="absolute left-6 bottom-6 sm:left-10 sm:bottom-10">
            <p className="text-white font-bold text-xl sm:text-2xl leading-snug max-w-xs"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Berakar di Solo Raya,<br />Bergerak Bersama
            </p>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} animate={animate} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
