"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Bell, MapPin, Gift, Shield } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
  icon: any;
}

const faqs: FAQItem[] = [
  {
    q: "Apa itu SisaPangan Solo?",
    a: "SisaPangan Solo adalah platform kepedulian sosial untuk memfasilitasi donasi makanan surplus layak konsumsi di Kota Surakarta guna mengurangi sampah makanan dan membantu masyarakat yang membutuhkan.",
    icon: Gift,
  },
  {
    q: "Bagaimana cara mendonasikan makanan?",
    a: "Masuk ke menu 'Tambah Surplus' di dashboard donor, isi nama makanan, unggah foto, atur lokasi penjemputan, dan limit kelayakan konsumsi makanan tersebut. Relawan kami akan mengambil dan menyalurkannya.",
    icon: MapPin,
  },
  {
    q: "Apakah makanan yang didonasikan terjamin kebersihannya?",
    a: "Ya, kami mewajibkan semua donor memverifikasi kelayakan makanan. Sistem AI kami juga mengevaluasi foto makanan, serta relawan akan melakukan pengecekan fisik langsung saat penjemputan.",
    icon: Shield,
  },
  {
    q: "Siapa saja yang dapat menerima donasi?",
    a: "Penerima manfaat terdaftar seperti panti asuhan, dapur umum mitra, dan pengelola bank makanan di wilayah Solo dan sekitarnya.",
    icon: Bell,
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B1F1C] flex items-center gap-2">
          <HelpCircle className="text-[#2F6E4F]" size={28} />
          Pusat Bantuan & FAQ
        </h1>
        <p className="text-sm text-[#9AA39C] mt-1">
          Temukan jawaban atas pertanyaan umum seputar operasional SisaPangan Solo.
        </p>
      </div>

      <div className="bg-white rounded-[20px] shadow-sm border border-[#E4F0E8] p-6 space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          const Icon = faq.icon;
          return (
            <div key={idx} className="border-b border-[#F4F6F3] last:border-0 pb-4 last:pb-0">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between text-left focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E4F0E8] flex items-center justify-center text-[#2F6E4F] shrink-0">
                    <Icon size={16} />
                  </div>
                  <span className="text-sm font-bold text-[#1B1F1C]">{faq.q}</span>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-[#9AA39C]" /> : <ChevronDown size={16} className="text-[#9AA39C]" />}
              </button>
              {isOpen && (
                <div className="mt-3 pl-11 text-xs text-[#5B655D] leading-relaxed transition-all">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-[#E4F0E8] to-[#FBEBD8] border border-[#2F6E4F]/20 rounded-[16px] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#1E4A35]">Masih butuh bantuan?</h3>
        <p className="text-xs text-[#5B655D] mt-1 leading-relaxed">
          Hubungi tim administrasi kami melalui WhatsApp di <strong>0812-3456-7890</strong> atau email ke <strong>support@sisapangan-solo.org</strong> untuk respon cepat.
        </p>
      </div>
    </div>
  );
}
