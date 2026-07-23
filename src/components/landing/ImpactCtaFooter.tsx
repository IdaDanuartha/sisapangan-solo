import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Heart, Users, Building2, Leaf } from "lucide-react";

export function ImpactSection() {
  return (
    <section id="dampak" className="py-20 bg-[#F4F6F3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div>
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#1E4A35] mb-5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Berakar di Solo Raya, Bergerak Bersama
            </h2>
            <p className="text-[#5B655D] leading-relaxed mb-6">
              Surakarta dan sekitarnya sudah punya ekosistem berbagi pangan yang
              aktif: komunitas, lembaga sosial, dan UMKM kuliner yang peduli.
              SisaPangan Solo hadir bukan untuk menggantikan gerakan ini, tapi
              untuk menghubungkan dan memperkuatnya dengan infrastruktur digital.
            </p>
            <p className="text-[#5B655D] leading-relaxed mb-8">
              Dengan koordinasi yang lebih cepat dan data yang bisa
              dipertanggungjawabkan, setiap batch surplus yang terselamatkan bisa
              dilaporkan langsung ke pemerintah daerah sebagai bukti dampak nyata.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Building2,
                  label: "UMKM & Restoran",
                  desc: "Donor pangan",
                  color: "#2F6E4F",
                },
                {
                  icon: Users,
                  label: "Komunitas & Relawan",
                  desc: "Jaringan distribusi",
                  color: "#E88C2D",
                },
                {
                  icon: Heart,
                  label: "Penerima Manfaat",
                  desc: "Panti, posyandu, dapur umum",
                  color: "#C1502E",
                },
                {
                  icon: Leaf,
                  label: "Non-Konsumsi",
                  desc: "Maggot, ternak, kompos",
                  color: "#2F6E4F",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 p-4 bg-white rounded-[12px] border border-[#E4F0E8]"
                >
                  <div
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${item.color}18`,
                      color: item.color,
                    }}
                  >
                    <item.icon size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1B1F1C]">
                      {item.label}
                    </p>
                    <p className="text-xs text-[#9AA39C]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: stats visual */}
          <div className="bg-white rounded-[20px] p-8 shadow-[0_4px_24px_rgba(47,110,79,0.08)] border border-[#E4F0E8]">
            <p className="text-xs font-semibold text-[#9AA39C] uppercase tracking-wide mb-6">
              Estimasi dampak (Demo Data)
            </p>
            <div className="space-y-5">
              {[
                { label: "Total pangan diselamatkan", value: "1.234 kg", bar: 75 },
                { label: "Estimasi porsi makan", value: "6.170 porsi", bar: 88 },
                { label: "Aktif surplus points", value: "24 titik", bar: 45 },
                { label: "Rata-rata waktu pickup", value: "47 menit", bar: 60 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[#5B655D]">{item.label}</span>
                    <span className="text-sm font-bold text-[#1B1F1C] tabular-nums">
                      {item.value}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#F4F6F3] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2F6E4F] rounded-full transition-all duration-1000"
                      style={{ width: `${item.bar}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#9AA39C] mt-6">
              * Data demo. Dashboard nyata menampilkan data real-time dari
              distribusi aktual.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section className="py-20 bg-[#1E4A35]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2
          className="text-3xl sm:text-4xl font-bold text-white mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Bergabunglah dan Selamatkan Pangan Solo
        </h2>
        <p className="text-[#9AA39C] mb-10 leading-relaxed max-w-xl mx-auto">
          Mulai sekarang, daftarkan UMKM atau bisnis kuliner Anda sebagai donor,
          atau bergabung sebagai relawan distribusi.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register?role=donor">
            <Button
              variant="primary"
              size="lg"
              className="bg-[#E88C2D] hover:bg-[#C97520] text-white border-0 w-full sm:w-auto"
              id="cta-final-donor"
            >
              Daftar sebagai Donor
            </Button>
          </Link>
          <Link href="/register?role=volunteer">
            <Button
              variant="secondary"
              size="lg"
              className="border-white text-white hover:bg-white/10 w-full sm:w-auto"
              id="cta-final-volunteer"
            >
              Daftar sebagai Relawan
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#1B1F1C] text-[#9AA39C] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-3">
              <img src="/images/logo_full.png" alt="SisaPangan Logo" className="h-10 w-auto object-contain brightness-0 invert" />
            </div>
            <p className="text-xs leading-relaxed">
              Platform koordinasi penyelamatan pangan untuk kawasan Solo Raya.
              Dibangun oleh TIM REGEX untuk BYTESFEST 2026.
            </p>
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-3">Platform</p>
            <ul className="space-y-2 text-xs">
              <li><a href="#cara-kerja" className="hover:text-white transition-colors">Cara Kerja</a></li>
              <li><a href="#fitur" className="hover:text-white transition-colors">Fitur</a></li>
              <li><a href="#dampak" className="hover:text-white transition-colors">Dampak</a></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Masuk</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-3">Kontak</p>
            <ul className="space-y-2 text-xs">
              <li>TIM REGEX (BYTESFEST 2026)</li>
              <li>Solo Raya, Jawa Tengah</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-xs text-center">
          © 2026 SisaPangan Solo · TIM REGEX. Dibuat untuk kompetisi BYTESFEST
          2026.
        </div>
      </div>
    </footer>
  );
}
