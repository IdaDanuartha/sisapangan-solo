"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, MapPin, Trash2, Package, Save, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { calculateFreshness, type FoodCategory, type StorageCondition } from "@/lib/freshness-score";

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
  created_at: string;
  donor_id: string;
}

interface Props {
  batch: Batch;
  currentUserId: string;
  currentUserRole: string;
}

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

export function EditSurplusClient({ batch, currentUserId, currentUserRole }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const toDatetimeLocal = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  };

  // Form states
  const [name, setName] = useState(batch.name);
  const [category, setCategory] = useState(batch.category);
  const [quantity, setQuantity] = useState(batch.quantity.toString());
  const [unit, setUnit] = useState(batch.unit);
  const [storageCondition, setStorageCondition] = useState(batch.storage_condition || "suhu_ruang");
  const [foodCondition, setFoodCondition] = useState(batch.freshness_status || "safe");
  const [estimatedExpiry, setEstimatedExpiry] = useState(toDatetimeLocal(batch.estimated_expiry));
  const [notes, setNotes] = useState(batch.notes || "");
  const [locationLabel, setLocationLabel] = useState(batch.location_label || "");
  const [locationLat, setLocationLat] = useState(batch.location_lat.toString());
  const [locationLng, setLocationLng] = useState(batch.location_lng.toString());

  // Photos states
  const [existingPhotos, setExistingPhotos] = useState<string[]>(batch.photo_urls || []);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI states
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const triggerAIAnalysis = async (currentExisting: string[], currentNew: File[]) => {
    if (currentExisting.length === 0 && currentNew.length === 0) {
      setAiReport(null);
      setAiError(null);
      return;
    }
    setIsAnalyzingAI(true);
    try {
      const base64New = await Promise.all(
        currentNew.map((file) => {
          return new Promise<{ image: string; mimeType: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              const base64String = (reader.result as string).split(",")[1];
              resolve({ image: base64String, mimeType: file.type });
            };
            reader.onerror = (error) => reject(error);
          });
        })
      );

      const payloadImages = [...currentExisting, ...base64New];

      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: payloadImages,
          foodName: name,
          category: category,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCategory(data.category);
        setStorageCondition(data.storageCondition || "suhu_ruang");

        // Update estimatedExpiry (format as YYYY-MM-DDTHH:mm)
        const hoursVal = parseFloat(data.estimatedHours) || 6;
        const expiryAt = new Date(Date.now() + hoursVal * 60 * 60 * 1000);
        const pad = (n: number) => String(n).padStart(2, "0");
        const expStr = `${expiryAt.getFullYear()}-${pad(expiryAt.getMonth() + 1)}-${pad(expiryAt.getDate())}T${pad(expiryAt.getHours())}:${pad(expiryAt.getMinutes())}`;
        setEstimatedExpiry(expStr);

        setFoodCondition(data.freshnessStatus || "safe");

        setNotes((prev) => {
          const cleaned = (prev || "").replace(/\[AI Analisis\][\s\S]*?(?:\n\n|\n$|$)/gi, "").trim();
          return cleaned ? `[AI Analisis] ${data.aiAnalysis}\n\n${cleaned}` : `[AI Analisis] ${data.aiAnalysis}`;
        });
        const confPercent = data.confidence <= 1 ? Math.round(data.confidence * 100) : Math.round(data.confidence);
        setAiReport(
          data.realAI
            ? `SisaPangan AI berhasil menganalisis foto-foto (${confPercent}% akurasi): ${data.aiAnalysis}`
            : `[Simulasi] SisaPangan AI berhasil menganalisis foto-foto (${confPercent}% akurasi): ${data.aiAnalysis}`
        );
        if (!data.realAI && data.errorDetails) {
          setAiError(data.errorDetails);
        } else {
          setAiError(null);
        }
      }
    } catch (err) {
      console.error("Gagal mendeteksi kesegaran:", err);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const isInitializing = useRef(false);

  // Leaflet map initialization
  useEffect(() => {
    let isMounted = true;
    if (!mapContainerRef.current || leafletMapRef.current || isInitializing.current) return;
    isInitializing.current = true;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      if (!isMounted) return;

      const initialLat = parseFloat(locationLat) || -7.5666;
      const initialLng = parseFloat(locationLng) || 110.8166;

      const map = L.map(mapContainerRef.current!, {
        center: [initialLat, initialLng],
        zoom: 15,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Custom marker icon
      const customPin = L.divIcon({
        className: "custom-edit-pin-icon",
        html: `
          <div class="edit-select-pin">
            <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="16" cy="38" rx="6" ry="1.5" fill="rgba(0,0,0,0.2)" />
              <path d="M16 0C7.16344 0 0 7.16344 0 16C0 26 16 40 16 40C16 40 32 26 32 16C32 7.16344 24.8366 0 16 0Z" fill="#2F6E4F" />
              <circle cx="16" cy="16" r="5" fill="white" />
            </svg>
          </div>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 40],
      });

      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: customPin,
      }).addTo(map);

      markerRef.current = marker;
      leafletMapRef.current = map;

      // Handle marker drag
      marker.on("dragend", () => {
        const latlng = marker.getLatLng();
        setLocationLat(latlng.lat.toFixed(6));
        setLocationLng(latlng.lng.toFixed(6));
        setLocationLabel("Mencari lokasi...");
        fetchAddress(latlng.lat, latlng.lng);
      });

      // Handle map clicks
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setLocationLat(lat.toFixed(6));
        setLocationLng(lng.toFixed(6));
        setLocationLabel("Mencari lokasi...");
        fetchAddress(lat, lng);
      });
    };

    initMap();

    return () => {
      isMounted = false;
      isInitializing.current = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
        headers: {
          "Accept-Language": "id-ID,id;q=0.9,en;q=0.7",
          "User-Agent": "SisaPanganApp/1.0"
        }
      });
      if (res.ok) {
        const data = await res.json();
        const address = data.address;
        if (address) {
          const road = address.road || address.suburb || address.neighbourhood || address.pedestrian || "";
          const village = address.village || address.town || address.suburb || "";
          const city = address.city || address.regency || address.county || "";
          
          const parts = [road, village, city].filter(Boolean);
          if (parts.length > 0) {
            setLocationLabel(parts.join(", "));
            return;
          }
        }
        if (data.display_name) {
          setLocationLabel(data.display_name);
          return;
        }
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
    setLocationLabel(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  };

  // Update map marker when lat/lng are manually typed
  const handleLatChange = (val: string) => {
    setLocationLat(val);
    const latNum = parseFloat(val);
    const lngNum = parseFloat(locationLng);
    if (!isNaN(latNum) && !isNaN(lngNum) && markerRef.current && leafletMapRef.current) {
      markerRef.current.setLatLng([latNum, lngNum]);
      leafletMapRef.current.setView([latNum, lngNum]);
    }
  };

  const handleLngChange = (val: string) => {
    setLocationLng(val);
    const latNum = parseFloat(locationLat);
    const lngNum = parseFloat(val);
    if (!isNaN(latNum) && !isNaN(lngNum) && markerRef.current && leafletMapRef.current) {
      markerRef.current.setLatLng([latNum, lngNum]);
      leafletMapRef.current.setView([latNum, lngNum]);
    }
  };

  // Detect Geolocation
  const detectLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolokasi tidak didukung oleh browser Anda.", "error");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocationLat(lat.toFixed(6));
        setLocationLng(lng.toFixed(6));
        setLocationLabel("Mencari lokasi...");
        fetchAddress(lat, lng);
        if (leafletMapRef.current) {
          leafletMapRef.current.setView([lat, lng], 16);
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          }
        }
        setIsLocating(false);
      },
      () => {
        showToast("Gagal mendeteksi lokasi. Harap izinkan akses lokasi.", "error");
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  // Photo handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (existingPhotos.length + newPhotos.length + files.length > 5) {
      showToast("Maksimal 5 foto.", "error");
      return;
    }
    const updatedNew = [...newPhotos, ...files];
    setNewPhotos(updatedNew);
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewPhotoPreviews((prev) => [...prev, ...previews]);
    triggerAIAnalysis(existingPhotos, updatedNew);
  };

  const removeExistingPhoto = (idx: number) => {
    const updatedExisting = existingPhotos.filter((_, i) => i !== idx);
    setExistingPhotos(updatedExisting);
    triggerAIAnalysis(updatedExisting, newPhotos);
  };

  const removeNewPhoto = (idx: number) => {
    const updatedNew = newPhotos.filter((_, i) => i !== idx);
    setNewPhotos(updatedNew);
    setNewPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
    triggerAIAnalysis(existingPhotos, updatedNew);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !quantity || !unit || !estimatedExpiry || !locationLat || !locationLng) {
      showToast("Harap isi semua kolom wajib!", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();

      // 1. Upload new photos if any
      const uploadedUrls: string[] = [];
      for (const photo of newPhotos) {
        const ext = photo.name.split(".").pop();
        const path = `surplus/${currentUserId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("surplus-photos")
          .upload(path, photo, { contentType: photo.type });
        
        if (uploadErr) {
          console.error("Storage upload error:", uploadErr);
          throw new Error(`Gagal mengunggah foto "${photo.name}": ${uploadErr.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("surplus-photos")
          .getPublicUrl(path);
        
        if (urlData?.publicUrl) {
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      const finalPhotos = [...existingPhotos, ...uploadedUrls];

      // 2. Recalculate freshness details for reason
      const expiryDate = new Date(estimatedExpiry);
      const freshness = calculateFreshness({
        category: category as FoodCategory,
        estimatedExpiryAt: expiryDate,
        storageCondition: storageCondition as StorageCondition || null,
        physicalCondition: foodCondition,
      });

      const latVal = parseFloat(locationLat);
      const lngVal = parseFloat(locationLng);

      // 3. Update in Supabase
      const { error } = await supabase
        .from("surplus_batch")
        .update({
          name,
          category,
          quantity: parseFloat(quantity),
          unit,
          storage_condition: storageCondition || null,
          estimated_expiry: expiryDate.toISOString(),
          notes: notes || null,
          location_label: locationLabel || null,
          location_lat: latVal,
          location_lng: lngVal,
          photo_urls: finalPhotos,
          freshness_status: foodCondition,
          freshness_reason: freshness.reason,
        })
        .eq("id", batch.id);

      if (error) throw error;

      showToast("Surplus berhasil diperbarui!", "success");
      router.refresh();
      router.push(`/app/surplus/${batch.id}`);
    } catch (err: any) {
      console.error(err);
      showToast("Gagal memperbarui: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-3 sm:px-6 py-5 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full text-[#2F6E4F] hover:bg-[#E4F0E8] transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#1B1F1C]">Edit Surplus Pangan</h1>
          <p className="text-xs text-[#9AA39C]">Perbarui detail informasi surplus makanan Anda.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-[20px] p-4 xs:p-6 shadow-sm border border-[#E4F0E8]">
        {/* Foto Makanan / Thumbnail Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#1B1F1C] block">
            Foto Makanan <span className="text-xs text-[#9AA39C] font-normal">(Maksimal 5 foto)</span>
          </label>
          
          {/* Photos list (existing & new) */}
          <div className="flex flex-wrap gap-2.5">
            {/* Existing photos */}
            {existingPhotos.map((url, i) => (
              <div key={`exist-${i}`} className="relative w-24 h-24 rounded-[12px] overflow-hidden border border-[#E4F0E8] group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingPhoto(i)}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 rounded-full text-white transition-colors"
                  title="Hapus foto"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {/* New upload previews */}
            {newPhotoPreviews.map((url, i) => (
              <div key={`new-${i}`} className="relative w-24 h-24 rounded-[12px] overflow-hidden border border-dashed border-[#2F6E4F]/40 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewPhoto(i)}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 rounded-full text-white transition-colors"
                  title="Hapus foto"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {/* Upload Button */}
            {existingPhotos.length + newPhotos.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-[12px] border border-dashed border-[#9AA39C] hover:border-[#2F6E4F] flex flex-col items-center justify-center text-[#9AA39C] hover:text-[#2F6E4F] hover:bg-[#F4F6F3] transition-all"
              >
                <Camera size={20} className="mb-1" />
                <span className="text-[10px] font-bold">Unggah Foto</span>
              </button>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
          />

          {(isAnalyzingAI || aiReport) && (
            <div className="mt-3 flex flex-col gap-3">
              {isAnalyzingAI && (
                <div className="flex items-center gap-2 text-xs font-bold text-[#2F6E4F] bg-[#E4F0E8] border border-[#2F6E4F]/20 px-4 py-2.5 rounded-[10px] self-start animate-pulse">
                  <span className="w-4 h-4 border-2 border-[#2F6E4F] border-t-transparent rounded-full animate-spin shrink-0" />
                  AI sedang menganalisis foto makanan...
                </div>
              )}
              {aiReport && (
                <div className="bg-gradient-to-r from-[#E4F0E8] to-[#FBEBD8] border border-[#2F6E4F]/20 rounded-[12px] p-4 shadow-sm relative overflow-hidden z-10 animate-fade-in">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-start gap-2.5">
                    <Sparkles size={18} className="text-[#2F6E4F] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-[#1E4A35] mb-0.5">Rekomendasi AI Terapan (Waktu Edit)</p>
                      <p className="text-xs text-[#5B655D] leading-relaxed font-medium whitespace-pre-line">{aiReport}</p>
                      {aiError && (
                        <p className="text-[10px] text-[#C1502E] font-medium mt-1.5 pt-1.5 border-t border-[#C1502E]/10">
                          ℹ️ Diagnosis: {aiError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Nama Makanan */}
        <Input
          label="Nama Surplus Pangan"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Nasi Goreng Spesial"
        />

        {/* Kategori, Jumlah, Satuan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Kategori Pangan"
            required
            options={categoryOptions}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Jumlah"
              type="number"
              step="any"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Jumlah"
            />
            <Select
              label="Satuan"
              required
              options={unitOptions}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
        </div>

        {/* Kondisi Simpan & Kedaluwarsa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Kondisi Penyimpanan"
            required
            options={storageOptions}
            value={storageCondition}
            onChange={(e) => setStorageCondition(e.target.value)}
          />
          <Input
            label="Estimasi Kedaluwarsa"
            type="datetime-local"
            required
            value={estimatedExpiry}
            onChange={(e) => setEstimatedExpiry(e.target.value)}
          />
        </div>

        {/* Kondisi Makanan */}
        <div>
          <p className="text-xs font-bold text-[#1B1F1C] mb-2">Kondisi Makanan *</p>
          <div className="flex gap-2">
            {[
              { key: "safe", label: "Sangat Baik" },
              { key: "urgent", label: "Baik" },
              { key: "non-consumption", label: "Cukup" },
            ].map((c) => (
              <button
                key={c.key}
                type="button"
                disabled
                className={`flex-1 py-2 rounded-[8px] text-xs font-semibold border transition-all cursor-default ${
                  foodCondition === c.key
                    ? "bg-[#2F6E4F] text-white border-[#2F6E4F] opacity-100"
                    : "bg-[#F4F6F3] text-[#9AA39C] border-[#E4F0E8] opacity-60"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Catatan Tambahan */}
        <Textarea
          label="Catatan Tambahan / Detail Porsi"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Contoh: Dikemas dalam kotak kertas, lauk dipisah..."
          rows={3}
        />

        {/* Alamat Lengkap */}
        <Input
          label="Alamat Lengkap Lokasi Penjemputan"
          required
          value={locationLabel}
          onChange={(e) => setLocationLabel(e.target.value)}
          placeholder="Jl. Slamet Riyadi No. 12, Solo"
        />

        {/* Map Picker */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-[#1B1F1C] block">
              Peta Lokasi Penjemputan (Geser penanda jika perlu)
            </label>
            <button
              type="button"
              onClick={detectLocation}
              disabled={isLocating}
              className="flex items-center gap-1 text-xs text-[#2F6E4F] font-bold hover:underline"
            >
              <MapPin size={12} />
              {isLocating ? "Mencari lokasi..." : "Gunakan Lokasi Saat Ini"}
            </button>
          </div>
          <div
            ref={mapContainerRef}
            className="w-full h-52 rounded-[12px] border border-[#E4F0E8] overflow-hidden z-10"
          />
        </div>

        {/* Coordinates Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Latitude"
            required
            value={locationLat}
            onChange={(e) => handleLatChange(e.target.value)}
            className="font-mono text-xs"
          />
          <Input
            label="Longitude"
            required
            value={locationLng}
            onChange={(e) => handleLngChange(e.target.value)}
            className="font-mono text-xs"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3 border-t border-[#F4F6F3]">
          <Button
            type="button"
            variant="ghost"
            className="flex-1 border border-[#9AA39C] text-[#5B655D] hover:bg-[#F4F6F3]"
            onClick={() => router.back()}
            disabled={isAnalyzingAI}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1 flex items-center justify-center gap-1.5"
            isLoading={isSubmitting}
            disabled={isAnalyzingAI}
          >
            <Save size={16} />
            Simpan Perubahan
          </Button>
        </div>
      </form>

      <style>{`
        .custom-edit-pin-icon {
          background: transparent !important;
          border: none !important;
        }
        .edit-select-pin {
          transition: transform 0.15s ease;
        }
      `}</style>
    </div>
  );
}
