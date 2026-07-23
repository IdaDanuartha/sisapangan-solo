"use client";

import Link from "next/link";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Scale, 
  FileText, 
  HeartHandshake, 
  AlertTriangle, 
  Eye, 
  ChevronRight 
} from "lucide-react";

export default function TermsPage() {
  const sections = [
    { id: "pendahuluan", title: "1. Pendahuluan", icon: <FileText size={18} /> },
    { id: "peran", title: "2. Peran & Kewajiban Pengguna", icon: <HeartHandshake size={18} /> },
    { id: "keamanan", title: "3. Standar Keamanan Pangan", icon: <ShieldCheck size={18} /> },
    { id: "tanggungjawab", title: "4. Batasan Tanggung Jawab", icon: <AlertTriangle size={18} /> },
    { id: "kebijakan", title: "5. Kebijakan Privasi & Data", icon: <Eye size={18} /> },
    { id: "hukum", title: "6. Hukum yang Mengatur", icon: <Scale size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F3] text-[#1B1F1C]">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-[#E4F0E8] z-30 transition-all duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img
              src="/images/logo_full.png"
              alt="SisaPangan Logo"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-[#2F6E4F] hover:text-[#225039] font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Kembali ke Login
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Title */}
        <div className="mb-10 text-center sm:text-left">
          <h1 
            className="text-3xl sm:text-4xl font-bold text-[#1B1F1C]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Syarat & Ketentuan Penggunaan
          </h1>
          <p className="text-sm text-[#9AA39C] mt-2">
            Terakhir diperbarui: 15 Juli 2026
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation - Sticky on Desktop */}
          <aside className="lg:w-1/4 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-[16px] border border-[#E4F0E8] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-1">
              <p className="text-xs font-bold text-[#9AA39C] px-3 mb-2 uppercase tracking-wider">
                Daftar Isi
              </p>
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-[#5B655D] rounded-[8px] hover:bg-[#F4F6F3] hover:text-[#2F6E4F] transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[#9AA39C] group-hover:text-[#2F6E4F] transition-colors">
                      {sec.icon}
                    </span>
                    {sec.title}
                  </span>
                  <ChevronRight size={14} className="text-[#9AA39C] opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </aside>

          {/* Document Content */}
          <main className="lg:w-3/4 bg-white rounded-[20px] border border-[#E4F0E8] p-6 sm:p-8 shadow-[0_2px_16px_rgba(0,0,0,0.04)] prose max-w-none">
            
            {/* Section 1 */}
            <section id="pendahuluan" className="scroll-mt-24 border-b border-[#F4F6F3] pb-8 mb-8">
              <h2 className="text-xl font-bold text-[#1B1F1C] flex items-center gap-2 mb-4">
                <span className="text-[#2F6E4F]"><FileText size={20} /></span>
                1. Pendahuluan
              </h2>
              <p className="text-sm text-[#5B655D] leading-relaxed mb-3">
                Selamat datang di platform <strong>SisaPangan Solo</strong>. Platform ini dikembangkan untuk memfasilitasi dan mengoordinasikan penyelamatan surplus pangan dari berbagai usaha kuliner (donor) untuk disalurkan kepada pihak-pihak yang membutuhkan (penerima manfaat) melalui bantuan para relawan.
              </p>
              <p className="text-sm text-[#5B655D] leading-relaxed">
                Dengan mendaftar, mengakses, atau menggunakan layanan SisaPangan Solo, Anda menyatakan setuju untuk terikat oleh syarat dan ketentuan ini. Jika Anda tidak menyetujui bagian mana pun dari ketentuan ini, Anda tidak diperkenankan menggunakan platform ini.
              </p>
            </section>

            {/* Section 2 */}
            <section id="peran" className="scroll-mt-24 border-b border-[#F4F6F3] pb-8 mb-8">
              <h2 className="text-xl font-bold text-[#1B1F1C] flex items-center gap-2 mb-4">
                <span className="text-[#2F6E4F]"><HeartHandshake size={20} /></span>
                2. Peran & Kewajiban Pengguna
              </h2>
              <p className="text-sm text-[#5B655D] leading-relaxed mb-4">
                Layanan ini melibatkan tiga peran utama pengguna dengan ketentuan tanggung jawab masing-masing sebagai berikut:
              </p>
              <div className="space-y-4">
                <div className="p-4 rounded-[12px] bg-[#F4F6F3] border-l-4 border-[#2F6E4F]">
                  <h3 className="text-sm font-bold text-[#1B1F1C] mb-1">A. Donor Pangan (UMKM, Restoran, Katering, Hotel, Individu)</h3>
                  <ul className="list-disc pl-4 text-xs text-[#5B655D] space-y-1.5">
                    <li>Menjamin bahwa surplus pangan yang didonasikan dalam kondisi <strong>layak dikonsumsi, bersih, dan aman</strong>.</li>
                    <li>Memberikan informasi yang jujur mengenai jenis makanan, komposisi/alergen utama (jika ada), tanggal/waktu pembuatan, serta instruksi penyimpanan atau penyajian kembali.</li>
                    <li>Menyimpan makanan dalam wadah/tempat yang bersih dan sesuai standar suhu higienis hingga diambil oleh relawan.</li>
                  </ul>
                </div>
                <div className="p-4 rounded-[12px] bg-[#F4F6F3] border-l-4 border-[#E88C2D]">
                  <h3 className="text-sm font-bold text-[#1B1F1C] mb-1">B. Relawan / Penyelamat Pangan</h3>
                  <ul className="list-disc pl-4 text-xs text-[#5B655D] space-y-1.5">
                    <li>Mengambil dan mengantarkan makanan sesuai dengan jadwal dan petunjuk yang tertera di sistem koordinasi platform.</li>
                    <li>Menjaga kebersihan diri dan penanganan wadah makanan selama transportasi untuk mencegah kontaminasi.</li>
                    <li>Melaporkan melalui aplikasi jika menemukan ketidaksesuaian kondisi fisik makanan atau kendala di lapangan sewaktu pengambilan/penyerahan.</li>
                  </ul>
                </div>
                <div className="p-4 rounded-[12px] bg-[#F4F6F3] border-l-4 border-[#9AA39C]">
                  <h3 className="text-sm font-bold text-[#1B1F1C] mb-1">C. Penerima Manfaat (Komunitas, Panti Asuhan, Dapur Umum, dll.)</h3>
                  <ul className="list-disc pl-4 text-xs text-[#5B655D] space-y-1.5">
                    <li>Melakukan pemeriksaan ulang secara mandiri terhadap kondisi kelayakan fisik makanan sebelum didistribusikan ke penerima akhir atau dikonsumsi.</li>
                    <li>Segera mengonsumsi makanan sesuai batas waktu kelayakan yang disarankan.</li>
                    <li>Memahami bahwa semua makanan yang didistribusikan melalui platform ini bersifat <strong>donasi cuma-cuma dan dilarang keras untuk diperjualbelikan kembali</strong>.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="keamanan" className="scroll-mt-24 border-b border-[#F4F6F3] pb-8 mb-8">
              <h2 className="text-xl font-bold text-[#1B1F1C] flex items-center gap-2 mb-4">
                <span className="text-[#2F6E4F]"><ShieldCheck size={20} /></span>
                3. Standar Keamanan & Kelayakan Pangan
              </h2>
              <p className="text-sm text-[#5B655D] leading-relaxed mb-3">
                Keamanan pangan adalah prioritas tertinggi kami. Makanan yang didonasikan wajib memenuhi kriteria berikut:
              </p>
              <ul className="list-disc pl-5 text-sm text-[#5B655D] space-y-2 mb-4">
                <li>Bukan sisa dari piring makan seseorang (bukan makanan bekas konsumsi).</li>
                <li>Tidak menunjukkan tanda-tanda kerusakan seperti berbau masam/basi, berlendir, berjamur, berubah warna tidak wajar, atau kemasan yang menggelembung/bocor.</li>
                <li>Jika berupa makanan olahan basah/cepat basi, disarankan memiliki informasi batas waktu layak konsumsi yang jelas.</li>
              </ul>
              <div className="bg-[#FAEAEA] border border-[#D14343]/20 rounded-[8px] p-4 text-xs text-[#A02020]">
                <strong>PERINGATAN:</strong> Pelanggaran terhadap standar kelayakan pangan yang disengaja dapat mengakibatkan penangguhan atau pemblokiran akun pengguna secara permanen demi keselamatan masyarakat.
              </div>
            </section>

            {/* Section 4 */}
            <section id="tanggungjawab" className="scroll-mt-24 border-b border-[#F4F6F3] pb-8 mb-8">
              <h2 className="text-xl font-bold text-[#1B1F1C] flex items-center gap-2 mb-4">
                <span className="text-[#2F6E4F]"><AlertTriangle size={20} /></span>
                4. Batasan Tanggung Jawab
              </h2>
              <p className="text-sm text-[#5B655D] leading-relaxed mb-3">
                SisaPangan Solo merupakan platform digital penyedia jasa koordinasi informasi. Kami tidak memiliki kendali fisik langsung atas proses pengolahan makanan dari donor maupun metode pengiriman yang dilakukan relawan.
              </p>
              <p className="text-sm text-[#5B655D] leading-relaxed">
                Oleh karena itu, dalam batas maksimal yang diperbolehkan hukum, SisaPangan Solo beserta pengurus dan pengembangnya tidak bertanggung jawab atas kerugian langsung, tidak langsung, cidera, atau keracunan makanan yang timbul dari kelalaian penanganan makanan oleh donor, relawan, maupun penerima manfaat.
              </p>
            </section>

            {/* Section 5 */}
            <section id="kebijakan" className="scroll-mt-24 border-b border-[#F4F6F3] pb-8 mb-8">
              <h2 className="text-xl font-bold text-[#1B1F1C] flex items-center gap-2 mb-4">
                <span className="text-[#2F6E4F]"><Eye size={20} /></span>
                5. Kebijakan Privasi & Data Pengguna
              </h2>
              <p className="text-sm text-[#5B655D] leading-relaxed mb-3">
                Kami berkomitmen menjaga privasi Anda. Informasi pendaftaran seperti nomor WhatsApp, email, dan alamat lokasi operasional disimpan secara aman pada database kami.
              </p>
              <p className="text-sm text-[#5B655D] leading-relaxed">
                Informasi lokasi dan nomor kontak akan dibagikan kepada relawan atau donor yang bersangkutan dalam alur distribusi pangan hanya demi kelancaran koordinasi penjemputan dan pengantaran pangan.
              </p>
            </section>

            {/* Section 6 */}
            <section id="hukum" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#1B1F1C] flex items-center gap-2 mb-4">
                <span className="text-[#2F6E4F]"><Scale size={20} /></span>
                6. Hukum yang Mengatur
              </h2>
              <p className="text-sm text-[#5B655D] leading-relaxed">
                Syarat dan ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia. Setiap perselisihan yang timbul dari atau terkait dengan penggunaan platform ini akan diselesaikan secara musyawarah mufakat terlebih dahulu, sebelum menempuh jalur hukum di yurisdiksi kota Surakarta (Solo).
              </p>
            </section>

          </main>
        </div>
      </div>

      {/* Mini Footer */}
      <footer className="bg-[#1B1F1C] text-[#9AA39C] py-6 border-t border-white/10 text-center text-xs">
        © 2026 SisaPangan Solo · TIM REGEX. Dibuat untuk kompetisi BYTESFEST 2026.
      </footer>
    </div>
  );
}
