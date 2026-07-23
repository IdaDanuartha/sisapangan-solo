"use client";

import { MetricCard } from "@/components/ui/Card";
import { Package, Leaf, Activity, CheckCircle2, Sprout } from "lucide-react";

interface Props {
  metrics: {
    totalKg: number;
    totalPortions: number;
    activeSurplus: number;
    completedBatches: number;
  };
  categoryBreakdown: Record<string, number>;
  weeklyTrend: Record<string, number>;
}

const COLORS = [
  "#2F6E4F",
  "#E88C2D",
  "#C1502E",
  "#3AA65A",
  "#F0A93B",
  "#5B655D",
];

function SimpleBarChart({
  data,
  unit,
}: {
  data: Record<string, number>;
  unit: string;
}) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  if (entries.length === 0)
    return (
      <p className="text-xs text-[#9AA39C] text-center py-6">
        Belum ada data
      </p>
    );

  return (
    <div className="flex items-end gap-2 h-32">
      {entries.map(([label, val], idx) => (
        <div key={label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-[#9AA39C] tabular-nums">
            {val.toFixed(1)}
          </span>
          <div
            className="w-full rounded-t-[4px] transition-all duration-700"
            style={{
              height: `${(val / max) * 100}%`,
              minHeight: 4,
              backgroundColor: COLORS[idx % COLORS.length],
            }}
          />
          <span className="text-[10px] text-[#5B655D] text-center leading-tight">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0)
    return (
      <p className="text-xs text-[#9AA39C] text-center py-6">
        Belum ada data
      </p>
    );

  // Build SVG donut from segments
  const cx = 60;
  const cy = 60;
  const r = 48;
  const circum = 2 * Math.PI * r;

  let offset = 0;
  const segments = entries.map(([label, val], idx) => {
    const pct = val / total;
    const dash = pct * circum;
    const seg = { label, val, pct, dash, offset, color: COLORS[idx % COLORS.length] };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={120} height={120} viewBox="0 0 120 120" className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F4F6F3" strokeWidth={14} />
        {segments.map((seg, idx) => (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={14}
            strokeDasharray={`${seg.dash} ${circum - seg.dash}`}
            strokeDashoffset={-seg.offset + circum / 4}
            style={{ transition: "stroke-dasharray 0.7s ease" }}
          />
        ))}
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fill="#1B1F1C" fontWeight={700}>
          {total.toFixed(0)} kg
        </text>
      </svg>
      <ul className="space-y-1.5">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-xs text-[#5B655D]">
              {seg.label}{" "}
              <span className="font-medium text-[#1B1F1C]">
                {(seg.pct * 100).toFixed(0)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ImpactDashboardClient({
  metrics,
  categoryBreakdown,
  weeklyTrend,
}: Props) {
  const co2Saved = metrics.totalKg * 2.5; // ~2.5 kg CO₂ per kg food waste avoided

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1B1F1C]">Dashboard Dampak</h1>
        <p className="text-sm text-[#9AA39C]">
          Data real-time · diperbarui setiap 60 detik
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Diselamatkan"
          value={`${metrics.totalKg.toFixed(1)} kg`}
          sub="Batch status Selesai"
          icon={<Package size={20} />}
        />
        <MetricCard
          label="Estimasi Porsi"
          value={metrics.totalPortions.toLocaleString("id-ID")}
          sub="@200 g/porsi"
          icon={<Leaf size={20} />}
        />
        <MetricCard
          label="Surplus Aktif"
          value={metrics.activeSurplus}
          sub="Tersedia + Diklaim"
          icon={<Activity size={20} />}
        />
        <MetricCard
          label="Batch Selesai"
          value={metrics.completedBatches}
          sub="Distribusi lengkap"
          icon={<CheckCircle2 size={20} />}
        />
      </div>

      {/* CO₂ estimate banner */}
      <div className="bg-[#1E4A35] text-white rounded-[16px] p-5 mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-[12px] bg-white/10 flex items-center justify-center text-[#E4F0E8] flex-shrink-0">
          <Sprout size={28} />
        </div>
        <div>
          <p className="text-sm font-medium text-[#E4F0E8]">
            Estimasi Emisi CO₂ yang Dihindari
          </p>
          <p className="text-3xl font-bold tabular-nums">
            {co2Saved.toFixed(1)} kg
          </p>
          <p className="text-xs text-[#9AA39C] mt-0.5">
            Berdasarkan faktor konversi 2.5 kg CO₂ / kg makanan (WRAP UK, 2020)
          </p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Weekly bar chart */}
        <div className="bg-white rounded-[16px] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1B1F1C] mb-4">
            Tren Mingguan (kg)
          </h2>
          <SimpleBarChart data={weeklyTrend} unit="kg" />
        </div>

        {/* Category donut */}
        <div className="bg-white rounded-[16px] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1B1F1C] mb-4">
            Kategori Pangan Diselamatkan
          </h2>
          <DonutChart data={categoryBreakdown} />
        </div>
      </div>

      {/* Export note */}
      <p className="text-center text-xs text-[#9AA39C] mt-6">
        Data ini dapat digunakan langsung untuk laporan pemerintah daerah
        (Dinas Pangan, Disperdag, dll.) sebagai bukti dampak nyata platform.
      </p>
    </div>
  );
}
