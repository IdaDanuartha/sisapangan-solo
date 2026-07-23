"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Leaf, Clock, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/Card";
import { StatusBadge, DistributionBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";

interface SurplusBatch {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: "Tersedia" | "Diklaim" | "Diambil" | "Selesai";
  freshness_status: "safe" | "urgent" | "non-consumption";
  estimated_expiry: string;
  photo_urls: string[] | null;
  created_at: string;
}

const donorChartDataStatic = {}; // Not used anymore

export function DonorDashboard({ userId }: { userId: string }) {
  const [batches, setBatches] = useState<SurplusBatch[]>([]);
  const [metrics, setMetrics] = useState({
    activeBatches: 0,
    totalKg: 0,
    pendingPickups: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<"minggu_ini" | "bulan_ini" | "tahun_ini" | "5_tahun_terakhir">("minggu_ini");

  const getRealChartData = () => {
    const now = new Date();
    
    // 1. Minggu Ini
    const dailyValues = [0, 0, 0, 0, 0, 0, 0];
    const dailyLabels = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diffToMonday = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    // 2. Bulan Ini (4 Weeks)
    const weeklyValues = [0, 0, 0, 0];

    // 3. Tahun Ini (12 Months)
    const monthlyValues = Array(12).fill(0);
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    // 4. 5 Tahun Terakhir
    const yearlyValues = Array(5).fill(0);
    const yearLabels = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 4 + i));

    batches.forEach((b) => {
      if (b.status !== "Selesai" && b.status !== "Diambil") return;
      const date = new Date(b.created_at);
      const qty = Number(b.quantity || 0);

      // Daily
      if (date >= startOfWeek) {
        const d = date.getDay();
        const idx = d === 0 ? 6 : d - 1;
        if (idx >= 0 && idx < 7) {
          dailyValues[idx] += qty;
        }
      }

      // Weekly
      if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
        const dateNum = date.getDate();
        const weekIdx = Math.min(Math.floor((dateNum - 1) / 7), 3);
        weeklyValues[weekIdx] += qty;
      }

      // Monthly
      if (date.getFullYear() === now.getFullYear()) {
        const m = date.getMonth();
        if (m >= 0 && m < 12) {
          monthlyValues[m] += qty;
        }
      }

      // Yearly
      const yearStr = String(date.getFullYear());
      const yIdx = yearLabels.indexOf(yearStr);
      if (yIdx !== -1) {
        yearlyValues[yIdx] += qty;
      }
    });

    const isAllZero = (arr: number[]) => arr.every(v => v === 0);
    
    const finalDaily = isAllZero(dailyValues) ? [12, 15, 14, 25, 22, 32, 38] : dailyValues;
    const finalWeekly = isAllZero(weeklyValues) ? [45, 60, 55, 78] : weeklyValues;
    const finalMonthly = isAllZero(monthlyValues) ? [120, 150, 180, 210, 190, 240, 220, 250, 270, 290, 310, 340] : monthlyValues;
    const finalYearly = isAllZero(yearlyValues) ? [450, 680, 890, 1200, 1550] : yearlyValues;

    const mapPoints = (values: number[], paddingLeft = 20, paddingRight = 480) => {
      const max = Math.max(...values, 10);
      const points = values.map((val, i) => {
        const cx = paddingLeft + (i * (paddingRight - paddingLeft)) / (values.length - 1 || 1);
        const cy = 130 - (val / max) * 100;
        return { cx, cy, val };
      });

      const linePath = points.map((p) => `L ${p.cx} ${p.cy}`).join(" ").replace("L", "M");
      const areaPath = `${linePath} L ${points[points.length - 1].cx} 140 L ${points[0].cx} 140 Z`;

      return { points, linePath, areaPath };
    };

    const dWeekly = mapPoints(finalDaily, 15, 485);
    const dMonthly = mapPoints(finalWeekly, 30, 470);
    
    const displayedMonths = isAllZero(monthlyValues) ? ["Jan-Feb", "Mar-Apr", "Mei-Jun", "Jul-Agu", "Sep-Okt", "Nov-Des"] : monthLabels;
    const displayedMonthlyValues = isAllZero(monthlyValues) ? [120, 150, 180, 210, 190, 240] : monthlyValues;
    const dYearly = mapPoints(displayedMonthlyValues, 15, 485);

    const d5Years = mapPoints(finalYearly, 20, 480);

    return {
      minggu_ini: {
        title: "Volume Penyelamatan Pangan",
        subtitle: isAllZero(dailyValues) ? "Distribusi donasi dalam 7 hari terakhir (Simulasi kg)" : "Distribusi donasi dalam 7 hari terakhir (Real kg)",
        labels: dailyLabels,
        linePath: dWeekly.linePath,
        areaPath: dWeekly.areaPath,
        dots: dWeekly.points.map((p, i) => ({
          cx: p.cx,
          cy: p.cy,
          label: `${dailyLabels[i]} (${Math.round(p.val)}kg)`
        }))
      },
      bulan_ini: {
        title: "Volume Penyelamatan Pangan",
        subtitle: isAllZero(weeklyValues) ? "Distribusi donasi dalam 4 minggu terakhir (Simulasi kg)" : "Distribusi donasi dalam 4 minggu terakhir (Real kg)",
        labels: ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"],
        linePath: dMonthly.linePath,
        areaPath: dMonthly.areaPath,
        dots: dMonthly.points.map((p, i) => ({
          cx: p.cx,
          cy: p.cy,
          label: `M${i+1} (${Math.round(p.val)}kg)`
        }))
      },
      tahun_ini: {
        title: "Volume Penyelamatan Pangan",
        subtitle: isAllZero(monthlyValues) ? "Distribusi donasi dalam 12 bulan terakhir (Simulasi kg)" : "Distribusi donasi dalam 12 bulan terakhir (Real kg)",
        labels: displayedMonths,
        linePath: dYearly.linePath,
        areaPath: dYearly.areaPath,
        dots: dYearly.points.map((p, i) => ({
          cx: p.cx,
          cy: p.cy,
          label: `${displayedMonths[i]} (${Math.round(p.val)}kg)`
        }))
      },
      "5_tahun_terakhir": {
        title: "Volume Penyelamatan Pangan",
        subtitle: isAllZero(yearlyValues) ? "Distribusi donasi dalam 5 tahun terakhir (Simulasi kg)" : "Distribusi donasi dalam 5 tahun terakhir (Real kg)",
        labels: yearLabels,
        linePath: d5Years.linePath,
        areaPath: d5Years.areaPath,
        dots: d5Years.points.map((p, i) => ({
          cx: p.cx,
          cy: p.cy,
          label: `${yearLabels[i]} (${Math.round(p.val)}kg)`
        }))
      }
    };
  };

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("surplus_batch")
        .select("*")
        .eq("donor_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      const batchData = (data as SurplusBatch[]) ?? [];
      setBatches(batchData);

      const active = batchData.filter(
        (b) => b.status === "Tersedia" || b.status === "Diklaim"
      ).length;
      const pending = batchData.filter((b) => b.status === "Diklaim").length;
      const totalKg = batchData
        .filter((b) => b.unit === "kg")
        .reduce((sum, b) => sum + b.quantity, 0);

      setMetrics({ activeBatches: active, totalKg, pendingPickups: pending });
      setLoading(false);
    }

    load();
  }, [userId]);

  const timeRemaining = (expiry: string) => {
    const diff = new Date(expiry).getTime() - Date.now();
    if (diff <= 0) return "Sudah kedaluwarsa";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)} hari lagi`;
    if (hours > 0) return `${hours}j ${mins}m lagi`;
    return `${mins} menit lagi`;
  };

  const latestBatches = batches.slice(0, 5);

  const currentChart = getRealChartData()[timeFilter];

  return (
    <div className="px-3 sm:px-6 py-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1B1F1C]">Dashboard Donor</h1>
          <p className="text-sm text-[#9AA39C]">
            Pantau surplus pangan yang kamu posting
          </p>
        </div>
        <Link href="/app/surplus/add" className="hidden sm:block">
          <Button variant="primary" size="md" id="btn-add-surplus-desktop">
            <Plus size={16} />
            Tambah Surplus
          </Button>
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
        <MetricCard
          label="Batch Aktif"
          value={loading ? "—" : metrics.activeBatches}
          icon={<Package size={20} />}
        />
        <MetricCard
          label="Total Diselamatkan"
          value={loading ? "—" : `${metrics.totalKg} kg`}
          sub="Unit kg saja"
          icon={<Leaf size={20} />}
        />
        <MetricCard
          label="Menunggu Pickup"
          value={loading ? "—" : metrics.pendingPickups}
          sub="Status: Diklaim"
          icon={<Clock size={20} />}
        />
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-8 border border-[#E4F0E8]/50">
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
        <div className="w-full h-44 relative">
          <style>{`
            .chart-dot {
              transition: r 0.15s ease-in-out, stroke-width 0.15s ease-in-out, fill 0.15s ease-in-out;
            }
            .chart-dot:hover {
              r: 7.5px !important;
              stroke-width: 3px !important;
              fill: #1B1F1C !important;
            }
          `}</style>
          <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2F6E4F" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#2F6E4F" stopOpacity="0.00" />
              </linearGradient>
            </defs>
            
            {/* Grid Lines */}
            <line x1="0" y1="30" x2="500" y2="30" stroke="#F4F6F3" strokeWidth="1" />
            <line x1="0" y1="75" x2="500" y2="75" stroke="#F4F6F3" strokeWidth="1" />
            <line x1="0" y1="120" x2="500" y2="120" stroke="#F4F6F3" strokeWidth="1" />

            {/* Area Path */}
            <path
              d={currentChart.areaPath}
              fill="url(#chart-gradient)"
            />

            {/* Smooth Line Path */}
            <path
              d={currentChart.linePath}
              fill="none"
              stroke="#2F6E4F"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>

          {/* HTML Chart Dots to avoid oval stretching */}
          {currentChart.dots.map((dot, idx) => (
            <div
              key={idx}
              className="group absolute w-2.5 h-2.5 rounded-full bg-[#2F6E4F] border-2 border-white cursor-pointer z-10"
              style={{
                left: `${(dot.cx / 500) * 100}%`,
                top: `${(dot.cy / 150) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Tooltip */}
              <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1B1F1C] text-white text-[9px] font-semibold py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-20">
                {dot.label}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-[#1B1F1C]" />
              </div>
            </div>
          ))}
        </div>
        <div className="relative h-6 mt-3 text-[9px] sm:text-[10px] font-semibold text-[#9AA39C]">
          {currentChart.dots.map((dot, idx) => (
            <span
              key={idx}
              className="absolute truncate whitespace-nowrap"
              style={{
                left: `${(dot.cx / 500) * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              {dot.label}
            </span>
          ))}
        </div>
      </div>

      {/* Batch list */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[#1B1F1C]">
          Surplus Terbaru
        </h2>
        <Link
          href="/app/surplus"
          className="text-sm text-[#2F6E4F] font-medium hover:underline flex items-center gap-1"
        >
          Lihat semua <ChevronRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-white rounded-[14px] animate-pulse"
            />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <EmptyState
          title="Belum Ada Surplus"
          description="Mulai tambahkan surplus pangan untuk ditampilkan di sini."
          variant="default"
          action={
            <Link href="/app/surplus/add">
              <Button variant="primary" size="sm">
                <Plus size={14} />
                Tambah Surplus Pertama
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {latestBatches.map((batch) => (
            <Link
              key={batch.id}
              href={`/app/surplus/${batch.id}`}
              className="block bg-white rounded-[14px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] transition-shadow duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1B1F1C] truncate">
                    {batch.name}
                  </p>
                  <p className="text-xs text-[#9AA39C] mt-0.5">
                    {batch.category} · {batch.quantity} {batch.unit}
                  </p>
                  <p className="text-xs text-[#5B655D] mt-1 flex items-center gap-1">
                    <Clock size={12} className="text-[#9AA39C]" />
                    {timeRemaining(batch.estimated_expiry)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <StatusBadge status={batch.freshness_status} />
                  <DistributionBadge status={batch.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* FAB on mobile */}
      <Link
        href="/app/surplus/add"
        className="sm:hidden fixed bottom-20 right-4 z-20"
        aria-label="Tambah surplus pangan"
        id="fab-add-surplus"
      >
        <div className="w-14 h-14 rounded-full bg-[#2F6E4F] flex items-center justify-center shadow-[0_4px_16px_rgba(47,110,79,0.4)] active:scale-95 transition-transform">
          <Plus size={24} className="text-white" />
        </div>
      </Link>
    </div>
  );
}
