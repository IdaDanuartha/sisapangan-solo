"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle, LeafyGreen, HandHeart, BarChart3 } from "lucide-react";

// Unsplash photos — food rescue / community / vegetable market context
const PHOTOS = {
  // Tall left card — donor handing over food at market
  donor: "/images/hero/donor.jpeg",
  // Middle top card — volunteer packing food donations
  volunteer: "/images/hero/volunteer.jpeg",
  // Right bottom card — community receiving meals
  community: "/images/hero/community.jpeg",
};

export function HeroSection() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const loadGSAP = async () => {
      const { gsap } = await import("gsap");
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.fromTo(
        headlineRef.current,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.7 }
      )
        .fromTo(
          subRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.55 },
          "-=0.35"
        )
        .fromTo(
          gridRef.current,
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.75 },
          "-=0.25"
        );
    };

    loadGSAP();
  }, []);

  return (
    <section
      id="beranda"
      className="relative bg-[#F4F6F3] pt-24 pb-10 overflow-hidden h-screen"
    >
      {/* Subtle bg accent */}
      <div
        className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-[#2F6E4F]/5 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-[#E88C2D]/6 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Headline block */}
        <div className="text-center mb-4">
          <h1
            ref={headlineRef}
            className="opacity-0 text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-[#1B1F1C] leading-[1.12] tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Selamatkan{" "}
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#E4F0E8] border-2 border-[#2F6E4F]/20 align-middle -translate-y-1">
                <LeafyGreen size={24} className="text-[#2F6E4F]" aria-label="pangan" />
              </span>
            </span>{" "}
            <span className="text-[#2F6E4F]">Pangan,</span>
            <br />
            Bantu{" "}
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FBEBD8] border-2 border-[#E88C2D]/20 align-middle -translate-y-1">
                <HandHeart size={24} className="text-[#E88C2D]" aria-label="komunitas" />
              </span>
            </span>{" "}
            Sesama di Solo Raya
          </h1>
        </div>

        <p
          ref={subRef}
          className="opacity-0 text-center text-lg text-[#5B655D] leading-relaxed max-w-2xl mx-auto mb-12"
        >
          Platform koordinasi food rescue yang menghubungkan donor pangan,
          relawan, dan penerima manfaat secara real-time dan terverifikasi.
        </p>

        {/* 3-Column Asymmetric Image Grid */}
        <div
          ref={gridRef}
          className="opacity-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch min-h-[420px]"
        >
          {/* Card Kiri — tall image with overlay */}
          <div className="relative rounded-2xl overflow-hidden min-h-[320px] md:min-h-[420px] group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1E4A35]/30 to-[#1E4A35]/90 z-10" />
            <Image
              src={PHOTOS.donor}
              alt="Donor menyerahkan pangan surplus di pasar lokal"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            {/* Overlay content */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-5">
              <p className="text-xs font-semibold text-[#A8D5BA] uppercase tracking-wider mb-2">
                Food Rescue
              </p>
              <h3 className="text-white font-bold text-lg leading-tight mb-3">
                Ubah Sisa Pangan Jadi Nilai Nyata
              </h3>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors group/link"
              >
                Selengkapnya
                <ArrowRight size={14} className="transition-transform group-hover/link:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Card Tengah — image top + info box bottom */}
          <div className="flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden flex-1 min-h-[180px] group cursor-pointer">
              <Image
                src={PHOTOS.volunteer}
                alt="Relawan mengemas dan mengambil surplus pangan"
                fill
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="rounded-2xl bg-[#2F6E4F] p-5 text-white">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm leading-snug mb-1">
                    Koordinasi Real-time & Terverifikasi
                  </p>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Setiap pickup terlacak dari posting hingga distribusi akhir.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Kanan — info box top + image bottom */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-[#FBEBD8] p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#E88C2D]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BarChart3 size={16} className="text-[#E88C2D]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#1B1F1C] leading-snug mb-1">
                    Dampak Terukur & Transparan
                  </p>
                  <p className="text-xs text-[#5B655D] leading-relaxed">
                    Dashboard real-time dengan data kg, porsi, dan jejak karbon yang bisa diaudit.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden flex-1 min-h-[220px] group cursor-pointer">
              <Image
                src={PHOTOS.community}
                alt="Komunitas penerima manfaat mendapatkan makanan"
                fill
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E4A35]/60 to-transparent z-10" />
              <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white transition-colors group/link"
                >
                  Bergabung
                  <ArrowRight size={14} className="transition-transform group-hover/link:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
