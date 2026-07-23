"use client";

import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    id: "faq-1",
    question: "Bagaimana cara mendaftar sebagai Donor di SisaPangan Solo?",
    answer:
      "Daftarkan usaha Anda melalui halaman Register, pilih peran Donor, lalu verifikasi email. Setelah akun aktif, Anda bisa langsung mulai posting surplus pangan melalui dashboard — prosesnya hanya butuh 90 detik per posting.",
  },
  {
    id: "faq-2",
    question: "Apa saja standar keamanan pangan yang berlaku di platform ini?",
    answer:
      "Setiap posting surplus dievaluasi dengan sistem Freshness & Risk Score (hijau/kuning/merah) berdasarkan jenis makanan, kondisi penyimpanan, dan sisa waktu layak konsumsi. Posting dengan skor merah otomatis tidak diteruskan untuk konsumsi manusia, melainkan dialihkan ke Pengelola Non-Konsumsi untuk pakan ternak, budidaya maggot (BSF), atau pembuatan kompos.",
  },
  {
    id: "faq-3",
    question: "Area mana saja yang sudah terjangkau oleh SisaPangan Solo?",
    answer:
      "Saat ini platform aktif melayani wilayah Solo Raya yang mencakup Kota Surakarta, Kabupaten Sukoharjo, Boyolali, Klaten, Karanganyar, Wonogiri, dan Sragen. Kami terus memperluas jaringan volunteer dan mitra di setiap wilayah.",
  },
  {
    id: "faq-4",
    question: "Apakah ada sistem reward atau gamifikasi untuk Volunteer?",
    answer:
      "Ya, kami memiliki sistem badge dan poin yang bisa dikumpulkan oleh Volunteer berdasarkan jumlah pickup, konsistensi, dan rating dari penerima. Badge tertentu bisa ditukarkan dengan reward dari mitra lokal kami atau digunakan sebagai portofolio kontribusi sosial.",
  },
  {
    id: "faq-5",
    question: "Bagaimana cara kerja rute pickup yang teroptimasi?",
    answer:
      "Sistem kami menghitung rute pickup paling efisien berdasarkan lokasi Volunteer, titik surplus yang aktif, dan batas waktu layak konsumsi. Volunteer bisa membuka rute langsung di Google Maps dengan satu ketukan dari dashboard mereka.",
  },
  {
    id: "faq-6",
    question: "Apakah data distribusi bisa diaudit secara publik?",
    answer:
      "Setiap batch pangan memiliki QR code unik yang menyimpan riwayat distribusi lengkap — dari donor, pickup oleh siapa, hingga diterima di mana. Siapa saja bisa memindai QR tersebut tanpa perlu login untuk mengecek transparansi distribusi.",
  },
];

const STORAGE_KEY = "sisapangan-faq-open";

export function FAQSection() {
  const [openId, setOpenId] = useState<string | null>("faq-3");

  // Persist last opened FAQ
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setOpenId(saved);
  }, []);

  function toggle(id: string) {
    const next = openId === id ? null : id;
    setOpenId(next);
    if (next) localStorage.setItem(STORAGE_KEY, next);
    else localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-[#E88C2D] uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
            <span className="w-5 h-px bg-[#E88C2D] inline-block" />
            FAQ
            <span className="w-5 h-px bg-[#E88C2D] inline-block" />
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#1B1F1C] leading-[1.15]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Pertanyaan yang Sering Ditanyakan
          </h2>
        </div>

        {/* Accordion */}
        <div className="flex flex-col divide-y divide-[#F4F6F3]">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id}>
                <button
                  id={faq.id}
                  aria-expanded={isOpen}
                  aria-controls={`${faq.id}-panel`}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left group"
                  onClick={() => toggle(faq.id)}
                >
                  <span
                    className={[
                      "text-sm font-medium leading-snug transition-colors",
                      isOpen ? "text-[#2F6E4F]" : "text-[#1B1F1C] group-hover:text-[#2F6E4F]",
                    ].join(" ")}
                  >
                    {faq.question}
                  </span>
                  <span
                    className={[
                      "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                      isOpen
                        ? "bg-[#2F6E4F] text-white"
                        : "bg-[#F4F6F3] text-[#5B655D] group-hover:bg-[#E4F0E8] group-hover:text-[#2F6E4F]",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                  </span>
                </button>

                <div
                  id={`${faq.id}-panel`}
                  role="region"
                  aria-labelledby={faq.id}
                  className={[
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isOpen ? "max-h-96 opacity-100 pb-5" : "max-h-0 opacity-0",
                  ].join(" ")}
                >
                  <p className="text-sm text-[#5B655D] leading-relaxed pl-0">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
