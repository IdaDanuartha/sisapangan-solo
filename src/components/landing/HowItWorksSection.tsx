"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Donor Melaporkan Surplus",
    description:
      "UMKM atau restoran mengisi form singkat berisi foto, jenis makanan, lokasi, dan estimasi waktu layak konsumsi dalam 90 detik.",
  },
  {
    number: "02",
    title: "Volunteer Menjemput & Mendistribusikan",
    description:
      "Volunteer terdekat mendapat notifikasi, mengambil surplus dengan rute teroptimasi, dan mengantar ke Non-Consumption Partner.",
  },
  {
    number: "03",
    title: "Dipantau Monitor & Admin",
    description:
      "Setiap alur tercatat via QR code. Monitor memverifikasi distribusi, admin mengelola laporan dan sistem gamifikasi badge.",
  },
];

const floatingBadges = [
  { value: "5", label: "Peran Aktif", top: "12%", left: "50%", transform: "-translate-x-1/2" },
  { value: "24/7", label: "Koordinasi Real-time", bottom: "12%", left: "50%", transform: "-translate-x-1/2" },
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

      gsap.fromTo(
        section.querySelectorAll(".step-item"),
        { opacity: 0, x: 24 },
        {
          opacity: 1,
          x: 0,
          duration: 0.55,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 72%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        section.querySelectorAll(".image-col"),
        { opacity: 0, scale: 0.96 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.7,
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
    <section ref={sectionRef} id="cara-kerja" className="py-20 bg-[#F4F6F3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="mb-14">
          <p className="text-xs font-semibold text-[#E88C2D] uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-5 h-px bg-[#E88C2D] inline-block" />
            Cara Kerja
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#1B1F1C] leading-[1.15]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Bagaimana SisaPangan Solo Bekerja?
          </h2>
        </div>

        {/* 2 images with floating badges */}
        <div className="image-col opacity-0 relative mb-10 hidden md:block">
          <div className="grid grid-cols-2 gap-4 h-64">
            <div className="relative rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80&fit=crop"
                alt="Donor menyerahkan surplus pangan di pasar"
                fill
                className="object-cover object-top"
                sizes="50vw"
              />
              <div className="absolute inset-0 bg-[#1E4A35]/30" />
            </div>
            <div className="relative rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?w=800&q=80&fit=crop"
                alt="Volunteer mengantar makanan ke penerima manfaat"
                fill
                className="object-cover object-center"
                sizes="50vw"
              />
              <div className="absolute inset-0 bg-[#2F6E4F]/20" />
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl px-5 py-3 text-center z-10 border border-[#E4F0E8]">
            <p className="text-2xl font-bold text-[#2F6E4F]">5</p>
            <p className="text-xs text-[#5B655D]">Peran Aktif</p>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl px-5 py-3 text-center z-10 border border-[#E4F0E8]">
            <p className="text-2xl font-bold text-[#E88C2D]">24/7</p>
            <p className="text-xs text-[#5B655D]">Koordinasi Real-time</p>
          </div>
        </div>

        {/* Split bottom: CTA card (left) + numbered list (right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CTA card */}
          <div className="rounded-2xl bg-[#2F6E4F] p-8 flex flex-col justify-between min-h-[280px] relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" aria-hidden="true" />
            <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" aria-hidden="true" />

            <div>
              <p className="text-xs font-semibold text-[#A8D5BA] uppercase tracking-widest mb-4">
                Bergabung Sekarang
              </p>
              <h3
                className="text-2xl font-bold text-white leading-snug mb-3"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Jadi Bagian dari<br />Gerakan Food Rescue
              </h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Daftarkan diri sebagai Donor, Volunteer, atau Non-Consumption Partner
                dan mulai berkontribusi hari ini.
              </p>
            </div>

            <div>
              <Link
                href="/register"
                className="mt-6 inline-flex items-center gap-2 bg-white text-[#2F6E4F] font-semibold text-sm px-6 py-3 rounded-[8px] hover:bg-[#E4F0E8] transition-colors"
                id="cta-how-it-works"
              >
                Gabung Jadi Volunteer
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Numbered list */}
          <div className="flex flex-col gap-5 justify-center">
            {steps.map((step, idx) => (
              <div key={idx} className="step-item opacity-0 flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#E4F0E8] border-2 border-[#2F6E4F]/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#2F6E4F]">{step.number}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1B1F1C] text-sm mb-1">
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
      </div>
    </section>
  );
}
