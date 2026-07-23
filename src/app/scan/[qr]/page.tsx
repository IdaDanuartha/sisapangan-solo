import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  MapPin,
  Clock,
  User,
  Package,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  ShieldCheck,
  ChevronLeft,
  Calendar,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ qr: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { qr } = await params;
  return {
    title: `Lacak Distribusi Pangan | SisaPangan Solo`,
    description: `Lacak riwayat distribusi pangan dengan kode ${qr}. Transparan, dapat diverifikasi publik.`,
    robots: { index: false },
  };
}

export default async function ScanPage({ params }: Props) {
  const { qr } = await params;
  const supabase = await createClient();

  const { data: batch } = await supabase
    .from("surplus_batch")
    .select(`
      id, name, category, quantity, unit, status,
      freshness_status, freshness_reason, estimated_expiry,
      location_label, notes, storage_condition, created_at,
      qr_code, qr_data_url,
      profiles:donor_id(name, type)
    `)
    .eq("qr_code", qr)
    .single();

  if (!batch) notFound();

  const { data: logs } = await supabase
    .from("distribution_log")
    .select("status, timestamp, profiles:volunteer_id(name)")
    .eq("batch_id", batch.id)
    .order("timestamp", { ascending: true });

  const statusConfig = {
    safe: {
      color: "#2F6E4F",
      bgClass: "bg-[#E8F7ED] border-[#3AA65A]/20 text-[#1E4A35]",
      label: "Layak Konsumsi",
      icon: <CheckCircle2 size={20} className="text-[#3AA65A] shrink-0" />,
    },
    urgent: {
      color: "#E88C2D",
      bgClass: "bg-[#FEF6E4] border-[#F0A93B]/20 text-[#6B4611]",
      label: "Segera Diambil",
      icon: <AlertTriangle size={20} className="text-[#F0A93B] shrink-0" />,
    },
    "non-consumption": {
      color: "#C1502E",
      bgClass: "bg-[#FAEAEA] border-[#D14343]/20 text-[#7A1E1E]",
      label: "Non-Konsumsi",
      icon: <AlertTriangle size={20} className="text-[#D14343] shrink-0" />,
    },
  }[batch.freshness_status as string] ?? {
    color: "#9AA39C",
    bgClass: "bg-gray-100 border-gray-200 text-gray-800",
    label: "Kedaluwarsa",
    icon: <AlertTriangle size={20} className="text-gray-500 shrink-0" />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F6F3] via-[#E4F0E8]/40 to-[#F4F6F3] pb-12 font-sans">
      {/* Header Banner */}
      <header className="relative bg-gradient-to-r from-[#1E4A35] to-[#2F6E4F] text-white px-6 pt-10 pb-16 rounded-b-[36px] shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-md mx-auto relative">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-[#E4F0E8] hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm"
            >
              <ChevronLeft size={14} />
              <span>Kembali</span>
            </Link>
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-[#E4F0E8] bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Sparkles size={11} className="text-[#F0A93B]" />
              <span>Verified Trace</span>
            </div>
          </div>
          
          <p className="text-xs font-semibold text-[#E4F0E8] uppercase tracking-wider mb-1">
            SisaPangan Solo · Pelacakan Publik
          </p>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">{batch.name}</h1>
          <div className="flex items-center gap-2 mt-3.5">
            <span className="text-xs text-[#E4F0E8] bg-white/10 px-2.5 py-1 rounded-md font-mono">
              QR: {qr}
            </span>
            <span className="text-[11px] text-[#E4F0E8] bg-[#E88C2D] px-2.5 py-1 rounded-md font-semibold">
              Status: {batch.status}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-md mx-auto px-4 -mt-8 space-y-4">
        {/* Freshness Status Card */}
        <div className={`rounded-[20px] p-4.5 border shadow-sm backdrop-blur-sm ${statusConfig.bgClass}`}>
          <div className="flex items-start gap-3">
            {statusConfig.icon}
            <div>
              <p className="text-sm font-bold leading-none mb-1.5">
                Kesegaran: {statusConfig.label}
              </p>
              <p className="text-xs opacity-90 leading-relaxed font-medium">
                {batch.freshness_reason}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Information Card */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_18px_rgba(0,0,0,0.03)] border border-[#E4F0E8] space-y-1">
          <h2 className="text-xs font-bold text-[#9AA39C] uppercase tracking-widest mb-3">Detail Surplus Pangan</h2>
          
          <InfoRow
            icon={<Package size={16} />}
            label="Kategori & Jumlah"
            value={`${batch.category} · ${batch.quantity} ${batch.unit}`}
          />
          <InfoRow
            icon={<User size={16} />}
            label="Nama Donor"
            value={batch.profiles ? `${(batch.profiles as any).name} (${(batch.profiles as any).type})` : "—"}
          />
          <InfoRow
            icon={<Calendar size={16} />}
            label="Waktu Posting"
            value={new Date(batch.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
          />
          <InfoRow
            icon={<Clock size={16} />}
            label="Batas Layak Konsumsi"
            value={new Date(batch.estimated_expiry).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
          />
          {batch.location_label && (
            <InfoRow
              icon={<MapPin size={16} />}
              label="Lokasi Pickup"
              value={batch.location_label}
            />
          )}
          {batch.notes && (
            <InfoRow
              icon={<FileText size={16} />}
              label="Catatan Kondisi"
              value={batch.notes}
            />
          )}
        </div>

        {/* Dynamic QR Code Card */}
        {batch.qr_data_url && (
          <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_18px_rgba(0,0,0,0.03)] border border-[#E4F0E8] flex flex-col items-center text-center">
            <div className="flex items-center gap-2 self-start mb-1">
              <ShieldCheck size={18} className="text-[#2F6E4F]" />
              <h2 className="text-sm font-bold text-[#1B1F1C]">QR Code Validasi</h2>
            </div>
            <p className="text-xs text-[#9AA39C] text-left mb-5 self-start">
              Pindai atau unduh kode QR ini untuk verifikasi keaslian dan melacak alur logistik makanan di lapangan.
            </p>
            <div className="bg-[#F4F6F3] p-3 rounded-[20px] border border-[#E4F0E8] shadow-inner mb-4 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={batch.qr_data_url} alt="QR Code" className="w-36 h-36 object-contain" />
            </div>
            <span className="text-xs font-mono text-[#5B655D] bg-[#F4F6F3] px-3.5 py-1 rounded-full mb-5 font-semibold">
              {batch.qr_code}
            </span>
            <a
              href={batch.qr_data_url}
              download={`qr-sisapangan-${batch.qr_code}.png`}
              className="flex items-center justify-center gap-2 w-full h-11 px-4 text-xs font-bold rounded-[12px] bg-[#2F6E4F] text-white hover:bg-[#1E4A35] shadow-[0_4px_12px_rgba(47,110,79,0.2)] active:scale-98 transition-all duration-150"
            >
              <Download size={14} />
              Unduh Gambar QR Code
            </a>
          </div>
        )}

        {/* Distribution Timeline Card */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_18px_rgba(0,0,0,0.03)] border border-[#E4F0E8]">
          <h2 className="text-xs font-bold text-[#9AA39C] uppercase tracking-widest mb-5">Riwayat Distribusi</h2>
          
          {(!logs || logs.length === 0) ? (
            <p className="text-xs text-[#9AA39C] text-center py-6 font-medium">Belum ada riwayat distribusi pada batch ini.</p>
          ) : (
            <div className="relative pl-2">
              {/* Vertical line */}
              <div className="absolute left-[13px] top-2.5 bottom-2.5 w-[2px] bg-gradient-to-b from-[#2F6E4F] to-[#E4F0E8]" />
              <div className="space-y-5">
                {logs.map((log: any, idx: number) => {
                  const isLast = idx === logs.length - 1;
                  return (
                    <div key={idx} className="flex items-start gap-4 pl-6 relative">
                      <div className={`absolute left-0 top-1 w-[12px] h-[12px] rounded-full border-[2.5px] bg-white z-10 transition-all ${
                        isLast ? "border-[#E88C2D] scale-110 shadow-[0_0_8px_rgba(232,140,45,0.5)]" : "border-[#2F6E4F]"
                      }`}>
                        {isLast && <div className="w-1.5 h-1.5 rounded-full bg-[#E88C2D] m-auto" />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold ${isLast ? "text-[#1B1F1C]" : "text-[#5B655D]"}`}>
                          {log.status}
                        </p>
                        <p className="text-xs text-[#9AA39C] mt-1 font-medium leading-relaxed">
                          {new Date(log.timestamp).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short"
                          })}
                          {log.profiles?.name ? ` · Oleh: ${log.profiles.name}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center space-y-1.5 pt-4">
          <p className="text-[10px] text-[#9AA39C] leading-relaxed">
            Halaman ini dapat diakses publik untuk verifikasi distribusi pangan.<br />
            SisaPangan Solo · TIM REGEX · BYTESFEST 2026
          </p>
        </div>
      </main>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3.5 py-3 border-b border-[#F4F6F3] last:border-0 last:pb-0 first:pt-0">
      <div className="w-8 h-8 rounded-[8px] bg-[#F4F6F3] flex items-center justify-center text-[#5B655D] flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[9px] uppercase tracking-wider font-bold text-[#9AA39C] block mb-0.5">{label}</span>
        <span className="text-xs font-semibold text-[#1B1F1C] leading-snug block break-words">{value}</span>
      </div>
    </div>
  );
}
