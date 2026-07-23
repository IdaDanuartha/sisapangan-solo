"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, ChevronRight, Clock, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";


export function VolunteerDashboard({
  userId,
  role,
}: {
  userId: string;
  role: string;
}) {
  const [timeFilter, setTimeFilter] = useState<"minggu_ini" | "bulan_ini" | "tahun_ini" | "5_tahun_terakhir">("minggu_ini");
  const [logs, setLogs] = useState<{ timestamp: string }[]>([]);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      // Fetch verification status
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_verified")
        .eq("id", userId)
        .single();
      setIsVerified(profile?.is_verified ?? false);

      // Fetch distribution logs
      const { data } = await supabase
        .from("distribution_log")
        .select("*, surplus_batch(*)")
        .eq("volunteer_id", userId)
        .eq("status", "Selesai");
      setLogs(data || []);
    }
    load();
  }, [userId]);

  const getRealChartData = () => {
    const now = new Date();
    
    // 1. Minggu Ini
    const dailyValues = [0, 0, 0, 0, 0, 0, 0];
    const dailyLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diffToMonday = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    // 2. Bulan Ini
    const weeklyValues = [0, 0, 0, 0];

    // 3. Tahun Ini (last 6 months)
    const monthlyValues = Array(6).fill(0);
    const monthlyLabels = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return d.toLocaleString("id-ID", { month: "short" });
    });

    // 4. 5 Tahun Terakhir
    const yearlyValues = Array(5).fill(0);
    const yearLabels = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 4 + i));

    logs.forEach((log) => {
      const date = new Date(log.timestamp);
      
      // Daily
      if (date >= startOfWeek) {
        const d = date.getDay();
        const idx = d === 0 ? 6 : d - 1;
        if (idx >= 0 && idx < 7) dailyValues[idx] += 1;
      }

      // Weekly
      if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
        const dateNum = date.getDate();
        const weekIdx = Math.min(Math.floor((dateNum - 1) / 7), 3);
        weeklyValues[weekIdx] += 1;
      }

      // Monthly (last 6 months)
      const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      if (diffMonths >= 0 && diffMonths < 6) {
        monthlyValues[5 - diffMonths] += 1;
      }

      // Yearly
      const yearStr = String(date.getFullYear());
      const yIdx = yearLabels.indexOf(yearStr);
      if (yIdx !== -1) yearlyValues[yIdx] += 1;
    });

    const isAllZero = (arr: number[]) => arr.every(v => v === 0);

    const finalDaily = isAllZero(dailyValues) ? [1, 3, 2, 4, 2, 5, 6] : dailyValues;
    const finalWeekly = isAllZero(weeklyValues) ? [4, 8, 6, 11] : weeklyValues;
    const finalMonthly = isAllZero(monthlyValues) ? [5, 12, 8, 15, 10, 18] : monthlyValues;
    const finalYearly = isAllZero(yearlyValues) ? [45, 68, 92, 115, 140] : yearlyValues;

    const mapBars = (values: number[], labels: string[], padL = 30, padR = 510) => {
      const max = Math.max(...values, 5);
      return values.map((val, i) => {
        const x = padL + (i * (padR - padL)) / (values.length - 1 || 1);
        const height = (val / max) * 110 + 10;
        const y = 140 - height;
        return { label: labels[i], value: val, height, y, x };
      });
    };

    return {
      minggu_ini: {
        title: "Aktivitas Penyelamatan Pangan",
        subtitle: isAllZero(dailyValues) ? "Penyelamatan pangan 7 hari terakhir (Simulasi kali)" : "Penyelamatan pangan 7 hari terakhir (Real kali)",
        bars: mapBars(finalDaily, dailyLabels, 30, 510)
      },
      bulan_ini: {
        title: "Aktivitas Penyelamatan Pangan",
        subtitle: isAllZero(weeklyValues) ? "Penyelamatan pangan 4 minggu terakhir (Simulasi kali)" : "Penyelamatan pangan 4 minggu terakhir (Real kali)",
        bars: mapBars(finalWeekly, ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"], 60, 480)
      },
      tahun_ini: {
        title: "Aktivitas Penyelamatan Pangan",
        subtitle: isAllZero(monthlyValues) ? "Penyelamatan pangan 6 bulan terakhir (Simulasi kali)" : "Penyelamatan pangan 6 bulan terakhir (Real kali)",
        bars: mapBars(finalMonthly, monthlyLabels, 40, 500)
      },
      "5_tahun_terakhir": {
        title: "Aktivitas Penyelamatan Pangan",
        subtitle: isAllZero(yearlyValues) ? "Penyelamatan pangan 5 tahun terakhir (Simulasi kali)" : "Penyelamatan pangan 5 tahun terakhir (Real kali)",
        bars: mapBars(finalYearly, yearLabels, 40, 500)
      }
    };
  };

  const currentChart = getRealChartData()[timeFilter];

  return (
    <div className="px-3 sm:px-6 py-5 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1B1F1C]">
          {role === "non-consumption"
            ? "Dashboard Pengelola Non-Konsumsi"
            : "Dashboard Relawan"}
        </h1>
        <p className="text-sm text-[#9AA39C]">
          Temukan surplus pangan terdekat dan klaim pickup
        </p>
      </div>

      {/* Verification Banner */}
      {isVerified === false && (
        <div className="mb-6 rounded-[18px] border-2 border-[#E88C2D]/40 bg-gradient-to-br from-[#FBEBD8] to-[#FFF9F3] p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[12px] bg-[#E88C2D]/15 flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={24} className="text-[#E88C2D]" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-[#1B1F1C] text-base">Akun Sedang Diverifikasi</p>
              <p className="text-sm text-[#5B655D] mt-1 leading-relaxed">
                Tim SisaPangan Solo sedang meninjau informasi akun Anda agar surplus pangan tepat sasaran.
                Proses verifikasi biasanya selesai dalam <span className="font-semibold text-[#1B1F1C]">1×24 jam</span>.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-[#9AA39C]">
                <Clock size={13} />
                <span>Anda akan mendapat notifikasi WhatsApp setelah diverifikasi.</span>
              </div>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-[#E88C2D]/20">
            <p className="text-xs font-semibold text-[#5B655D] mb-2">Langkah Selanjutnya</p>
            <ul className="space-y-1.5 text-xs text-[#5B655D]">
              <li className="flex items-center gap-2">
                <ShieldCheck size={12} className="text-[#E88C2D] flex-shrink-0" />
                Pastikan profil Anda sudah lengkap (tipe dan kontak)
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={12} className="text-[#E88C2D] flex-shrink-0" />
                Admin akan mengecek kategori dan tujuan organisasi Anda
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={12} className="text-[#E88C2D] flex-shrink-0" />
                Setelah disetujui, semua fitur peta surplus akan terbuka
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Quick action — disabled if not verified */}
      <div className={`rounded-[18px] p-6 text-white mb-6 ${
        isVerified === false
          ? "bg-[#9AA39C]"
          : "bg-[#2F6E4F]"
      }`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-white/20 flex items-center justify-center flex-shrink-0">
            <MapPin size={22} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-lg">
              {role === "non-consumption"
                ? "Cari Surplus Non-Konsumsi"
                : "Cari Surplus Terdekat"}
            </p>
            <p className="text-white/80 text-sm mt-1">
              {isVerified === false
                ? "Akses peta surplus akan terbuka setelah akun Anda diverifikasi oleh admin."
                : role === "non-consumption"
                ? "Tampilkan batch yang dialihkan ke pakan, maggot, atau kompos"
                : "Lihat peta surplus di sekitar lokasumu dan klaim pickup"}
            </p>
          </div>
        </div>
        {isVerified !== false ? (
          <Link
            href={`/app/surplus/nearby${role === "non-consumption" ? "?filter=non-consumption" : ""}`}
            className="mt-4 block"
          >
            <Button
              variant="secondary"
              size="md"
              className="border-white text-white hover:bg-white/10 w-full sm:w-auto"
              id="btn-find-surplus"
            >
              Buka Peta Surplus
              <ChevronRight size={16} />
            </Button>
          </Link>
        ) : (
          <div className="mt-4">
            <Button
              variant="secondary"
              size="md"
              className="border-white/40 text-white/50 w-full sm:w-auto cursor-not-allowed"
              disabled
            >
              Buka Peta Surplus
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-6 border border-[#E4F0E8]/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#1B1F1C]">{currentChart.title}</h3>
            <p className="text-xs text-[#9AA39C]">{currentChart.subtitle}</p>
          </div>
          <div className="flex overflow-x-auto gap-1 self-start sm:self-center pb-0.5 max-w-full no-scrollbar">
            {(["minggu_ini", "bulan_ini", "tahun_ini", "5_tahun_terakhir"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={[
                  "px-2 sm:px-3 py-1 rounded-[8px] text-[9px] sm:text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0",
                  timeFilter === filter
                    ? "bg-[#2F6E4F] text-white shadow-sm"
                    : "text-[#5B655D] hover:text-[#2F6E4F]",
                ].join(" ")}
              >
                {filter === "minggu_ini"
                  ? "Minggu"
                  : filter === "bulan_ini"
                  ? "Bulan"
                  : filter === "tahun_ini"
                  ? "Tahun"
                  : "5 Thn"}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full h-44 flex flex-col justify-end">
          {/* Chart area */}
          <div className="flex-1 flex items-end justify-between px-2 sm:px-6 relative border-b border-[#E4F0E8] pb-1">
            {currentChart.bars.map((bar, idx) => {
              const maxVal = Math.max(...currentChart.bars.map(b => b.value), 5);
              const percentHeight = Math.max((bar.value / maxVal) * 80, 6); // 6% min height so it is visible
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group justify-end h-full">
                  {/* Value Label */}
                  <span className="text-[10px] font-bold text-[#2F6E4F] mb-1.5 transition-colors group-hover:text-[#1B1F1C]">
                    {bar.value}
                  </span>
                  {/* Bar */}
                  <div
                    style={{ height: `${percentHeight}%` }}
                    className="w-8 sm:w-12 bg-[#2F6E4F] rounded-t-[6px] hover:bg-[#1B1F1C] transition-all duration-150 cursor-pointer flex-shrink-0"
                    title={`${bar.label}: ${bar.value} penyelamatan`}
                  />
                </div>
              );
            })}
          </div>
          {/* Labels Row */}
          <div className="flex justify-between text-[10px] font-semibold text-[#9AA39C] mt-2 px-2 sm:px-6">
            {currentChart.bars.map((bar, idx) => (
              <span key={idx} className="flex-1 text-center truncate">{bar.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Claimed pickups placeholder */}
      <div className="bg-white rounded-[14px] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#1B1F1C]">
            Pickup yang Diklaim
          </h2>
          <Link
            href="/app/pickup/route"
            className="text-sm text-[#2F6E4F] font-medium hover:underline flex items-center gap-1"
          >
            Rute <ChevronRight size={14} />
          </Link>
        </div>
        <p className="text-sm text-[#9AA39C] text-center py-8">
          Belum ada pickup aktif. Klaim surplus dari peta untuk mulai.
        </p>
      </div>
    </div>
  );
}
