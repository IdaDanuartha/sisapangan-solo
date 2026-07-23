"use client";

import { Trophy, Zap, Leaf, Star, Award, Package, Medal, Lock, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface BadgeDefinition {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  bg: string;
  check: (stats: BadgeStats) => boolean;
}

interface BadgeStats {
  totalBatches: number;
  totalKg: number;
  consecutiveWeeks: number;
  uniqueCategories: number;
}

const badges: BadgeDefinition[] = [
  {
    id: "first-batch",
    icon: Star,
    title: "Langkah Pertama",
    description: "Selesaikan batch surplus pertama Anda.",
    color: "#E88C2D",
    bg: "#FBEBD8",
    check: (s) => s.totalBatches >= 1,
  },
  {
    id: "10-batches",
    icon: Package,
    title: "Donor Setia",
    description: "Selesaikan 10 batch surplus.",
    color: "#2F6E4F",
    bg: "#E4F0E8",
    check: (s) => s.totalBatches >= 10,
  },
  {
    id: "50-batches",
    icon: Trophy,
    title: "Pahlawan Pangan",
    description: "Selesaikan 50 batch surplus.",
    color: "#C1502E",
    bg: "#FAEAEA",
    check: (s) => s.totalBatches >= 50,
  },
  {
    id: "5kg",
    icon: Leaf,
    title: "Penyelamat Kecil",
    description: "Selamatkan 5 kg pangan.",
    color: "#3AA65A",
    bg: "#E8F7ED",
    check: (s) => s.totalKg >= 5,
  },
  {
    id: "50kg",
    icon: Leaf,
    title: "Penyelamat Hebat",
    description: "Selamatkan 50 kg pangan.",
    color: "#2F6E4F",
    bg: "#E4F0E8",
    check: (s) => s.totalKg >= 50,
  },
  {
    id: "consecutive-5",
    icon: Zap,
    title: "Konsisten 5 Minggu",
    description: "Posting surplus 5 minggu berturut-turut.",
    color: "#E88C2D",
    bg: "#FBEBD8",
    check: (s) => s.consecutiveWeeks >= 5,
  },
  {
    id: "consecutive-12",
    icon: Zap,
    title: "Donasi Rutin Sejati",
    description: "Posting surplus 12 minggu berturut-turut (3 bulan!).",
    color: "#C1502E",
    bg: "#FAEAEA",
    check: (s) => s.consecutiveWeeks >= 12,
  },
  {
    id: "multi-category",
    icon: Award,
    title: "Donor Serba Bisa",
    description: "Donasikan 4 kategori makanan berbeda.",
    color: "#2F6E4F",
    bg: "#E4F0E8",
    check: (s) => s.uniqueCategories >= 4,
  },
];

export function BadgesClient({ stats }: { stats: BadgeStats }) {
  const { showToast } = useToast();
  const earned = badges.filter((b) => b.check(stats));
  const locked = badges.filter((b) => !b.check(stats));

  const handleShare = async (badge: BadgeDefinition) => {
    const shareText = `Saya baru saja meraih badge "${badge.title}" (${badge.description}) di SisaPangan Solo! Yuk ikut menyelamatkan makanan berlebih bersama kami! 🍱✨`;
    const shareUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Badge Diraih: ${badge.title}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // user cancelled or share failed, ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        showToast("Teks pencapaian disalin ke clipboard! Bagikan ke WhatsApp atau sosial media Anda.", "success");
      } catch (err) {
        showToast("Gagal menyalin teks ke clipboard.", "error");
      }
    }
  };

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1B1F1C]">Badge Saya</h1>
        <p className="text-sm text-[#9AA39C]">
          {earned.length}/{badges.length} badge diraih
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-[14px] p-4 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-[#1B1F1C]">Progress Keseluruhan</p>
          <p className="text-sm font-bold text-[#2F6E4F]">
            {Math.round((earned.length / badges.length) * 100)}%
          </p>
        </div>
        <div className="h-2 bg-[#F4F6F3] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2F6E4F] rounded-full transition-all duration-700"
            style={{ width: `${(earned.length / badges.length) * 100}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <div>
            <p className="text-lg font-bold text-[#1B1F1C] tabular-nums">
              {stats.totalBatches}
            </p>
            <p className="text-xs text-[#9AA39C]">Batch Selesai</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[#1B1F1C] tabular-nums">
              {stats.totalKg.toFixed(1)} kg
            </p>
            <p className="text-xs text-[#9AA39C]">Total Diselamatkan</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[#1B1F1C] tabular-nums">
              {stats.consecutiveWeeks}
            </p>
            <p className="text-xs text-[#9AA39C]">Minggu Berturut-turut</p>
          </div>
        </div>
      </div>

      {/* Earned badges */}
      {earned.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[#1B1F1C] mb-3 flex items-center gap-1.5">
            <Medal size={16} className="text-[#E88C2D]" />
            Badge Diraih ({earned.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {earned.map((badge) => (
              <div
                key={badge.id}
                className="relative bg-white rounded-[14px] p-4 shadow-sm border border-[#E4F0E8] text-center group hover:border-[#2F6E4F] transition-colors"
              >
                {/* Share Action */}
                <button
                  type="button"
                  onClick={() => handleShare(badge)}
                  className="absolute top-2.5 right-2.5 p-1 rounded-full text-[#9AA39C] hover:text-[#2F6E4F] hover:bg-[#F4F6F3] transition-colors cursor-pointer"
                  title="Bagikan Pencapaian"
                >
                  <Share2 size={13} />
                </button>

                <div
                  className="w-12 h-12 rounded-[12px] flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: badge.bg, color: badge.color }}
                >
                  <badge.icon size={24} />
                </div>
                <p className="text-sm font-semibold text-[#1B1F1C] mb-1">
                  {badge.title}
                </p>
                <p className="text-xs text-[#9AA39C] leading-relaxed">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked badges */}
      {locked.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#9AA39C] mb-3 flex items-center gap-1.5">
            <Lock size={16} className="text-[#9AA39C]" />
            Badge Belum Diraih ({locked.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {locked.map((badge) => (
              <div
                key={badge.id}
                className="bg-[#F4F6F3] rounded-[14px] p-4 border border-[#E4F0E8] text-center opacity-60"
              >
                <div className="w-12 h-12 rounded-[12px] bg-[#E4F0E8] flex items-center justify-center mx-auto mb-3 text-[#9AA39C]">
                  <badge.icon size={24} />
                </div>
                <p className="text-sm font-semibold text-[#5B655D] mb-1">
                  {badge.title}
                </p>
                <p className="text-xs text-[#9AA39C] leading-relaxed">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
