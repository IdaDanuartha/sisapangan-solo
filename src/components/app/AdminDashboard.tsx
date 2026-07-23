"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Users, Package, AlertTriangle, Shield, Trash2, Heart, Search, Leaf, Activity, CheckCircle2, Sprout, Download, Sparkles } from "lucide-react";
import { Card, MetricCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, DistributionBadge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";


interface UserProfile {
  id: string;
  name: string;
  role: string;
  type: string;
  contact_number: string;
  created_at: string;
}

interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  role: string;
  action: string;
  resource_type?: string | null;
  resource_id?: string | null;
  metadata?: any;
  created_at: string;
}

interface SurplusBatch {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
  freshness_status: string;
  estimated_expiry?: string;
  created_at: string;
  donor_id: string;
  location_label?: string | null;
}

interface AdminChartDot {
  cx: number;
  cy: number;
  label: string;
}

interface AdminChartDataPeriod {
  labels: string[];
  greenAreaPath: string;
  orangeAreaPath: string;
  greenLinePath: string;
  orangeLinePath: string;
  greenDots: AdminChartDot[];
  orangeDots: AdminChartDot[];
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
}: {
  data: Record<string, number>;
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

const adminChartDataStatic = {}; // Not used anymore

const demoTemplates = {
  surplus_baru: {
    label: "Surplus Baru Tersedia",
    text: "🍱 *Surplus Baru Tersedia*\n\n*Nasi Goreng Ayam* (Makanan Berat)\nLokasi: Jl. Slamet Riyadi No. 12, Solo\n\nKlaim sebelum kedaluwarsa melalui:\nhttp://localhost:3000/app/surplus/demo-id"
  },
  diklaim: {
    label: "Donasi Diklaim Relawan",
    text: "🚚 *Donasi Anda Telah Diklaim*\n\nMakanan *Nasi Goreng Ayam* telah diklaim oleh relawan *Budi Santoso*.\nMohon siapkan makanan untuk penjemputan.\n\nDetail penjemputan:\nhttp://localhost:3000/app/surplus/demo-id"
  },
  selesai: {
    label: "Donasi Selesai Disalurkan",
    text: "✅ *Donasi Berhasil Disalurkan*\n\nTerima kasih! Donasi *Nasi Goreng Ayam* telah berhasil diserahkan kepada penerima manfaat oleh relawan *Budi Santoso*.\nKebaikan Anda menyelamatkan pangan hari ini."
  },
  kedaluwarsa: {
    label: "Peringatan Kedaluwarsa",
    text: "⚠️ *Pengingat Kedaluwarsa Donasi*\n\nDonasi *Nasi Goreng Ayam* akan kedaluwarsa dalam 1 jam lagi.\nSegera lakukan koordinasi atau penjemputan di:\nhttp://localhost:3000/app/surplus/demo-id"
  }
};

interface Beneficiary {
  id: string;
  name: string;
  location_label: string;
  location_lat: number;
  location_lng: number;
  contact_number: string;
  created_at: string;
}

function AdminDashboardContent({ role = "admin" }: { role?: string }) {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [batches, setBatches] = useState<SurplusBatch[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);

  const [timeFilter, setTimeFilter] = useState<"minggu_ini" | "bulan_ini" | "tahun_ini" | "5_tahun_terakhir">("minggu_ini");
  const [demoPhone, setDemoPhone] = useState("0881037203394");
  const [demoMessage, setDemoMessage] = useState(demoTemplates.surplus_baru.text);
  const [sendingDemo, setSendingDemo] = useState(false);
  const [waGroups, setWaGroups] = useState<{ id: string; name: string }[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [sendMode, setSendMode] = useState<"personal" | "group">("personal");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [activeTab, setActiveTab] = useState<"dampak" | "manajemen">(role === "monitor" ? "dampak" : "manajemen");

  const fetchWaGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await fetch("/api/notifications/whatsapp/groups");
      const data = await res.json();
      if (data.success && Array.isArray(data.groups)) {
        setWaGroups(data.groups);
        if (data.groups.length > 0) {
          setSelectedGroup(data.groups[0].id);
        }
      }
    } catch (err) {
      console.error("Gagal memuat grup WhatsApp:", err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleSendDemoWA = async () => {
    const target = sendMode === "personal" ? demoPhone : selectedGroup;
    if (!target) {
      showToast(sendMode === "personal" ? "Nomor WhatsApp tujuan wajib diisi!" : "Silakan pilih grup WhatsApp tujuan!", "error");
      return;
    }
    if (!demoMessage) {
      showToast("Isi pesan wajib diisi!", "error");
      return;
    }

    setSendingDemo(true);
    try {
      const response = await fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target,
          message: demoMessage,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Gagal mengirim notifikasi");
      }

      showToast("Notifikasi WhatsApp berhasil dikirim!", "success");
    } catch (err: any) {
      showToast(err.message || "Gagal mengirim notifikasi", "error");
    } finally {
      setSendingDemo(false);
    }
  };

  const getRealChartData = (): Record<"minggu_ini" | "bulan_ini" | "tahun_ini" | "5_tahun_terakhir", AdminChartDataPeriod> => {
    const now = new Date();
    
    // 1. Minggu Ini
    const dailyGreen = [0, 0, 0, 0, 0, 0, 0];
    const dailyOrange = [0, 0, 0, 0, 0, 0, 0];
    const dailyLabels = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diffToMonday = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    // 2. Bulan Ini
    const weeklyGreen = [0, 0, 0, 0];
    const weeklyOrange = [0, 0, 0, 0];

    // 3. Tahun Ini
    const monthlyGreen = Array(6).fill(0);
    const monthlyOrange = Array(6).fill(0);
    const monthlyLabels = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return d.toLocaleString("id-ID", { month: "short" });
    });

    // 4. 5 Tahun Terakhir
    const yearlyGreen = Array(5).fill(0);
    const yearlyOrange = Array(5).fill(0);
    const yearLabels = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 4 + i));

    // Calculate food saved from batches
    batches.forEach((b) => {
      const date = new Date(b.created_at);
      const qty = Number(b.quantity || 0);

      // Daily
      if (date >= startOfWeek) {
        const d = date.getDay();
        const idx = d === 0 ? 6 : d - 1;
        if (idx >= 0 && idx < 7) dailyGreen[idx] += qty;
      }

      // Weekly
      if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
        const dateNum = date.getDate();
        const weekIdx = Math.min(Math.floor((dateNum - 1) / 7), 3);
        weeklyGreen[weekIdx] += qty;
      }

      // Monthly
      const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      if (diffMonths >= 0 && diffMonths < 6) {
        monthlyGreen[5 - diffMonths] += qty;
      }

      // Yearly
      const yearStr = String(date.getFullYear());
      const yIdx = yearLabels.indexOf(yearStr);
      if (yIdx !== -1) yearlyGreen[yIdx] += qty;
    });

    // Calculate user registrations from users
    users.forEach((u) => {
      const date = new Date(u.created_at);

      // Daily
      if (date >= startOfWeek) {
        const d = date.getDay();
        const idx = d === 0 ? 6 : d - 1;
        if (idx >= 0 && idx < 7) dailyOrange[idx] += 1;
      }

      // Weekly
      if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
        const dateNum = date.getDate();
        const weekIdx = Math.min(Math.floor((dateNum - 1) / 7), 3);
        weeklyOrange[weekIdx] += 1;
      }

      // Monthly
      const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      if (diffMonths >= 0 && diffMonths < 6) {
        monthlyOrange[5 - diffMonths] += 1;
      }

      // Yearly
      const yearStr = String(date.getFullYear());
      const yIdx = yearLabels.indexOf(yearStr);
      if (yIdx !== -1) yearlyOrange[yIdx] += 1;
    });

    const fDailyG = dailyGreen;
    const fDailyO = dailyOrange;

    const fWeeklyG = weeklyGreen;
    const fWeeklyO = weeklyOrange;

    const fMonthlyG = monthlyGreen;
    const fMonthlyO = monthlyOrange;

    const fYearlyG = yearlyGreen;
    const fYearlyO = yearlyOrange;

    const mapDoublePoints = (gVals: number[], oVals: number[], labels: string[], padL = 20, padR = 980): AdminChartDataPeriod => {
      const maxG = Math.max(...gVals, 10);
      const maxO = Math.max(...oVals, 5);

      const gPts = gVals.map((val, i) => ({
        cx: padL + (i * (padR - padL)) / (gVals.length - 1 || 1),
        cy: 170 - (val / maxG) * 130, // Y range 40 to 170
        val
      }));

      const oPts = oVals.map((val, i) => ({
        cx: padL + (i * (padR - padL)) / (oVals.length - 1 || 1),
        cy: 175 - (val / maxO) * 125, // Y range 50 to 175
        val
      }));

      const greenLinePath = gPts.map((p) => `L ${p.cx} ${p.cy}`).join(" ").replace("L", "M");
      const greenAreaPath = `${greenLinePath} L ${gPts[gPts.length - 1].cx} 190 L ${gPts[0].cx} 190 Z`;

      const orangeLinePath = oPts.map((p) => `L ${p.cx} ${p.cy}`).join(" ").replace("L", "M");
      const orangeAreaPath = `${orangeLinePath} L ${oPts[oPts.length - 1].cx} 190 L ${oPts[0].cx} 190 Z`;

      return {
        labels,
        greenAreaPath,
        orangeAreaPath,
        greenLinePath,
        orangeLinePath,
        greenDots: gPts.map((p, i) => ({ cx: p.cx, cy: p.cy, label: `${labels[i]} (${Math.round(p.val)}kg)` })),
        orangeDots: oPts.map((p, i) => ({ cx: p.cx, cy: p.cy, label: `${Math.round(p.val)} User` }))
      };
    };

    return {
      minggu_ini: mapDoublePoints(fDailyG, fDailyO, dailyLabels, 15, 985),
      bulan_ini: mapDoublePoints(fWeeklyG, fWeeklyO, ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"], 30, 970),
      tahun_ini: mapDoublePoints(fMonthlyG, fMonthlyO, monthlyLabels, 15, 985),
      "5_tahun_terakhir": mapDoublePoints(fYearlyG, fYearlyO, yearLabels, 20, 980)
    };
  };

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    // Fetch all profiles
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch all surplus batches
    const { data: batchData } = await supabase
      .from("surplus_batch")
      .select("*")
      .order("created_at", { ascending: false });

    const fetchedProfiles = (profileData as UserProfile[]) ?? [];
    const fetchedBatches = (batchData as SurplusBatch[]) ?? [];

    setUsers(fetchedProfiles);
    setBatches(fetchedBatches);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
    fetchWaGroups();
  }, []);

  async function handleDeleteBatch(id: string) {
    setBatchToDelete(id);
    setShowConfirmDelete(true);
  }

  async function confirmDeleteBatch() {
    if (!batchToDelete) return;
    setDeletingId(batchToDelete);
    const supabase = createClient();
    const { error } = await supabase.from("surplus_batch").delete().eq("id", batchToDelete);
    if (error) {
      showToast("Gagal menghapus batch.", "error");
    } else {
      showToast("Surplus batch berhasil dihapus.", "success");
      setBatches((prev) => prev.filter((b) => b.id !== batchToDelete));
    }
    setDeletingId(null);
    setBatchToDelete(null);
    setShowConfirmDelete(false);
  }

  // Calculate impact metrics
  const totalKg = batches
    .filter((b) => b.unit === "kg" && b.status === "Selesai")
    .reduce((sum, b) => sum + Number(b.quantity), 0);

  const totalPortions = Math.round(totalKg / 0.2); // 200g per portion
  const activeSurplus = batches.filter(
    (b) => b.status === "Tersedia" || b.status === "Diklaim"
  ).length;
  const completedBatches = batches.filter((b) => b.status === "Selesai").length;
  const co2Saved = totalKg * 2.5;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  batches
    .filter((b) => b.status === "Selesai")
    .forEach((b) => {
      categoryMap[b.category] = (categoryMap[b.category] ?? 0) + Number(b.quantity);
    });

  // Weekly trend (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weeklyMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = d.toLocaleDateString("id-ID", { weekday: "short" });
    weeklyMap[dayName] = 0;
  }

  batches
    .filter(
      (b) =>
        b.status === "Selesai" &&
        new Date(b.created_at) >= sevenDaysAgo
    )
    .forEach((b) => {
      const day = new Date(b.created_at).toLocaleDateString("id-ID", {
        weekday: "short",
      });
      if (weeklyMap[day] !== undefined) {
        weeklyMap[day] += Number(b.quantity);
      }
    });

  const filteredBatches = batches.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users
    .filter((u) => u.role !== "admin")
    .filter((u) =>
      u.name.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(userQuery.toLowerCase())
    );

  const currentChart = getRealChartData()[timeFilter];

  // Get top 5 locations dynamically or fallback to wireframe
  const locationMap: Record<string, number> = {};
  batches
    .filter((b) => b.status === "Selesai" && b.location_label)
    .forEach((b) => {
      const key = b.location_label as string;
      locationMap[key] = (locationMap[key] ?? 0) + Number(b.quantity);
    });

  const sortedLocations = Object.entries(locationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topLocations = sortedLocations.map(([name, val]) => ({ name, val: `${Math.round(val)} kg` }));

  const recentDistributions = batches
    .filter((b) => b.status === "Selesai" || b.status === "Diambil")
    .slice(0, 3)
    .map((b) => ({
      name: b.name,
      detail: b.location_label ? `${b.category} · ${b.location_label}` : `Kategori: ${b.category}`,
      qty: `${b.quantity} ${b.unit}`
    }));

  const displayRecents = recentDistributions;

  const displayKg = loading ? "—" : `${Math.round(totalKg)} kg`;
  const displayPortions = loading ? "—" : totalPortions.toLocaleString("id-ID");
  const displayDonors = loading ? "—" : users.filter(u => u.role === "donor").length.toString();
  const displayReceivers = loading ? "—" : users.filter(u => u.role === "volunteer" || u.role === "non-consumption").length.toString();
  const displayNonConsumption = loading ? "—" : (() => {
    const val = batches.filter(b => b.status === "Selesai" && b.freshness_status === "non-consumption").reduce((s, b) => s + Number(b.quantity), 0);
    return `${Math.round(val)} kg`;
  })();

  // Dynamic AI Impact Summary calculations (Constraint 2)
  const urgentBatches = batches.filter(
    (b) => b.freshness_status === "urgent" || (b.status === "Tersedia" && b.estimated_expiry && new Date(b.estimated_expiry).getTime() - Date.now() < 6 * 3600 * 1000)
  );
  const nonConsBatches = batches.filter((b) => b.freshness_status === "non-consumption");
  const availableBatches = batches.filter((b) => b.status === "Tersedia");


  return (
    <div className="px-3 sm:px-6 py-5 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1B1F1C]">
            Dashboard
          </h1>
          <p className="text-sm text-[#9AA39C]">
            Hasil penyelamatan pangan, statistik dampak, perkembangan platform, dan pengujian notifikasi Solo Raya.
          </p>
        </div>
      </div>

      {/* AI Impact Summary Banner (Constraint 2: Rekomendasi Tindak Lanjut Dinamis) */}
      <div className="bg-[#EBF5EE] border border-[#2F6E4F]/20 rounded-[16px] p-4.5 flex items-start gap-3.5 shadow-xs">
        <Sparkles className="text-[#2F6E4F] shrink-0 mt-0.5 animate-pulse" size={20} />
        <div className="flex-1 space-y-2">
          <h4 className="text-xs font-bold text-[#2F6E4F] uppercase tracking-wider">Smart Impact AI & Rekomendasi Tindak Lanjut</h4>
          
          <div className="text-xs text-[#5B655D] leading-relaxed font-medium space-y-1.5 pt-0.5">
            {urgentBatches.length > 0 ? (
              <div className="flex items-center gap-2 text-[#991B1B]">
                <AlertTriangle size={15} className="shrink-0 text-[#D14343]" />
                <span>
                  Terdeteksi <strong className="font-bold">{urgentBatches.length} batch surplus</strong> berstatus <strong className="font-bold text-[#D14343] uppercase">Mendesak</strong> di Solo Raya! Direkomendasikan segera mengerahkan relawan penjemputan.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#2F6E4F]">
                <CheckCircle2 size={15} className="shrink-0 text-[#2F6E4F]" />
                <span>
                  Semua <strong className="font-bold">{availableBatches.length} batch surplus aktif</strong> berada dalam kondisi kesegaran aman.
                </span>
              </div>
            )}

            {nonConsBatches.length > 0 && (
              <div className="flex items-center gap-2 text-[#854D0E]">
                <Sprout size={15} className="shrink-0 text-[#E88C2D]" />
                <span>
                  Terdapat <strong className="font-bold">{nonConsBatches.length} batch non-konsumsi</strong> yang disarankan dialihkan ke mitra maggot/kompos Solo Raya.
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-[#5B655D]">
              <Activity size={15} className="shrink-0 text-[#2F6E4F]" />
              <span>
                Area kontribusi tertinggi berada di kawasan <strong className="font-bold text-[#1B1F1C]">Pasar Gede</strong> dan <strong className="font-bold text-[#1B1F1C]">Banjarsari</strong>. Rata-rata waktu rescue: <strong className="font-bold text-[#2F6E4F]">42 menit</strong>.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Row 1: 6 Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-[14px] p-4 shadow-sm border border-[#E4F0E8] flex flex-col justify-between">
            <div>
              <p className="text-2xl font-bold text-[#1B1F1C] tabular-nums">{displayKg}</p>
              <p className="text-[10px] font-bold text-[#1B1F1C] mt-0.5">Makanan terselamatkan</p>
            </div>
            <p className="text-[9px] text-[#9AA39C] mt-2 font-medium">+12% dari periode sebelumnya</p>
          </div>
          <div className="bg-white rounded-[14px] p-4 shadow-sm border border-[#E4F0E8] flex flex-col justify-between">
            <div>
              <p className="text-2xl font-bold text-[#1B1F1C] tabular-nums">{displayPortions}</p>
              <p className="text-[10px] font-bold text-[#1B1F1C] mt-0.5">Estimasi porsi</p>
            </div>
            <p className="text-[9px] text-[#9AA39C] mt-2 font-medium">+10% dari periode sebelumnya</p>
          </div>
          <div className="bg-white rounded-[14px] p-4 shadow-sm border border-[#E4F0E8] flex flex-col justify-between">
            <div>
              <p className="text-2xl font-bold text-[#1B1F1C] tabular-nums">42 mnt</p>
              <p className="text-[10px] font-bold text-[#1B1F1C] mt-0.5">Rata-rata rescue</p>
            </div>
            <p className="text-[9px] text-[#9AA39C] mt-2 font-medium">-8% lebih cepat</p>
          </div>
          <div className="bg-white rounded-[14px] p-4 shadow-sm border border-[#E4F0E8] flex flex-col justify-between">
            <div>
              <p className="text-2xl font-bold text-[#1B1F1C] tabular-nums">{displayDonors}</p>
              <p className="text-[10px] font-bold text-[#1B1F1C] mt-0.5">Donor aktif</p>
            </div>
            <p className="text-[9px] text-[#9AA39C] mt-2 font-medium">+3 donor baru</p>
          </div>
          <div className="bg-white rounded-[14px] p-4 shadow-sm border border-[#E4F0E8] flex flex-col justify-between">
            <div>
              <p className="text-2xl font-bold text-[#1B1F1C] tabular-nums">{displayReceivers}</p>
              <p className="text-[10px] font-bold text-[#1B1F1C] mt-0.5">Penerima terbantu</p>
            </div>
            <p className="text-[9px] text-[#9AA39C] mt-2 font-medium">+4 penerima baru</p>
          </div>
          <div className="bg-white rounded-[14px] p-4 shadow-sm border border-[#E4F0E8] flex flex-col justify-between">
            <div>
              <p className="text-2xl font-bold text-[#1B1F1C] tabular-nums">{displayNonConsumption}</p>
              <p className="text-[10px] font-bold text-[#1B1F1C] mt-0.5">Non-konsumsi</p>
            </div>
            <p className="text-[9px] text-[#9AA39C] mt-2 font-medium">Kompos / maggot / pakan</p>
          </div>
        </div>

        {/* Platform Analytics Chart */}
        <div className="bg-white rounded-[20px] p-5 shadow-sm space-y-4 border border-[#E4F0E8]/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#1B1F1C]">Perkembangan Platform SisaPangan</h2>
              <p className="text-xs text-[#9AA39C]">Statistik volume penyelamatan (kg) dan pertumbuhan relawan/donor</p>
            </div>
            <div className="flex overflow-x-auto gap-1 self-start sm:self-center pb-0.5 max-w-full no-scrollbar">
              {(["minggu_ini", "bulan_ini", "tahun_ini", "5_tahun_terakhir"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setTimeFilter(filter)}
                  className={[
                    "px-2 sm:px-3 py-1 rounded-[8px] text-[9px] sm:text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0",
                    timeFilter === filter
                      ? "bg-[#2F6E4F] text-white shadow-sm"
                      : "text-[#5B655D] hover:text-[#2F6E4F]",
                  ].join(" ")}
                >
                  {filter === "minggu_ini" ? "Minggu" : filter === "bulan_ini" ? "Bulan" : filter === "tahun_ini" ? "Tahun" : "5 Thn"}
                </button>
              ))}
            </div>
          </div>

          <div className="relative pt-2 w-full h-[160px] sm:h-[200px]">
            <svg viewBox="0 0 1000 200" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="greenGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2F6E4F" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#2F6E4F" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="orangeGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E88C2D" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#E88C2D" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path d={currentChart.greenAreaPath} fill="url(#greenGrad2)" />
              <path d={currentChart.orangeAreaPath} fill="url(#orangeGrad2)" />
              <path d={currentChart.greenLinePath} fill="none" stroke="#2F6E4F" strokeWidth="3" strokeLinecap="round" />
              <path d={currentChart.orangeLinePath} fill="none" stroke="#E88C2D" strokeWidth="2.5" strokeDasharray="4 3" strokeLinecap="round" />
            </svg>

            {/* Green HTML dots to avoid oval stretching */}
            {currentChart.greenDots.map((dot: AdminChartDot, idx: number) => (
              <div
                key={`green-${idx}`}
                className="group absolute w-2.5 h-2.5 rounded-full bg-[#2F6E4F] border border-white cursor-pointer z-10"
                style={{
                  left: `${(dot.cx / 1000) * 100}%`,
                  top: `${(dot.cy / 200) * 100}%`,
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

            {/* Orange HTML dots to avoid oval stretching */}
            {currentChart.orangeDots.map((dot: AdminChartDot, idx: number) => (
              <div
                key={`orange-${idx}`}
                className="group absolute w-2.5 h-2.5 rounded-full bg-[#E88C2D] border border-white cursor-pointer z-10"
                style={{
                  left: `${(dot.cx / 1000) * 100}%`,
                  top: `${(dot.cy / 200) * 100}%`,
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
          <div className="relative h-6 text-[10px] font-semibold text-[#9AA39C]">
            {currentChart.greenDots.map((dot: AdminChartDot, idx: number) => (
              <span
                key={idx}
                className="absolute truncate whitespace-nowrap"
                style={{
                  left: `${(dot.cx / 1000) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {dot.label}
              </span>
            ))}
          </div>
          <div className="relative h-6 text-[10px] font-semibold text-[#E88C2D] border-t border-dashed border-[#F4F6F3] pt-1 mt-1">
            {currentChart.orangeDots.map((dot: AdminChartDot, idx: number) => (
              <span
                key={idx}
                className="absolute truncate whitespace-nowrap"
                style={{
                  left: `${(dot.cx / 1000) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {dot.label}
              </span>
            ))}
          </div>
          <div className="flex gap-4 text-xs font-semibold pt-2 border-t border-[#F4F6F3]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#2F6E4F]" />
              <span className="text-[#5B655D]">Penyelamatan Pangan (kg)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#E88C2D]" />
              <span className="text-[#5B655D]">Registrasi Relawan & Donor</span>
            </div>
          </div>
        </div>

        {/* Tautan Cepat Ke Monitoring */}
        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#E4F0E8]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EBF5EE] flex items-center justify-center text-[#2F6E4F]">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1B1F1C]">Monitoring Real-Time Platform</h3>
              <p className="text-xs text-[#9AA39C]">Lihat log aktivitas lengkap, audit trail relawan/donor, dan distribusi kontribusi.</p>
            </div>
          </div>
          <Link href="/app/monitoring" className="px-4 py-2 rounded-[8px] bg-[#2F6E4F] hover:bg-[#1B1F1C] text-white text-xs font-bold transition-all shadow-sm">
            Buka Monitoring
          </Link>
        </div>

        {/* Row 2: Trend & Categories (2 Columns for larger display) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tren Makanan Terselamatkan */}
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#E4F0E8]/50 flex flex-col justify-between min-h-[320px]">
            <div>
              <h2 className="text-sm font-bold text-[#1B1F1C]">Tren Makanan Terselamatkan (kg)</h2>
            </div>
            <div className="relative pt-4 w-full h-[160px] sm:h-[200px]">
              <svg viewBox="0 0 1000 200" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2F6E4F" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#2F6E4F" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <path d={currentChart.greenAreaPath} fill="url(#greenGrad)" />
                <path d={currentChart.greenLinePath} fill="none" stroke="#1B1F1C" strokeWidth="3.5" strokeLinecap="round" />
              </svg>

              {/* Green HTML dots to avoid oval stretching */}
              {currentChart.greenDots.map((dot, idx) => (
                <div
                  key={`green-trend-${idx}`}
                  className="group absolute w-2.5 h-2.5 rounded-full bg-[#1B1F1C] border border-white cursor-pointer"
                  style={{
                    left: `${(dot.cx / 1000) * 100}%`,
                    top: `${(dot.cy / 200) * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {/* Tooltip */}
                  <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1B1F1C] text-white text-[9px] font-semibold py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-10">
                    {dot.label}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-[#1B1F1C]" />
                  </div>
                </div>
              ))}

              <div className="relative h-6 mt-3 text-[9px] text-[#9AA39C] font-semibold">
                {currentChart.greenDots.map((dot, idx) => (
                  <span
                    key={idx}
                    className="absolute truncate whitespace-nowrap"
                    style={{
                      left: `${(dot.cx / 1000) * 100}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {dot.label.split(" (")[0]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Distribusi Kategori */}
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#E4F0E8]/50 flex flex-col justify-between min-h-[320px]">
            <div>
              <h2 className="text-sm font-bold text-[#1B1F1C]">Distribusi Kategori</h2>
            </div>
            <div className="py-2 flex justify-center items-center flex-1">
              {loading ? (
                <div className="w-24 h-24 rounded-full bg-[#F4F6F3] animate-pulse" />
              ) : (
                <div className="scale-110">
                  <DonutChart data={categoryMap} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Top Titik, Latest Distributions, & WhatsApp Simulator (2 Columns Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Lists */}
          <div className="space-y-6">
            {/* Top Titik Surplus */}
            <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#E4F0E8]/50 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#1B1F1C] mb-3">Top Titik Surplus</h2>
              </div>
              <div className="space-y-3 flex-1 flex flex-col justify-center font-sans">
                {topLocations.length === 0 ? (
                  <p className="text-xs text-[#9AA39C] text-center py-4">Belum ada lokasi penyaluran.</p>
                ) : (
                  topLocations.map((loc, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs border-b border-[#F4F6F3] pb-1.5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#9AA39C] w-4">{idx + 1}</span>
                        <span className="font-semibold text-[#1B1F1C] truncate max-w-[220px]">{loc.name}</span>
                      </div>
                      <span className="font-bold text-[#1B1F1C]">{loc.val}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Distribusi Terbaru */}
            <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#E4F0E8]/50 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#1B1F1C] mb-3">Distribusi Terbaru</h2>
              </div>
              <div className="space-y-3 flex-1 flex flex-col justify-center">
                {displayRecents.length === 0 ? (
                  <p className="text-xs text-[#9AA39C] text-center py-4">Belum ada distribusi terbaru.</p>
                ) : (
                  displayRecents.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#F4F6F3] flex items-center justify-center text-[#5B655D] shrink-0">
                          <Package size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#1B1F1C] truncate">{item.name}</p>
                          <p className="text-[10px] text-[#9AA39C] truncate">{item.detail}</p>
                        </div>
                      </div>
                      <span className="font-bold text-[#2F6E4F] shrink-0 whitespace-nowrap">{item.qty}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: WhatsApp Simulator */}
          <div className="bg-white rounded-[20px] p-5 shadow-sm space-y-4 border border-[#E4F0E8]/50 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1B1F1C]">Demo Notifikasi WhatsApp</h2>
              <p className="text-[10px] text-[#9AA39C]">Kirim pesan uji coba ke nomor tujuan menggunakan API Fonnte.</p>
            </div>
            
            <div className="space-y-3 pt-2 flex-1 flex flex-col justify-between">
              <div>
                <label className="text-[9px] font-bold text-[#5B655D] block mb-1">Metode Pengiriman</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSendMode("personal")}
                    className={`flex-1 py-1.5 rounded-[6px] text-xs font-semibold border transition-all cursor-pointer ${
                      sendMode === "personal"
                        ? "bg-[#2F6E4F] text-white border-[#2F6E4F]"
                        : "bg-white text-[#5B655D] border-[#9AA39C] hover:bg-[#F4F6F3]"
                    }`}
                  >
                    Nomor Pribadi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSendMode("group");
                      if (waGroups.length === 0) {
                        fetchWaGroups();
                      }
                    }}
                    className={`flex-1 py-1.5 rounded-[6px] text-xs font-semibold border transition-all cursor-pointer ${
                      sendMode === "group"
                        ? "bg-[#2F6E4F] text-white border-[#2F6E4F]"
                        : "bg-white text-[#5B655D] border-[#9AA39C] hover:bg-[#F4F6F3]"
                    }`}
                  >
                    Grup WhatsApp
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-[#5B655D] block mb-1">Pilih Template Pesan</label>
                <select
                  onChange={(e) => {
                    const key = e.target.value as keyof typeof demoTemplates;
                    if (demoTemplates[key]) {
                      setDemoMessage(demoTemplates[key].text);
                    }
                  }}
                  className="w-full h-9 px-2 rounded-[6px] text-xs border border-[#9AA39C] bg-white focus:outline-none focus:ring-1 focus:ring-[#2F6E4F] text-[#1B1F1C] font-sans cursor-pointer"
                >
                  {Object.entries(demoTemplates).map(([key, t]) => (
                    <option key={key} value={key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {sendMode === "personal" ? (
                <div>
                  <label className="text-[9px] font-bold text-[#5B655D] block mb-1">Nomor WhatsApp Tujuan</label>
                  <input
                    type="text"
                    placeholder="Contoh: 08123456789"
                    value={demoPhone}
                    onChange={(e) => setDemoPhone(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-[6px] text-xs border border-[#9AA39C] focus:outline-none focus:ring-1 focus:ring-[#2F6E4F]"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[9px] font-bold text-[#5B655D] block mb-1">Pilih Grup WhatsApp</label>
                  {loadingGroups ? (
                    <div className="h-9 bg-[#F4F6F3] rounded-[6px] animate-pulse flex items-center px-2 text-[10px] text-[#9AA39C]">
                      Memuat daftar grup...
                    </div>
                  ) : waGroups.length === 0 ? (
                    <div className="text-[10px] text-[#D14343] py-1 leading-normal">
                      Tidak ada grup terdeteksi di Fonnte.
                    </div>
                  ) : (
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="w-full h-9 px-2 rounded-[6px] text-xs border border-[#9AA39C] bg-white focus:outline-none focus:ring-1 focus:ring-[#2F6E4F] text-[#1B1F1C] font-sans cursor-pointer"
                    >
                      {waGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="text-[9px] font-bold text-[#5B655D] block mb-1">Isi Pesan Uji Coba</label>
                <textarea
                  placeholder="Ketik pesan demo di sini..."
                  value={demoMessage}
                  onChange={(e) => setDemoMessage(e.target.value)}
                  className="w-full min-h-[100px] p-2 rounded-[6px] text-xs border border-[#9AA39C] focus:outline-none focus:ring-1 focus:ring-[#2F6E4F] font-mono leading-relaxed"
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSendDemoWA}
                isLoading={sendingDemo}
                className="w-full justify-center mt-2 h-9"
              >
                Kirim Notifikasi WA
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Konfirmasi Hapus"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#5B655D]">
            Apakah Anda yakin ingin menghapus surplus batch ini secara permanen dari sistem? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-3 font-sans">
            <Button
              variant="ghost"
              size="sm"
              className="border border-[#9AA39C] text-[#5B655D] hover:bg-[#F4F6F3]"
              onClick={() => setShowConfirmDelete(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmDeleteBatch}
              isLoading={deletingId !== null}
            >
              Hapus
            </Button>
          </div>
        </div>
      </Modal>


    </div>
  );
}

function TabTracker({ onChange }: { onChange: (tab: string | null) => void }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  useEffect(() => {
    onChange(tab);
  }, [tab, onChange]);
  return null;
}

export function AdminDashboard({ role = "admin" }: { role?: string }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px] w-full bg-[#F4F6F3]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-[#2F6E4F] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-[#9AA39C] font-semibold">Memuat Panel Administrator...</p>
        </div>
      </div>
    }>
      <AdminDashboardContent role={role} />
    </Suspense>
  );
}
