import { Button } from "@/components/ui/Button";
import {
  StatusBadge,
  AchievementBadge,
  CategoryBadge,
  DistributionBadge,
} from "@/components/ui/Badge";
import { Card, MetricCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Package, Leaf, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design System — SisaPangan Solo",
  robots: { index: false },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-[#1B1F1C] border-b border-[#E4F0E8] pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F3]">
      <header className="bg-[#2F6E4F] text-white py-8 px-6">
        <h1 className="text-2xl font-bold font-[var(--font-display)]">
          SisaPangan Solo — Design System
        </h1>
        <p className="text-[#E4F0E8] text-sm mt-1">
          Component reference for Phase 0 deliverable
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        {/* Color Palette */}
        <Section title="Color Palette">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { name: "Harvest Green", hex: "#2F6E4F", cls: "bg-[#2F6E4F]", dark: true },
              { name: "Harvest Green Dark", hex: "#1E4A35", cls: "bg-[#1E4A35]", dark: true },
              { name: "Harvest Green Light", hex: "#E4F0E8", cls: "bg-[#E4F0E8]" },
              { name: "Warm Amber", hex: "#E88C2D", cls: "bg-[#E88C2D]", dark: true },
              { name: "Amber Soft", hex: "#FBEBD8", cls: "bg-[#FBEBD8]" },
              { name: "Clay Terracotta", hex: "#C1502E", cls: "bg-[#C1502E]", dark: true },
              { name: "Ink", hex: "#1B1F1C", cls: "bg-[#1B1F1C]", dark: true },
              { name: "Slate", hex: "#5B655D", cls: "bg-[#5B655D]", dark: true },
              { name: "Mist", hex: "#9AA39C", cls: "bg-[#9AA39C]" },
              { name: "Fog", hex: "#F4F6F3", cls: "bg-[#F4F6F3]" },
              { name: "Fresh Green (Status)", hex: "#3AA65A", cls: "bg-[#3AA65A]", dark: true },
              { name: "Urgent Amber (Status)", hex: "#F0A93B", cls: "bg-[#F0A93B]" },
              { name: "Alert Red (Status)", hex: "#D14343", cls: "bg-[#D14343]", dark: true },
            ].map((c) => (
              <div key={c.hex} className="rounded-[10px] overflow-hidden border border-[#E4F0E8]">
                <div className={`h-14 ${c.cls}`} />
                <div className="px-3 py-2 bg-white">
                  <p className="text-xs font-medium text-[#1B1F1C]">{c.name}</p>
                  <p className="text-xs text-[#9AA39C] font-mono">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <Card>
            <p
              className="text-5xl leading-tight mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Selamatkan Pangan Solo
            </p>
            <p className="text-xs text-[#9AA39C] mb-6">
              Instrument Serif — Display / Landing page headlines
            </p>
            <p className="text-2xl font-bold text-[#1B1F1C] mb-1">
              Dashboard Donor
            </p>
            <p className="text-base text-[#5B655D] mb-4">
              Inter — UI / Body / Subtitles
            </p>
            <p
              className="text-4xl font-bold text-[#1B1F1C]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              1.234 kg
            </p>
            <p className="text-xs text-[#9AA39C]">
              Inter tabular-nums — Dashboard metrics
            </p>
          </Card>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <Card>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="lg">Tambah Surplus</Button>
              <Button variant="primary" size="md">Klaim Surplus</Button>
              <Button variant="primary" size="sm">Simpan</Button>
              <Button variant="primary" isLoading>Memuat...</Button>
              <Button variant="primary" disabled>Nonaktif</Button>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              <Button variant="secondary" size="lg">Daftar sebagai Donor</Button>
              <Button variant="secondary" size="md">Filter</Button>
              <Button variant="secondary" size="sm">Edit</Button>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              <Button variant="ghost">Lihat Semua</Button>
              <Button variant="ghost">Batal</Button>
            </div>
          </Card>
        </Section>

        {/* Badges */}
        <Section title="Badges">
          <Card className="space-y-4">
            <div>
              <p className="text-xs font-medium text-[#9AA39C] mb-2 uppercase tracking-wide">
                Food Safety Status (functional)
              </p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="safe" />
                <StatusBadge status="urgent" />
                <StatusBadge status="non-consumption" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[#9AA39C] mb-2 uppercase tracking-wide">
                Distribution Status
              </p>
              <div className="flex flex-wrap gap-2">
                <DistributionBadge status="Tersedia" />
                <DistributionBadge status="Diklaim" />
                <DistributionBadge status="Diambil" />
                <DistributionBadge status="Selesai" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[#9AA39C] mb-2 uppercase tracking-wide">
                Food Category
              </p>
              <div className="flex flex-wrap gap-2">
                <CategoryBadge label="Makanan Matang" />
                <CategoryBadge label="Roti/Bakery" />
                <CategoryBadge label="Buah Potong" />
                <CategoryBadge label="Sayuran" />
                <CategoryBadge label="Bahan Segar" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[#9AA39C] mb-2 uppercase tracking-wide">
                Achievement Badges (donor gamification — visually distinct)
              </p>
              <div className="flex flex-wrap gap-2">
                <AchievementBadge label="Donor Aktif 5 Minggu Berturut-turut" />
                <AchievementBadge label="Top Donor Bulan Ini" />
              </div>
            </div>
          </Card>
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="Total Pangan Diselamatkan"
              value="1.234 kg"
              sub="Sejak platform aktif"
              icon={<Package size={20} />}
            />
            <MetricCard
              label="Estimasi Porsi Makan"
              value="6.170"
              sub="@200g per porsi"
              icon={<Leaf size={20} />}
            />
            <MetricCard
              label="Rata-rata Waktu Pickup"
              value="47 mnt"
              sub="Dari posting ke pengambilan"
              icon={<Clock size={20} />}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Card hover>
              <p className="text-sm font-medium text-[#1B1F1C]">
                Card dengan hover effect
              </p>
              <p className="text-xs text-[#9AA39C] mt-1">
                translateY(-2px) + shadow on hover
              </p>
            </Card>
            <Card padding="lg">
              <p className="text-sm font-medium text-[#1B1F1C]">
                Card padding large
              </p>
            </Card>
          </div>
        </Section>

        {/* Empty States */}
        <Section title="Empty States">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <EmptyState
                title="Belum Ada Surplus"
                description="Mulai tambahkan surplus pangan untuk ditampilkan di sini."
                variant="default"
              />
            </Card>
            <Card>
              <EmptyState
                title="Tidak Ada Surplus Terdekat"
                description="Coba perluas radius pencarian atau periksa lagi nanti."
                variant="map"
              />
            </Card>
            <Card>
              <EmptyState
                title="Riwayat Kosong"
                description="Transaksi yang sudah selesai akan muncul di sini."
                variant="history"
              />
            </Card>
          </div>
        </Section>
      </main>
    </div>
  );
}
