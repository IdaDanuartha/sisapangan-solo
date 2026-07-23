"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  QrCode,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Package,
  Thermometer,
  FileText,
  Check,
  ShieldCheck,
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
} from "lucide-react";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusBadge, DistributionBadge, CategoryBadge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { logUserActivity } from "@/lib/activity";
import { Modal } from "@/components/ui/Modal";


function formatRecipeSuggestions(text: string | null) {
  if (!text) return null;

  // Split by bullet points: typically starting with "•" or "-" or "*"
  const lines = text.split(/(?:^|\n)\s*•\s*/);

  // If the text couldn't be parsed with bullet points, check for other formats or return pre-line
  if (lines.length <= 1) {
    const paragraphs = text.split("\n").filter(p => p.trim());
    if (paragraphs.length === 0) return null;

    return (
      <div className="space-y-3 font-sans">
        {paragraphs.map((p, idx) => {
          const boldRegex = /\*\*(.*?)\*\*/g;
          const parts = [];
          let lastIndex = 0;
          let match;
          while ((match = boldRegex.exec(p)) !== null) {
            if (match.index > lastIndex) {
              parts.push(p.substring(lastIndex, match.index));
            }
            parts.push(
              <strong key={match.index} className="text-[#1E4A35] font-bold">
                {match[1]}
              </strong>
            );
            lastIndex = boldRegex.lastIndex;
          }
          if (lastIndex < p.length) {
            parts.push(p.substring(lastIndex));
          }
          return (
            <p key={idx} className="text-xs text-[#5B655D]">
              {parts.length > 0 ? parts : p}
            </p>
          );
        })}
      </div>
    );
  }

  const intro = lines[0].trim();
  const listItems = lines.slice(1).map(l => l.trim()).filter(l => l);

  return (
    <div className="space-y-4 font-sans">
      {intro && (
        <p className="text-xs text-[#1E4A35] font-semibold mb-2">{intro}</p>
      )}
      <div className="space-y-3">
        {listItems.map((item, idx) => {
          const boldMatch = item.match(/^\*\*(.*?)\*\*([\s\S]*)/);
          let title = "";
          let body = item;

          if (boldMatch) {
            title = boldMatch[1].replace(/:$/, "").trim();
            body = boldMatch[2].trim();
          } else {
            const colonIdx = item.indexOf(":");
            if (colonIdx !== -1) {
              title = item.substring(0, colonIdx).trim();
              body = item.substring(colonIdx + 1).trim();
            }
          }

          if (body.startsWith(":")) {
            body = body.substring(1).trim();
          }

          return (
            <div key={idx} className="flex items-start gap-3 p-3 bg-white/70 rounded-[10px] border border-[#2F6E4F]/10 hover:bg-white/90 hover:shadow-md transition-all duration-200">
              <div className="w-5 h-5 rounded-full bg-[#2F6E4F]/10 flex items-center justify-center text-[#2F6E4F] text-[10px] font-bold shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="space-y-0.5">
                {title && (
                  <h4 className="text-xs font-bold text-[#1E4A35]">{title}</h4>
                )}
                <p className="text-xs text-[#5B655D] leading-relaxed">{body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface Batch {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: "Tersedia" | "Diklaim" | "Diambil" | "Selesai";
  freshness_status: "safe" | "urgent" | "non-consumption";
  freshness_reason: string;
  estimated_expiry: string;
  location_lat: number;
  location_lng: number;
  location_label: string;
  photo_urls: string[] | null;
  notes: string | null;
  storage_condition: string | null;
  qr_code: string | null;
  qr_data_url: string | null;
  pickup_rating: number | null;
  created_at: string;
  donor_id: string;
  profiles?: { name: string; type: string } | null;
}

interface DistributionLog {
  id: string;
  status: string;
  timestamp: string;
  profiles?: { name: string } | null;
}

interface Props {
  batch: Batch;
  logs: DistributionLog[];
  currentUserId: string | null;
  currentUserRole: string;
  isVerified?: boolean;
}

const statusFlow = ["Tersedia", "Diklaim", "Diambil", "Selesai"] as const;

const categoryOptions = [
  { value: "Makanan Matang", label: "Makanan Matang" },
  { value: "Roti/Bakery", label: "Roti / Bakery" },
  { value: "Buah Potong", label: "Buah Potong" },
  { value: "Sayuran", label: "Sayuran" },
  { value: "Bahan Segar", label: "Bahan Segar" },
  { value: "Pakan/Kompos", label: "Pakan / Kompos" },
  { value: "Lainnya", label: "Lainnya" },
];

const unitOptions = [
  { value: "porsi", label: "Porsi" },
  { value: "kg", label: "Kg" },
  { value: "box", label: "Box" },
];

const storageOptions = [
  { value: "suhu_ruang", label: "Suhu Ruang" },
  { value: "kulkas", label: "Kulkas" },
];

export function BatchDetailClient({ batch, logs, currentUserId, currentUserRole, isVerified = true }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentBatch, setCurrentBatch] = useState(batch);
  const [rating, setRating] = useState<number | null>(batch.pickup_rating);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmClaim, setShowConfirmClaim] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(batch.qr_data_url || null);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);



  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  const [recipeSuggestions, setRecipeSuggestions] = useState<string | null>(null);

  useState(() => {
    // Generate/fetch QR code immediately on client side if null
    if (!qrDataUrl) {
      fetch(`/api/qr/${batch.id}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.dataUrl) setQrDataUrl(json.dataUrl);
        })
        .catch(console.error);
    }
  });

  useEffect(() => {
    const cacheKey = `recipe_cache_${currentBatch.id}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (
          parsed.name === currentBatch.name &&
          parsed.category === currentBatch.category &&
          parsed.freshness_status === currentBatch.freshness_status &&
          parsed.suggestions
        ) {
          setRecipeSuggestions(parsed.suggestions);
          return;
        }
      } catch {}
    }

    const fetchRecipeSuggestions = async () => {
      setIsGeneratingRecipe(true);
      try {
        const res = await fetch("/api/ai/recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            foodName: currentBatch.name,
            category: currentBatch.category,
            freshnessStatus: currentBatch.freshness_status,
          }),
        });
        const data = await res.json();
        if (data.success && data.suggestions) {
          setRecipeSuggestions(data.suggestions);
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              name: currentBatch.name,
              category: currentBatch.category,
              freshness_status: currentBatch.freshness_status,
              suggestions: data.suggestions,
            })
          );
        }
      } catch (err) {
        console.error("Gagal mendapatkan rekomendasi pemanfaatan:", err);
      } finally {
        setIsGeneratingRecipe(false);
      }
    };

    fetchRecipeSuggestions();
  }, [currentBatch.id, currentBatch.name, currentBatch.category, currentBatch.freshness_status]);

  const isOwner = currentUserId === currentBatch.donor_id;
  const canClaim =
    (currentUserRole === "volunteer" || currentUserRole === "non-consumption") &&
    currentBatch.status === "Tersedia" &&
    isVerified;
  const canUpdateStatus =
    (currentUserRole === "volunteer" || currentUserRole === "non-consumption") &&
    (currentBatch.status === "Diklaim" || currentBatch.status === "Diambil") &&
    isVerified;
  const showRatingPrompt =
    currentBatch.status === "Selesai" &&
    (currentUserRole === "volunteer" || currentUserRole === "non-consumption") &&
    rating === null;

  async function handleClaim() {
    setShowConfirmClaim(true);
  }

  async function confirmClaim() {
    setIsUpdating(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("surplus_batch")
      .update({ status: "Diklaim" })
      .eq("id", currentBatch.id);

    if (!error) {
      await supabase.from("distribution_log").insert({
        batch_id: currentBatch.id,
        volunteer_id: currentUserId,
        status: "Diklaim",
        timestamp: new Date().toISOString(),
      });

      // Log activity
      try {
        await logUserActivity({
          userId: currentUserId || undefined,
          action: currentBatch.freshness_status === "non-consumption" 
            ? "Mengklaim Surplus Non-Konsumsi" 
            : "Mengklaim Penjemputan Batch",
          resourceType: "surplus_batch",
          resourceId: currentBatch.id,
          metadata: { name: currentBatch.name, status: "Diklaim" },
        });
      } catch (logErr) {
        console.error("Gagal mencatat log aktivitas:", logErr);
      }

      setCurrentBatch((prev) => ({ ...prev, status: "Diklaim" }));
      showToast("Surplus berhasil diklaim!", "success");
    }
    setIsUpdating(false);
    setShowConfirmClaim(false);
  }

  async function advanceStatus() {
    const nextStatus =
      currentBatch.status === "Diklaim" ? "Diambil" : "Selesai";
    setIsUpdating(true);
    const supabase = createClient();
    await supabase
      .from("surplus_batch")
      .update({ status: nextStatus })
      .eq("id", currentBatch.id);
    await supabase.from("distribution_log").insert({
      batch_id: currentBatch.id,
      volunteer_id: currentUserId,
      status: nextStatus,
      timestamp: new Date().toISOString(),
    });

    // Log activity
    try {
      await logUserActivity({
        userId: currentUserId || undefined,
        action: nextStatus === "Diambil" ? "Mengambil Makanan (Pickup)" : "Menyelesaikan Distribusi Pangan",
        resourceType: "surplus_batch",
        resourceId: currentBatch.id,
        metadata: { name: currentBatch.name, status: nextStatus },
      });
    } catch (logErr) {
      console.error("Gagal mencatat log aktivitas:", logErr);
    }

    setCurrentBatch((prev) => ({ ...prev, status: nextStatus as any }));
    showToast(`Status diperbarui: ${nextStatus}`, "success");
    setIsUpdating(false);
  }

  async function submitRating(value: number) {
    const supabase = createClient();
    await supabase
      .from("surplus_batch")
      .update({ pickup_rating: value })
      .eq("id", currentBatch.id);
    setRating(value);
    showToast("Terima kasih atas penilaianmu!", "success");
  }



  async function handleDeleteSurplus() {
    setIsUpdating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("surplus_batch")
        .delete()
        .eq("id", currentBatch.id);

      if (error) throw error;

      showToast("Surplus berhasil dihapus!", "success");
      router.push("/app/dashboard");
    } catch (err: any) {
      console.error(err);
      showToast("Gagal menghapus surplus: " + err.message, "error");
    } finally {
      setIsUpdating(false);
      setShowConfirmDelete(false);
    }
  }

  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${currentBatch.location_lat},${currentBatch.location_lng}`;
  const qrUrl = currentBatch.qr_code
    ? `/scan/${currentBatch.qr_code}`
    : null;

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto">
      {/* Back & Actions */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#2F6E4F] font-medium hover:underline"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>

        {(isOwner || currentUserRole === "admin") && currentBatch.status === "Tersedia" && (
          <div className="flex items-center gap-2">
            <Link
              href={`/app/surplus/${currentBatch.id}/edit`}
              className="p-2 rounded-full text-[#5B655D] hover:text-[#2F6E4F] hover:bg-[#F4F6F3] transition-colors"
              title="Edit Surplus"
              id="btn-edit-surplus-top"
            >
              <Pencil size={18} />
            </Link>
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="p-2 rounded-full text-[#D14343] hover:bg-[#FAEAEA] transition-colors"
              title="Hapus Surplus"
              id="btn-delete-surplus-top"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Photos */}
      {currentBatch.photo_urls && currentBatch.photo_urls.length > 0 ? (
        <div className="mb-5">
          {currentBatch.photo_urls.length === 1 ? (
            // 1 Photo: Full width banner
            <div className="w-full h-64 sm:h-80 rounded-[16px] overflow-hidden border border-[#E4F0E8] shadow-sm">
              {imgErrors[0] ? (
                <div className="w-full h-full bg-[#F4F6F3] flex flex-col items-center justify-center text-center p-4">
                  <Package className="text-[#9AA39C] mb-2" size={32} />
                  <p className="text-xs font-bold text-[#5B655D]">Foto Tidak Tersedia</p>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentBatch.photo_urls[0]}
                  alt="Foto Surplus Pangan"
                  className="w-full h-full object-cover"
                  onError={() => setImgErrors((prev) => ({ ...prev, 0: true }))}
                />
              )}
            </div>
          ) : currentBatch.photo_urls.length === 2 ? (
            // 2 Photos: 2-column grid
            <div className="grid grid-cols-2 gap-3">
              {currentBatch.photo_urls.map((url, i) => (
                <div key={i} className="w-full h-48 sm:h-60 rounded-[16px] overflow-hidden border border-[#E4F0E8] shadow-sm">
                  {imgErrors[i] ? (
                    <div className="w-full h-full bg-[#F4F6F3] flex flex-col items-center justify-center text-center p-3">
                      <Package className="text-[#9AA39C] mb-1" size={24} />
                      <p className="text-[10px] font-bold text-[#5B655D]">Foto Tidak Tersedia</p>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => setImgErrors((prev) => ({ ...prev, [i]: true }))}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            // 3 or more Photos: grid of 3 columns, or 4 for more
            <div className={`grid ${currentBatch.photo_urls.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"} gap-3`}>
              {currentBatch.photo_urls.map((url, i) => (
                <div key={i} className="w-full h-32 sm:h-44 rounded-[16px] overflow-hidden border border-[#E4F0E8] shadow-sm">
                  {imgErrors[i] ? (
                    <div className="w-full h-full bg-[#F4F6F3] flex flex-col items-center justify-center text-center p-2">
                      <Package className="text-[#9AA39C] mb-1" size={20} />
                      <p className="text-[9px] font-bold text-[#5B655D]">Tidak Tersedia</p>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => setImgErrors((prev) => ({ ...prev, [i]: true }))}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="h-40 w-full rounded-[12px] bg-[#F4F6F3] border border-[#E4F0E8] flex flex-col items-center justify-center text-center p-4 mb-5">
          <Package className="text-[#9AA39C] mb-2" size={28} />
          <p className="text-xs font-bold text-[#1B1F1C]">Foto Makanan Belum Diunggah</p>
          <p className="text-[10px] text-[#9AA39C] mt-0.5">Donatur tidak melampirkan foto saat pendaftaran.</p>
        </div>
      )}

      {/* Title + badges */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#1B1F1C]">{currentBatch.name}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <CategoryBadge label={currentBatch.category} />
            <StatusBadge status={currentBatch.freshness_status} />
            <DistributionBadge status={currentBatch.status} />
          </div>
        </div>
      </div>

      {/* Freshness Score Card */}
      <div
        className={[
          "rounded-[12px] p-4 border mb-5 animate-fade-in",
          currentBatch.freshness_status === "safe"
            ? "bg-[#E8F7ED] border-[#3AA65A]/30"
            : currentBatch.freshness_status === "urgent"
            ? "bg-[#FEF6E4] border-[#F0A93B]/30"
            : "bg-[#FAEAEA] border-[#D14343]/30",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          {currentBatch.freshness_status === "safe" ? (
            <CheckCircle2 size={18} className="text-[#3AA65A] flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={18} className="text-[#F0A93B] flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-[#1B1F1C]">
                Skor Kesegaran Pangan
              </p>
              <StatusBadge status={currentBatch.freshness_status} />
            </div>
            <p className="text-xs text-[#5B655D] leading-relaxed">
              {currentBatch.freshness_reason}
            </p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-[14px] p-4 shadow-sm mb-4 space-y-3">
        <DetailRow
          icon={<User size={14} />}
          label="Donor"
          value={
            currentBatch.profiles
              ? `${currentBatch.profiles.name} (${currentBatch.profiles.type})`
              : "—"
          }
        />
        <DetailRow
          icon={<Package size={14} />}
          label="Jumlah"
          value={`${currentBatch.quantity} ${currentBatch.unit}`}
        />
        <DetailRow
          icon={<Clock size={14} />}
          label="Layak hingga"
          value={new Date(currentBatch.estimated_expiry).toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        />
        {currentBatch.storage_condition && (
          <DetailRow
            icon={<Thermometer size={14} />}
            label="Kondisi simpan"
            value={
              currentBatch.storage_condition === "kulkas"
                ? "Disimpan di kulkas"
                : "Suhu ruang"
            }
          />
        )}
        <DetailRow
          icon={<MapPin size={14} />}
          label="Lokasi"
          value={currentBatch.location_label || `${currentBatch.location_lat}, ${currentBatch.location_lng}`}
        />
        {currentBatch.notes && (
          <DetailRow
            icon={<FileText size={14} />}
            label="Catatan"
            value={currentBatch.notes}
          />
        )}
      </div>

      {/* Distribution timeline */}
      {logs.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-[#1B1F1C] mb-3">Riwayat Distribusi</h2>
          <div className="space-y-2">
            {logs.map((log, idx) => (
              <div key={log.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-[#2F6E4F] mt-1" />
                  {idx < logs.length - 1 && (
                    <div className="w-0.5 h-6 bg-[#E4F0E8] mt-1" />
                  )}
                </div>
                <div className="pb-2">
                  <p className="text-xs font-medium text-[#1B1F1C]">{log.status}</p>
                  <p className="text-xs text-[#9AA39C]">
                    {new Date(log.timestamp).toLocaleString("id-ID")}
                    {log.profiles ? ` · ${log.profiles.name}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recipe / Utilization Suggestion */}
      {(isGeneratingRecipe || recipeSuggestions) && (
        <div className="bg-gradient-to-br from-[#E4F0E8] to-[#FBEBD8] rounded-[14px] p-5 shadow-sm mb-5 border border-[#2F6E4F]/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles size={18} className="text-[#2F6E4F]" />
            <h2 className="text-sm font-bold text-[#1E4A35]">Ide Pemanfaatan Pangan (AI)</h2>
          </div>

          {isGeneratingRecipe ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-[#5B655D] py-4">
              <span className="w-4 h-4 border-2 border-[#2F6E4F] border-t-transparent rounded-full animate-spin shrink-0" />
              SisaPangan AI sedang menyusun rekomendasi pengolahan...
            </div>
          ) : (
            formatRecipeSuggestions(recipeSuggestions)
          )}
        </div>
      )}

      {/* QR Code Validation Card */}
      {currentBatch.qr_code && (
        <div className="bg-white rounded-[14px] p-5 shadow-sm mb-5 border border-[#E4F0E8] flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 self-start mb-1">
            <ShieldCheck size={18} className="text-[#2F6E4F]" />
            <h2 className="text-sm font-semibold text-[#1B1F1C]">QR Code Validasi</h2>
          </div>
          <p className="text-xs text-[#9AA39C] mb-4 text-left self-start">
            Gunakan QR code ini untuk ditempelkan pada wadah makanan sebagai bukti pelacakan distribusi.
          </p>
          <div className="bg-[#F4F6F3] p-3 rounded-[16px] border border-[#E4F0E8] inline-block mb-3">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR Code" className="w-36 h-36 object-contain" />
            ) : (
              <div className="w-36 h-36 flex items-center justify-center text-xs text-[#9AA39C]">Memuat QR...</div>
            )}
          </div>
          <span className="text-xs font-mono text-[#5B655D] bg-[#F4F6F3] px-3 py-1 rounded-full mb-4">
            {currentBatch.qr_code}
          </span>
          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download={`qr-sisapangan-${currentBatch.qr_code}.png`}
              className="flex items-center justify-center gap-2 w-full h-10 px-4 text-xs font-bold rounded-[10px] bg-[#2F6E4F] text-white hover:bg-[#1E4A35] transition-colors"
            >
              <Download size={14} />
              Unduh Gambar QR Code
            </a>
          )}
        </div>
      )}

      {/* Post-pickup rating prompt */}
      {showRatingPrompt && (
        <div className="bg-[#E4F0E8] rounded-[14px] p-4 mb-5">
          <p className="text-sm font-semibold text-[#1B1F1C] mb-1">
            Apakah kondisi makanan sesuai deskripsi?
          </p>
          <p className="text-xs text-[#5B655D] mb-3">
            Penilaianmu membantu menjaga kualitas platform.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => submitRating(1)}
              id="btn-rating-thumbsdown"
              className="flex-1"
            >
              <ThumbsDown size={16} /> Tidak Sesuai
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => submitRating(5)}
              id="btn-rating-thumbsup"
              className="flex-1"
            >
              <ThumbsUp size={16} /> Sesuai
            </Button>
          </div>
        </div>
      )}
      {rating !== null && currentBatch.status === "Selesai" && (
        <div className="bg-[#E8F7ED] rounded-[10px] px-4 py-2.5 text-xs text-[#2F6E4F] font-medium mb-5 flex items-center gap-1.5">
          <Check size={14} className="shrink-0" />
          <span>Penilaian tercatat — {rating >= 4 ? "Sesuai deskripsi" : "Tidak sesuai"}</span>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {canClaim && (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleClaim}
            isLoading={isUpdating}
            id="btn-claim"
          >
            Klaim Surplus Ini
          </Button>
        )}
        {canUpdateStatus && (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={advanceStatus}
            isLoading={isUpdating}
            id="btn-advance-status"
          >
            {currentBatch.status === "Diklaim"
              ? "Konfirmasi Sudah Diambil"
              : "Tandai Selesai"}
          </Button>
        )}

        {/* Navigate to location */}
        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-10 px-4 text-sm font-medium rounded-[8px] border border-[#9AA39C] text-[#5B655D] hover:bg-[#F4F6F3] transition-colors"
          id="btn-open-maps"
        >
          <MapPin size={16} />
          Buka di Google Maps
          <ExternalLink size={12} />
        </a>

        {/* QR code link */}
        {qrUrl && (
          <Link href={qrUrl} target="_blank" className="flex items-center justify-center gap-2 w-full h-10 px-4 text-sm font-medium rounded-[8px] border border-[#9AA39C] text-[#5B655D] hover:bg-[#F4F6F3] transition-colors">
            <QrCode size={16} />
            Lihat QR Traceability
          </Link>
        )}

      </div>

      <Modal
        isOpen={showConfirmClaim}
        onClose={() => setShowConfirmClaim(false)}
        title="Konfirmasi Klaim"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#5B655D]">
            Apakah Anda yakin ingin mengklaim surplus pangan ini? Anda bertanggung jawab untuk mengambil makanan ini sesuai dengan detail lokasi dan waktu yang tertera.
          </p>
          <div className="flex justify-end gap-3 font-sans">
            <Button
              variant="ghost"
              size="sm"
              className="border border-[#9AA39C] text-[#5B655D] hover:bg-[#F4F6F3]"
              onClick={() => setShowConfirmClaim(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={confirmClaim}
              isLoading={isUpdating}
            >
              Klaim
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Hapus Surplus Pangan"
        size="sm"
      >
        <div className="space-y-4 font-sans">
          <p className="text-sm text-[#5B655D]">
            Apakah Anda yakin ingin menghapus surplus pangan ini secara permanen? Penyelamatan pangan yang sudah terhapus tidak dapat dipulihkan.
          </p>
          <div className="flex justify-end gap-3">
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
              onClick={handleDeleteSurplus}
              isLoading={isUpdating}
            >
              Hapus Permanen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[#9AA39C] flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-[#9AA39C] block">{label}</span>
        <span className="text-sm text-[#1B1F1C]">{value}</span>
      </div>
    </div>
  );
}
