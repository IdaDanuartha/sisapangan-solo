"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const loadGSAP = async () => {
      const { gsap } = await import("gsap");
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.fromTo(
        badgeRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.5 }
      )
        .fromTo(
          headlineRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.65 },
          "-=0.2"
        )
        .fromTo(
          subRef.current,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.5 },
          "-=0.3"
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.5 },
          "-=0.2"
        )
        .fromTo(
          imgRef.current,
          { opacity: 0, scale: 0.96, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 0.8 },
          "-=0.6"
        );
    };

    loadGSAP();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-[#E4F0E8] via-[#F4F6F3] to-[#FBEBD8] pt-16 overflow-hidden">
      {/* Decorative background circles */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#2F6E4F]/8 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 -left-24 w-72 h-72 rounded-full bg-[#E88C2D]/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Text Column */}
        <div className="flex flex-col gap-6">
          {/* Badge */}
          <div ref={badgeRef} className="opacity-0">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E4F0E8] border border-[#2F6E4F]/20 text-xs font-medium text-[#2F6E4F]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3AA65A] animate-pulse" />
              Platform aktif di Solo Raya
            </span>
          </div>

          {/* Headline */}
          <h1
            ref={headlineRef}
            className="opacity-0 text-4xl sm:text-5xl lg:text-6xl leading-[1.1] font-[var(--font-display)] text-[#1E4A35]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Pangan Sisa,{" "}
            <span className="text-[#2F6E4F]">Bukan Sampah.</span>
          </h1>

          {/* Sub-headline */}
          <p
            ref={subRef}
            className="opacity-0 text-lg text-[#5B655D] leading-relaxed max-w-lg"
          >
            SisaPangan Solo menghubungkan UMKM kuliner, relawan, dan penerima
            manfaat dalam satu alur digital, mulai dari surplus ditemukan hingga
            sampai ke tangan yang membutuhkan.
          </p>

          {/* CTA */}
          <div
            ref={ctaRef}
            className="opacity-0 flex flex-wrap gap-3"
          >
            <Link href="/register?role=donor">
              <Button variant="primary" size="lg" id="cta-donor">
                Daftar sebagai Donor
              </Button>
            </Link>
            <Link href="/register?role=volunteer">
              <Button variant="secondary" size="lg" id="cta-volunteer">
                Daftar sebagai Relawan
              </Button>
            </Link>
          </div>

          {/* Trust row */}
          <div className="flex items-center gap-6 pt-2">
            {[
              { value: "23–48 jt ton", label: "pangan terbuang/tahun" },
              { value: "Rp 213 T", label: "kerugian ekonomi" },
            ].map((stat) => (
              <div key={stat.value} className="border-l-2 border-[#2F6E4F]/30 pl-3">
                <p className="text-sm font-bold text-[#2F6E4F]">{stat.value}</p>
                <p className="text-xs text-[#9AA39C]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Image Column */}
        <div ref={imgRef} className="opacity-0 relative">
          <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden shadow-[0_24px_64px_rgba(47,110,79,0.15)]">
            <Image
              src="/images/hero-illustration.png"
              alt="Ilustrasi alur penyelamatan pangan: donor menyerahkan ke relawan, relawan mendistribusikan ke penerima manfaat"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          {/* Floating stat card */}
          <div className="absolute -bottom-4 -left-4 bg-white rounded-[14px] shadow-lg px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#E4F0E8] flex items-center justify-center text-[#2F6E4F] text-xl font-bold">
              ♻
            </div>
            <div>
              <p className="text-xs text-[#9AA39C]">Terselamatkan hari ini</p>
              <p className="text-base font-bold text-[#1B1F1C] tabular-nums">
                124 kg
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50">
        <div className="w-5 h-8 rounded-full border-2 border-[#2F6E4F] flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 rounded-full bg-[#2F6E4F] animate-bounce" />
        </div>
      </div>
    </section>
  );
}
