"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  {
    value: 48,
    suffix: "jt ton",
    label: "Pangan terbuang di Indonesia per tahun",
    source: "BAPPENAS, 2021",
  },
  {
    value: 551,
    prefix: "Rp",
    suffix: "T",
    label: "Kerugian ekonomi akibat food waste nasional",
    source: "BAPPENAS, 2021",
  },
  {
    value: 1.05,
    suffix: "miliar ton",
    label: "Food waste global per tahun",
    source: "FAO, 2022",
  },
];

function StatCard({
  value,
  prefix,
  suffix,
  label,
  source,
  animate,
}: (typeof stats)[0] & { animate: boolean }) {
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!animate) return;
    const el = numRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      el.textContent =
        value % 1 !== 0 ? value.toFixed(2) : value.toLocaleString("id-ID");
      return;
    }

    let startTime: number | null = null;
    const duration = 1800;

    const tick = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = value * eased;
      el.textContent =
        value % 1 !== 0
          ? current.toFixed(2)
          : Math.floor(current).toLocaleString("id-ID");
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [animate, value]);

  return (
    <div className="stat-card bg-white rounded-[16px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#F4F6F3] opacity-0">
      <div className="flex items-end gap-1 mb-2">
        {prefix && (
          <span className="text-2xl font-bold text-[#E88C2D]">{prefix}</span>
        )}
        <span
          ref={numRef}
          className="text-5xl font-bold text-[#1B1F1C] tabular-nums leading-none"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          0
        </span>
        {suffix && (
          <span className="text-2xl font-bold text-[#2F6E4F] mb-1">{" "}{suffix}</span>
        )}
      </div>
      <p className="text-sm font-medium text-[#1B1F1C] leading-snug">{label}</p>
      <p className="text-xs text-[#9AA39C] mt-1">{source}</p>
    </div>
  );
}

export function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        observer.disconnect();

        setAnimate(true);

        if (!prefersReduced) {
          const { gsap } = await import("gsap");
          gsap.fromTo(
            section.querySelectorAll(".stat-card"),
            { opacity: 0, y: 32 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.15,
              ease: "power2.out",
            }
          );
        } else {
          section.querySelectorAll<HTMLElement>(".stat-card").forEach((el) => {
            el.style.opacity = "1";
          });
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="masalah"
      className="py-20 bg-[#1E4A35] text-white overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Skala Masalah yang Harus Kita Hadapi
          </h2>
          <p className="text-[#9AA39C] max-w-xl mx-auto leading-relaxed">
            Setiap hari, jutaan ton makanan layak konsumsi terbuang sia-sia
            sementara jutaan orang masih kekurangan pangan. Ini bisa kita ubah.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} animate={animate} />
          ))}
        </div>

        <p className="text-center text-xs text-[#5B655D] mt-8">
          Data dari BAPPENAS 2021 dan FAO 2022, sebagaimana dikutip dalam
          proposal BYTESFEST 2026 TIM REGEX.
        </p>
      </div>
    </section>
  );
}
