"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera,
  MapPin,
  Clock,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import {
  calculateFreshness,
  type FoodCategory,
  type StorageCondition,
  type FreshnessStatus,
} from "@/lib/freshness-score";
import { logUserActivity } from "@/lib/activity";


const DRAFT_KEY = "sisapangan_surplus_draft";

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

const quickTimeOptions = [
  { label: "2 jam", hours: 2 },
  { label: "6 jam", hours: 6 },
  { label: "24 jam", hours: 24 },
];

interface FormState {
  name: string;
  category: string;
  quantity: string;
  unit: string;
  estimatedHours: string;
  storageCondition: string; // suhu_ruang | kulkas
  foodCondition: string; // safe | urgent | non-consumption
  notes: string;
  locationLat: string;
  locationLng: string;
  locationLabel: string;
}

const getTomorrowString = () => {
  const d = new Date();
  d.setHours(d.getHours() + 6); // default to 6 hours from now
  d.setMinutes(d.getMinutes() - (d.getMinutes() % 5));
  // format as YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const initialForm: FormState = {
  name: "",
  category: "",
  quantity: "",
  unit: "porsi",
  estimatedHours: getTomorrowString(),
  storageCondition: "suhu_ruang",
  foodCondition: "safe",
  notes: "",
  locationLat: "",
  locationLng: "",
  locationLabel: "",
};

function AddSurplusForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");

  const [form, setForm] = useState<FormState>(initialForm);

  // Load from template if query param exists
  useEffect(() => {
    if (!templateId) return;

    const loadTemplate = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("surplus_template")
        .select("*")
        .eq("id", templateId)
        .single();

      if (!error && data) {
        setForm((prev) => ({
          ...prev,
          name: data.name,
          category: data.category,
          quantity: data.quantity.toString(),
          unit: data.unit || "porsi",
          storageCondition: data.storage_condition || "",
          notes: data.notes || "",
        }));
      }
    };

    loadTemplate();
  }, [templateId]);

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [freshnessPreview, setFreshnessPreview] = useState<ReturnType<typeof calculateFreshness> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const isInitializing = useRef(false);

  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const prevPhotoCount = useRef(0);

  const fileToBase64 = (file: File): Promise<{ image: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve({ image: base64String, mimeType: file.type });
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Trigger AI freshness detection automatically in the background when photos count increases
  useEffect(() => {
    if (photos.length === 0) {
      setAiReport(null);
      setAiError(null);
      prevPhotoCount.current = 0;
      return;
    }
    if (isAnalyzingAI) return;

    if (photos.length > prevPhotoCount.current) {
      prevPhotoCount.current = photos.length;
      
      const autoAIDetect = async () => {
        setIsAnalyzingAI(true);
        try {
          const base64Images = await Promise.all(photos.map(fileToBase64));
          
          const res = await fetch("/api/ai/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              images: base64Images,
              foodName: form.name,
              category: form.category,
            }),
          });
          const data = await res.json();
          console.log("[Client Received AI Data]", data);
          if (data.success) {
            // Map AI values to exact database/form keys
            const mapCategoryValue = (cat: string): string => {
              if (!cat) return "Makanan Matang";
              const cleaned = cat.replace(/\s+/g, "").toLowerCase();
              if (cleaned.includes("matang")) return "Makanan Matang";
              if (cleaned.includes("roti") || cleaned.includes("bakery")) return "Roti/Bakery";
              if (cleaned.includes("buah")) return "Buah Potong";
              if (cleaned.includes("sayur")) return "Sayuran";
              if (cleaned.includes("segar") || cleaned.includes("bahan")) return "Bahan Segar";
              if (cleaned.includes("pakan") || cleaned.includes("kompos") || cleaned.includes("pupuk")) return "Pakan/Kompos";
              return "Lainnya";
            };

            const mapStorageValue = (cond: string): string => {
              if (!cond) return "suhu_ruang";
              const cleaned = cond.toLowerCase();
              if (cleaned.includes("kulkas") || cleaned.includes("refrigerat") || cleaned.includes("dingin")) return "kulkas";
              return "suhu_ruang";
            };

            const mapConditionValue = (cond: string): string => {
              if (!cond) return "safe";
              const cleaned = cond.toLowerCase();
              if (cleaned.includes("non") || cleaned.includes("spoil") || cleaned.includes("busuk") || cleaned.includes("kompos") || cleaned.includes("pakan")) return "non-consumption";
              if (cleaned.includes("urg") || cleaned.includes("segera") || cleaned.includes("butuh")) return "urgent";
              return "safe";
            };

            const freshness = mapConditionValue(data.freshnessStatus);
            
            // Calculate and format estimated expiry datetime
            let hoursVal = 6;
            if (data.estimatedHours !== undefined && data.estimatedHours !== null && data.estimatedHours !== "") {
              const parsedHours = parseFloat(data.estimatedHours);
              if (!isNaN(parsedHours)) {
                hoursVal = parsedHours;
              }
            }
            const finalHours = (freshness === "non-consumption" && hoursVal === 0) ? 24 : hoursVal;
            const expiryDate = new Date(Date.now() + finalHours * 60 * 60 * 1000);
            const tzoffset = expiryDate.getTimezoneOffset() * 60000;
            const localISOTime = new Date(expiryDate.getTime() - tzoffset).toISOString().slice(0, 16);

            const categoryVal = freshness === "non-consumption" ? "Pakan/Kompos" : mapCategoryValue(data.category);
            const storageVal = mapStorageValue(data.storageCondition);

            setForm((prev) => {
              const cleaned = (prev.notes || "").replace(/\[AI Analisis\][\s\S]*?(?:\n\n|\n$|$)/gi, "").trim();
              
              let fallbackName = prev.name;
              if (!fallbackName) {
                if (categoryVal === "Pakan/Kompos") {
                  fallbackName = "Pakan / Kompos Organik";
                } else if (categoryVal === "Sayuran") {
                  fallbackName = "Sayuran Basi/Layu";
                } else if (categoryVal === "Buah Potong") {
                  fallbackName = "Aneka Buah Sisa";
                } else if (categoryVal === "Roti/Bakery") {
                  fallbackName = "Sisa Roti / Bakery";
                } else if (categoryVal === "Bahan Segar") {
                  fallbackName = "Bahan Protein Sisa";
                } else {
                  fallbackName = "Makanan Sisa";
                }
              }

              return {
                ...prev,
                name: data.foodName || fallbackName,
                category: categoryVal,
                estimatedHours: localISOTime,
                storageCondition: storageVal,
                foodCondition: freshness,
                notes: cleaned ? `[AI Analisis] ${data.aiAnalysis}\n\n${cleaned}` : `[AI Analisis] ${data.aiAnalysis}`,
              };
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

      autoAIDetect();
    } else {
      prevPhotoCount.current = photos.length;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  // Load draft from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as FormState;
        setForm(parsed);
      }
    } catch {}
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (isSubmitted) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      } catch {}
    }, 800);
    return () => clearTimeout(timer);
  }, [form, isSubmitted]);

  // Recalculate freshness score whenever relevant fields change
  useEffect(() => {
    if (!form.category || !form.estimatedHours) {
      setFreshnessPreview(null);
      return;
    }
    let hours = 6;
    if (form.estimatedHours.includes("-") || form.estimatedHours.includes("T")) {
      const diffMs = new Date(form.estimatedHours).getTime() - Date.now();
      hours = Math.max(0.5, Math.round((diffMs / (3600 * 1000)) * 10) / 10);
    } else {
      hours = parseFloat(form.estimatedHours);
    }
    if (isNaN(hours) || hours <= 0) {
      setFreshnessPreview(null);
      return;
    }
    const expiry = new Date(Date.now() + hours * 60 * 60 * 1000);
    const result = calculateFreshness({
      category: form.category as FoodCategory,
      estimatedExpiryAt: expiry,
      storageCondition: (form.storageCondition as StorageCondition) || null,
      physicalCondition: form.foodCondition as FreshnessStatus,
    });
    setFreshnessPreview(result);
  }, [form.category, form.estimatedHours, form.storageCondition, form.foodCondition]);

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (photos.length + files.length > 5) {
      alert("Maksimal 5 foto.");
      return;
    }
    setPhotos((prev) => [...prev, ...files]);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPhotoPreviewUrls((prev) => [...prev, ...urls]);
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  }

  // Leaflet map initialization (on step 2)
  useEffect(() => {
    if (step !== 2) return;
    let isMounted = true;
    if (!mapRef.current || leafletMapRef.current || isInitializing.current) return;
    isInitializing.current = true;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      if (!isMounted) return;
      if (!mapRef.current || (mapRef.current as any)._leaflet_id) return;

      // Default center: Solo if empty, or existing draft coordinates
      const defaultLat = form.locationLat ? parseFloat(form.locationLat) : -7.5666;
      const defaultLng = form.locationLng ? parseFloat(form.locationLng) : 110.8166;

      const map = L.map(mapRef.current!, {
        center: [defaultLat, defaultLng],
        zoom: form.locationLat ? 16 : 13,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Custom marker pin icon matching theme
      const customPin = L.divIcon({
        className: "custom-location-select-icon",
        html: `
          <div class="location-select-pin">
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

      const marker = L.marker([defaultLat, defaultLng], {
        draggable: true,
        icon: customPin,
      }).addTo(map);

      markerRef.current = marker;
      leafletMapRef.current = map;

      // Handle marker drag
      marker.on("dragend", () => {
        const latlng = marker.getLatLng();
        update("locationLat", String(latlng.lat));
        update("locationLng", String(latlng.lng));
        update("locationLabel", "Mencari lokasi...");
        fetchAddress(latlng.lat, latlng.lng);
      });

      // Handle map clicks
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        update("locationLat", String(lat));
        update("locationLng", String(lng));
        update("locationLabel", "Mencari lokasi...");
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
  }, [step]);

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
            update("locationLabel", parts.join(", "));
            return;
          }
        }
        if (data.display_name) {
          update("locationLabel", data.display_name);
          return;
        }
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
    update("locationLabel", `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  };

  function detectLocation() {
    if (!navigator.geolocation) {
      setErrors((prev) => ({
        ...prev,
        locationLat: "Geolokasi tidak didukung browser ini.",
      }));
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        update("locationLat", String(lat));
        update("locationLng", String(lng));
        update("locationLabel", "Mencari lokasi...");
        fetchAddress(lat, lng);

        // Center map and move marker
        if (leafletMapRef.current) {
          leafletMapRef.current.setView([lat, lng], 16);
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          }
        }
        setIsLocating(false);
      },
      () => {
        setErrors((prev) => ({
          ...prev,
          locationLat: "Gagal mendeteksi lokasi. Izinkan akses lokasi.",
        }));
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  }

  function validateStep(s: number): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (s === 1) {
      if (!form.name) errs.name = "Nama makanan wajib diisi";
      if (!form.category) errs.category = "Kategori wajib dipilih";
      if (!form.quantity || isNaN(parseFloat(form.quantity)) || parseFloat(form.quantity) <= 0) {
        errs.quantity = "Jumlah wajib diisi dengan angka positif";
      }
      if (photos.length === 0) {
        errs.name = "Minimal satu foto wajib diunggah";
      }
    } else if (s === 2) {
      if (!form.estimatedHours) errs.estimatedHours = "Estimasi waktu wajib diisi";
      if (!form.locationLat) errs.locationLat = "Lokasi wajib dideteksi atau diisi di peta";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  async function handleConfirmSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setServerError("");
    setIsSubmitted(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Upload photos to Supabase Storage
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const ext = photo.name.split(".").pop();
        const path = `surplus/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("surplus-photos")
          .upload(path, photo, { contentType: photo.type });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from("surplus-photos")
            .getPublicUrl(path);
          photoUrls.push(urlData.publicUrl);
        }
      }

      const qtyVal = parseFloat(form.quantity) || 1;
      const unitVal = form.unit || "porsi";

      // Parse datetime difference in hours
      let hoursVal = 6;
      if (form.estimatedHours.includes("-") || form.estimatedHours.includes("T")) {
        const diffMs = new Date(form.estimatedHours).getTime() - Date.now();
        hoursVal = Math.max(0.5, Math.round((diffMs / (3600 * 1000)) * 10) / 10);
      } else {
        hoursVal = parseFloat(form.estimatedHours) || 6;
      }

      const expiryAt = new Date(
        Date.now() + hoursVal * 60 * 60 * 1000
      ).toISOString();

      const freshnessResult = calculateFreshness({
        category: form.category as FoodCategory,
        estimatedExpiryAt: new Date(expiryAt),
        storageCondition: (form.storageCondition as StorageCondition) || null,
        physicalCondition: form.foodCondition as FreshnessStatus,
      });

      const { data: batch, error: insertErr } = await supabase
        .from("surplus_batch")
        .insert({
          donor_id: user.id,
          name: form.name,
          category: form.category,
          quantity: qtyVal,
          unit: unitVal,
          location_lat: parseFloat(form.locationLat),
          location_lng: parseFloat(form.locationLng),
          location_label: form.locationLabel,
          storage_condition: form.storageCondition || null,
          estimated_expiry: expiryAt,
          notes: form.notes || null,
          photo_urls: photoUrls,
          status: "Tersedia",
          freshness_status: form.foodCondition,
          freshness_reason: freshnessResult.reason,
          template_id: templateId || null,
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      // Log activity
      try {
        await logUserActivity({
          userId: user.id,
          action: "Menambahkan Surplus Pangan Baru",
          resourceType: "surplus_batch",
          resourceId: batch.id,
          metadata: { name: form.name, qty: `${qtyVal} ${unitVal}`, category: form.category },
        });
      } catch (logErr) {
        console.error("Gagal mencatat log aktivitas:", logErr);
      }

      // Trigger QR code generation and WhatsApp notifications
      try {
        await fetch("/api/surplus", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ batchId: batch.id }),
        });
      } catch (notifErr) {
        console.error("Gagal mengirim notifikasi WhatsApp:", notifErr);
      }

      // Clear draft
      localStorage.removeItem(DRAFT_KEY);

      setCreatedId(batch.id);
      setStep(5);
    } catch (err) {
      console.error(err);
      setServerError("Terjadi kesalahan saat menyimpan. Coba lagi.");
      setIsSubmitted(false);
      setIsSubmitting(false);
    }
  }

  let freshnessScore = 85;
  if (freshnessPreview) {
    const { status, hoursRemaining, safeThresholdHours } = freshnessPreview;
    if (status === "safe") {
      const ratio = Math.min(1, hoursRemaining / (safeThresholdHours * 2 || 1));
      freshnessScore = Math.round(75 + ratio * 25);
    } else if (status === "urgent") {
      const ratio = hoursRemaining / (safeThresholdHours || 1);
      freshnessScore = Math.round(40 + ratio * 34);
    } else {
      // non-consumption: 0 - 39
      if (form.foodCondition === "non-consumption") {
        freshnessScore = 15; // Physically spoiled / moldy -> very low score
      } else {
        const ratio = Math.min(1, hoursRemaining / (safeThresholdHours || 1));
        freshnessScore = Math.min(39, Math.round(ratio * 39));
      }
    }
  }

  const freshnessStatus = 
    form.foodCondition === "safe" ? "Sangat Baik" : form.foodCondition === "urgent" ? "Baik" : "Cukup";
  const freshnessAdvice = freshnessPreview
    ? freshnessPreview.reason
    : "Distribusi cepat disarankan";

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B1F1C]">Tambah Surplus Pangan</h1>
        <p className="text-sm text-[#9AA39C]">Donor mengunggah informasi makanan berlebih untuk diproses dan disalurkan.</p>
      </div>

      {serverError && (
        <div role="alert" className="mb-4 bg-[#FAEAEA] border border-[#D14343]/20 rounded-[10px] px-4 py-3 text-sm text-[#A02020]">
          {serverError}
        </div>
      )}

      {/* Stepper progress bar */}
      <div className="flex items-center justify-between max-w-xl mx-auto mb-10 relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#E4F0E8] z-0" />
        {[
          { step: 1, label: "Informasi Makanan" },
          { step: 2, label: "Lokasi & Waktu" },
          { step: 3, label: "Detail Tambahan" },
          { step: 4, label: "Review" },
          { step: 5, label: "Selesai" },
        ].map((s) => (
          <div key={s.step} className="flex flex-col items-center z-10">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                s.step === step
                  ? "bg-[#2F6E4F] text-white ring-4 ring-[#2F6E4F]/20"
                  : s.step < step
                  ? "bg-[#2F6E4F]/10 text-[#2F6E4F] border border-[#2F6E4F]/30"
                  : "bg-white text-[#9AA39C] border border-[#E4F0E8]"
              }`}
            >
              {s.step}
            </div>
            <span className={`text-[10px] font-bold mt-1.5 transition-colors ${
              s.step <= step ? "text-[#2F6E4F]" : "text-[#9AA39C]"
            }`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {step === 5 ? (
        /* STEP 5: SELESAI SUCCESS SCREEN */
        <div className="max-w-md mx-auto bg-white rounded-[24px] p-8 shadow-sm border border-[#E4F0E8] text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#E8F7ED] flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} className="text-[#3AA65A]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#1B1F1C]">Surplus Berhasil Diposting!</h2>
            <p className="text-sm text-[#5B655D] leading-relaxed">
              Terima kasih! Donasi surplus pangan Anda sudah masuk ke sistem dan siap diklaim oleh relawan atau pengelola terverifikasi di Solo Raya.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            {createdId && (
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push(`/app/surplus/${createdId}`)}
                className="w-full justify-center rounded-[8px]"
              >
                Lihat Detail Surplus
              </Button>
            )}
            <Button
              variant="secondary"
              size="md"
              onClick={() => router.push("/app/dashboard")}
              className="w-full justify-center rounded-[8px] border border-[#9AA39C]"
            >
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      ) : (
        /* FORM LAYOUT FOR STEPS 1-4 */
        <form onSubmit={(e) => e.preventDefault()} noValidate className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Form Inputs (Span 2) */}
          <div className="lg:col-span-2 bg-white rounded-[20px] p-6 shadow-sm border border-[#E4F0E8] space-y-5">
            
            {step === 1 && (
              /* STEP 1: INFORMASI MAKANAN */
              <>
                <h2 className="text-sm font-bold text-[#1B1F1C] border-b border-[#F4F6F3] pb-3 mb-2">Informasi Makanan</h2>

                {/* Photos Upload Section */}
                <div>
                  <p className="text-xs font-bold text-[#1B1F1C] mb-2">Unggah Foto Makanan *</p>
                  <div className="flex gap-4 items-start">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 h-32 rounded-[12px] border-2 border-dashed border-[#9AA39C]/60 hover:border-[#2F6E4F] hover:bg-[#E4F0E8]/20 transition-all flex flex-col items-center justify-center text-center cursor-pointer p-4"
                    >
                      <Camera className="text-[#9AA39C] mb-1.5" size={24} />
                      <p className="text-[10px] font-bold text-[#1B1F1C]">Klik atau drag & drop foto makanan</p>
                      <p className="text-[9px] text-[#9AA39C] mt-0.5">Maks. 5 foto, ukuran maks. 5MB/foto</p>
                    </div>

                    {/* 2x2 Preview Slots */}
                    <div className="grid grid-cols-2 gap-2 w-32 h-32 shrink-0">
                      {[0, 1, 2, 3].map((idx) => (
                        <div
                          key={idx}
                          className="rounded-[8px] border border-[#E4F0E8] bg-[#F4F6F3] overflow-hidden relative flex items-center justify-center"
                        >
                          {photoPreviewUrls[idx] ? (
                            <>
                              <img src={photoPreviewUrls[idx]} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removePhoto(idx);
                                }}
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#D14343] flex items-center justify-center"
                              >
                                <X size={8} className="text-white" />
                              </button>
                            </>
                          ) : (
                            <svg className="w-4 h-4 text-[#9AA39C]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handlePhotoChange}
                  />
                  {errors.name && photos.length === 0 && (
                    <p className="text-xs text-[#D14343] mt-1">Minimal satu foto wajib diunggah</p>
                  )}

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
                              <p className="text-xs font-bold text-[#1E4A35] mb-0.5">Rekomendasi AI Terapan</p>
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
                  label="Nama Makanan"
                  id="surplus-name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Contoh: Nasi Box Ayam"
                  required
                  error={errors.name}
                />

                {/* Kategori */}
                <Select
                  label="Kategori"
                  id="surplus-category"
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  options={categoryOptions}
                  placeholder="Pilih kategori"
                  required
                  error={errors.category}
                />

                {/* Jumlah & Satuan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Jumlah"
                    id="surplus-quantity"
                    type="number"
                    step="any"
                    value={form.quantity}
                    onChange={(e) => update("quantity", e.target.value)}
                    placeholder="Contoh: 10"
                    required
                    error={errors.quantity}
                  />
                  <Select
                    label="Satuan"
                    id="surplus-unit"
                    value={form.unit}
                    onChange={(e) => update("unit", e.target.value)}
                    options={unitOptions}
                    required
                    error={errors.unit}
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
                          form.foodCondition === c.key
                            ? "bg-[#2F6E4F] text-white border-[#2F6E4F] opacity-100"
                            : "bg-[#F4F6F3] text-[#9AA39C] border-[#E4F0E8] opacity-60"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kondisi Penyimpanan */}
                <Select
                  label="Penyimpanan"
                  id="surplus-storage"
                  value={form.storageCondition}
                  onChange={(e) => update("storageCondition", e.target.value)}
                  options={[
                    { value: "suhu_ruang", label: "Suhu Ruang" },
                    { value: "kulkas", label: "Kulkas" },
                  ]}
                  required
                  error={errors.storageCondition}
                />

                <div className="flex justify-end pt-4 border-t border-[#F4F6F3]">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleNext}
                    disabled={isAnalyzingAI}
                    className="px-6 rounded-[8px] bg-[#1B1F1C] hover:bg-black text-white font-bold text-xs"
                  >
                    Lanjutkan
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              /* STEP 2: LOKASI & WAKTU */
              <>
                <h2 className="text-sm font-bold text-[#1B1F1C] border-b border-[#F4F6F3] pb-3 mb-2">Lokasi & Waktu</h2>

                {/* Estimasi Layak Konsumsi */}
                <Input
                  label="Estimasi Layak Konsumsi"
                  id="surplus-expiry"
                  type="datetime-local"
                  value={form.estimatedHours}
                  onChange={(e) => update("estimatedHours", e.target.value)}
                  required
                  error={errors.estimatedHours}
                />

                {/* Lokasi */}
                <div>
                  <p className="text-xs font-bold text-[#1B1F1C] mb-1.5">Lokasi *</p>
                  <div className="relative">
                    <input
                      id="surplus-location"
                      value={form.locationLabel || ""}
                      onChange={(e) => update("locationLabel", e.target.value)}
                      placeholder="Pilih lokasi atau masukkan alamat"
                      className="w-full h-10 pl-9 pr-3 rounded-[8px] text-xs text-[#1B1F1C] bg-white border border-[#9AA39C] placeholder:text-[#9AA39C] focus:outline-none focus:border-[#2F6E4F] transition-all shadow-sm"
                    />
                    <MapPin className="absolute left-3 top-3 text-[#9AA39C]" size={14} />
                  </div>

                  <div className="flex justify-end mt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={detectLocation}
                      isLoading={isLocating}
                      id="btn-detect-location"
                      className="text-xs flex items-center gap-1 border border-[#9AA39C] rounded-[6px]"
                    >
                      <MapPin size={12} />
                      {isLocating ? "Mendeteksi..." : "Deteksi GPS"}
                    </Button>
                  </div>

                  {/* Selection Map */}
                  <div ref={mapRef} className="w-full h-40 rounded-[10px] border border-[#E4F0E8] mt-3 overflow-hidden shadow-inner relative z-10" />
                  {form.locationLat && (
                    <p className="text-[9px] text-[#5B655D] mt-1.5 font-mono">
                      Koordinat Terpilih: {parseFloat(form.locationLat).toFixed(5)}, {parseFloat(form.locationLng).toFixed(5)}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#F4F6F3]">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleBack}
                    className="px-5 rounded-[8px] border border-[#9AA39C] bg-white hover:bg-[#F4F6F3] text-[#5B655D] font-bold text-xs"
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleNext}
                    className="px-6 rounded-[8px] bg-[#1B1F1C] hover:bg-black text-white font-bold text-xs"
                  >
                    Lanjutkan
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              /* STEP 3: DETAIL TAMBAHAN */
              <>
                <h2 className="text-sm font-bold text-[#1B1F1C] border-b border-[#F4F6F3] pb-3 mb-2">Detail Tambahan</h2>

                {/* Deskripsi */}
                <Textarea
                  label="Deskripsi (Opsional)"
                  id="surplus-notes"
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Tambahkan informasi lain (misal: bahan, cara penyimpanan, catatan khusus)"
                  rows={4}
                />

                <div className="flex justify-between items-center pt-4 border-t border-[#F4F6F3]">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleBack}
                    className="px-5 rounded-[8px] border border-[#9AA39C] bg-white hover:bg-[#F4F6F3] text-[#5B655D] font-bold text-xs"
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleNext}
                    className="px-6 rounded-[8px] bg-[#1B1F1C] hover:bg-black text-white font-bold text-xs"
                  >
                    Lanjutkan
                  </Button>
                </div>
              </>
            )}

            {step === 4 && (
              /* STEP 4: REVIEW */
              <>
                <h2 className="text-sm font-bold text-[#1B1F1C] border-b border-[#F4F6F3] pb-3 mb-2">Review Informasi Surplus</h2>

                <div className="space-y-4 font-sans text-xs text-[#1B1F1C]">
                  {/* Photo Thumbnails */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#9AA39C] uppercase tracking-wider block">Foto Terunggah</span>
                    <div className="flex gap-2">
                      {photoPreviewUrls.map((url, idx) => (
                        <div key={idx} className="w-16 h-16 rounded-[8px] overflow-hidden border border-[#E4F0E8]">
                          <img src={url} alt="Review" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#F4F6F3]">
                    <div>
                      <span className="text-[10px] font-bold text-[#9AA39C] uppercase tracking-wider block">Nama Surplus</span>
                      <p className="text-sm font-semibold mt-0.5">{form.name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#9AA39C] uppercase tracking-wider block">Kategori</span>
                      <p className="text-sm font-semibold mt-0.5">{form.category}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#F4F6F3]">
                    <div>
                      <span className="text-[10px] font-bold text-[#9AA39C] uppercase tracking-wider block">Jumlah</span>
                      <p className="text-sm font-semibold mt-0.5">{form.quantity} {form.unit}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#9AA39C] uppercase tracking-wider block">Kondisi & Penyimpanan</span>
                      <p className="text-sm font-semibold mt-0.5">
                        {freshnessStatus} ({form.storageCondition === "suhu_ruang" ? "Suhu Ruang" : "Kulkas"})
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#F4F6F3]">
                    <span className="text-[10px] font-bold text-[#9AA39C] uppercase tracking-wider block">Estimasi Kedaluwarsa</span>
                    <p className="text-xs font-semibold mt-0.5">
                      {new Date(form.estimatedHours).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F4F6F3]">
                    <span className="text-[10px] font-bold text-[#9AA39C] uppercase tracking-wider block">Lokasi Penjemputan</span>
                    <p className="text-xs font-medium mt-0.5">{form.locationLabel || "Koordinat terpilih"}</p>
                    <p className="text-[10px] text-[#9AA39C] font-mono mt-0.5">({form.locationLat}, {form.locationLng})</p>
                  </div>

                  {form.notes && (
                    <div className="pt-2 border-t border-[#F4F6F3]">
                      <span className="text-[10px] font-bold text-[#9AA39C] uppercase tracking-wider block">Catatan Tambahan</span>
                      <p className="text-xs text-[#5B655D] mt-0.5 leading-relaxed whitespace-pre-wrap">{form.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#F4F6F3]">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleBack}
                    className="px-5 rounded-[8px] border border-[#9AA39C] bg-white hover:bg-[#F4F6F3] text-[#5B655D] font-bold text-xs"
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleConfirmSubmit}
                    isLoading={isSubmitting}
                    className="px-6 rounded-[8px] bg-[#2F6E4F] hover:bg-[#255A3F] text-white font-bold text-xs"
                  >
                    Posting Sekarang
                  </Button>
                </div>
              </>
            )}

          </div>

        {/* Right Column: AI Insights & Impact (Span 1) */}
        <div className="space-y-6">
          {/* Prediksi Kelayakan */}
          <div className="bg-white rounded-[14px] p-5 shadow-sm border border-[#E4F0E8] flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-[#1B1F1C] self-start mb-4">Prediksi Kelayakan</p>
            <div className="relative flex flex-col items-center justify-center py-2">
              <span className="text-4xl font-extrabold text-[#1B1F1C]">{freshnessScore}</span>
              <span className="text-xs text-[#9AA39C] font-semibold mt-1">/100</span>
            </div>
            <div className="mt-4 flex flex-col items-center gap-2 w-full">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                freshnessStatus === "Sangat Baik"
                  ? "bg-[#E8F7ED] text-[#2F6E4F]"
                  : freshnessStatus === "Baik"
                  ? "bg-[#FEF6E4] text-[#F0A93B]"
                  : "bg-[#FDF2F2] text-[#E02424]"
              }`}>
                {freshnessStatus}
              </span>
              <p className="text-[10px] text-[#5B655D] font-semibold leading-relaxed mt-1">{freshnessAdvice}</p>
            </div>
          </div>

          {/* Tips Kelayakan */}
          <div className="bg-white rounded-[14px] p-5 shadow-sm border border-[#E4F0E8] space-y-3">
            <p className="text-xs font-bold text-[#1B1F1C] mb-1">Tips Kelayakan</p>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#F4F6F3] flex items-center justify-center shrink-0 text-[#2F6E4F]">
                <Sparkles size={12} />
              </div>
              <p className="text-[10px] text-[#5B655D] font-medium leading-relaxed">
                Pastikan makanan masih dalam suhu yang aman.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#F4F6F3] flex items-center justify-center shrink-0 text-[#2F6E4F]">
                <Clock size={12} />
              </div>
              <p className="text-[10px] text-[#5B655D] font-medium leading-relaxed">
                Semakin cepat dibagikan, semakin besar dampaknya.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#F4F6F3] flex items-center justify-center shrink-0 text-[#2F6E4F]">
                <Camera size={12} />
              </div>
              <p className="text-[10px] text-[#5B655D] font-medium leading-relaxed">
                Foto yang jelas membantu proses verifikasi lebih cepat.
              </p>
            </div>
          </div>

          {/* Dampak Potensial */}
          <div className="bg-white rounded-[14px] p-5 shadow-sm border border-[#E4F0E8] space-y-3">
            <p className="text-xs font-bold text-[#1B1F1C] mb-1">Dampak Potensial</p>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#F4F6F3] flex items-center justify-center text-[#5B655D] shrink-0">
                <svg className="w-4 h-4 text-[#2F6E4F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-extrabold text-[#1B1F1C]">10-15</p>
                <p className="text-[9px] text-[#9AA39C] font-semibold">Penerima Terbantu</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#F4F6F3] flex items-center justify-center text-[#5B655D] shrink-0">
                <svg className="w-4 h-4 text-[#2F6E4F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-extrabold text-[#1B1F1C]">3-5 kg</p>
                <p className="text-[9px] text-[#9AA39C] font-semibold">Sampah Makanan Dicegah</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    )}
      
      <style>{`
        .custom-location-select-icon {
          background: transparent !important;
          border: none !important;
        }
        .location-select-pin {
          transition: transform 0.15s ease;
        }
        .location-select-pin:hover {
          transform: scale(1.15);
        }
      `}</style>
    </div>
  );
}

export default function AddSurplusPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-[#9AA39C] animate-pulse">Memuat formulir...</p>
      </div>
    }>
      <AddSurplusForm />
    </Suspense>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#F4F6F3]">
      <span className="text-sm text-[#9AA39C]">{label}</span>
      <span className="text-sm font-medium text-[#1B1F1C]">{value}</span>
    </div>
  );
}
