"use client";
import { useEffect, useState, useRef } from "react";
import { Phone, MapPin, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { logUserActivity } from "@/lib/activity";


import type L from "leaflet";

interface UserProfile {
  name: string;
  role: string;
  type: string;
  location: string;
  contact_number: string;
  estimated_capacity?: string;
  whatsapp_opt_in: boolean;
  location_lat?: number | null;
  location_lng?: number | null;
  is_verified?: boolean;
  ktp_url?: string | null;
  verification_document_url?: string | null;
}

const donorTypeOptions = [
  { value: "UMKM", label: "UMKM Kuliner" },
  { value: "Restoran", label: "Restoran" },
  { value: "Katering", label: "Katering" },
  { value: "Pasar", label: "Pasar / Kios" },
  { value: "Hotel", label: "Hotel" },
  { value: "Individu", label: "Individu" },
  { value: "Lainnya", label: "Lainnya" },
];

const volunteerTypeOptions = [
  { value: "Relawan Individu", label: "Relawan Individu" },
  { value: "Komunitas", label: "Komunitas / Organisasi" },
  { value: "Panti", label: "Panti Asuhan / Sosial" },
  { value: "Dapur Umum", label: "Dapur Umum" },
  { value: "Posyandu", label: "Posyandu / Fasilitas Kesehatan" },
];

const nonConsumptionTypeOptions = [
  { value: "Maggot", label: "Budidaya Maggot / BSF" },
  { value: "Ternak", label: "Peternak" },
  { value: "Kompos", label: "Pengolah Kompos" },
  { value: "Bank Sampah Organik", label: "Bank Sampah Organik" },
];

function getTypeOptions(role: string) {
  if (role === "donor") return donorTypeOptions;
  if (role === "volunteer") return volunteerTypeOptions;
  if (role === "non-consumption") return nonConsumptionTypeOptions;
  return [];
}

function parseCapacity(capacityStr: string) {
  if (!capacityStr) return { amount: "", unit: "porsi" };
  const match = capacityStr.trim().match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (match) {
    const amount = match[1];
    let unit = match[2].trim().toLowerCase();
    const validUnits = ["porsi", "kg", "liter", "box", "paket"];
    if (!validUnits.includes(unit)) {
      const found = validUnits.find((u) => unit.startsWith(u));
      unit = found || "porsi";
    }
    return { amount, unit };
  }
  return { amount: "", unit: "porsi" };
}

export default function ProfilePage() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Capacity states
  const [capacityAmount, setCapacityAmount] = useState("");
  const [capacityUnit, setCapacityUnit] = useState("porsi");

  // Lat and Lng inputs
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  // Verification document previews
  const [ktpPreviewUrl, setKtpPreviewUrl] = useState("");
  const [docPreviewUrl, setDocPreviewUrl] = useState("");

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const isInitializing = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const { amount, unit } = parseCapacity(data.estimated_capacity || "");
        setCapacityAmount(amount);
        setCapacityUnit(unit);

        setLatInput(data.location_lat != null ? String(data.location_lat) : "");
        setLngInput(data.location_lng != null ? String(data.location_lng) : "");

        setProfile({
          name: data.name,
          role: data.role,
          type: data.type || "",
          location: data.location || "",
          contact_number: data.contact_number || "",
          estimated_capacity: data.estimated_capacity || "",
          whatsapp_opt_in: data.whatsapp_opt_in ?? true,
          location_lat: data.location_lat ?? null,
          location_lng: data.location_lng ?? null,
          is_verified: data.is_verified ?? false,
          ktp_url: data.ktp_url ?? null,
          verification_document_url: data.verification_document_url ?? null,
        });

        // Load signed URLs for document previews
        if (data.ktp_url) {
          supabase.storage
            .from("verification-documents")
            .createSignedUrl(data.ktp_url, 3600)
            .then(({ data: signedData }) => {
              if (signedData) setKtpPreviewUrl(signedData.signedUrl);
            });
        }
        if (data.verification_document_url) {
          supabase.storage
            .from("verification-documents")
            .createSignedUrl(data.verification_document_url, 3600)
            .then(({ data: signedData }) => {
              if (signedData) setDocPreviewUrl(signedData.signedUrl);
            });
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  // Map initialization useEffect
  useEffect(() => {
    if (loading || !profile || !["donor", "volunteer", "non-consumption"].includes(profile.role)) return;

    let isMounted = true;
    if (!mapContainerRef.current || leafletMapRef.current || isInitializing.current) return;
    isInitializing.current = true;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      if (!isMounted) return;

      const initialLat = profile.location_lat || -7.5666;
      const initialLng = profile.location_lng || 110.8166;

      const map = L.map(mapContainerRef.current!, {
        center: [initialLat, initialLng],
        zoom: profile.location_lat ? 16 : 13,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Custom marker matching brand
      const customPin = L.divIcon({
        className: "custom-profile-pin-icon",
        html: `
          <div class="profile-select-pin">
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
        const latStr = latlng.lat.toFixed(6);
        const lngStr = latlng.lng.toFixed(6);
        setLatInput(latStr);
        setLngInput(lngStr);
        setProfile((prev) =>
          prev ? { ...prev, location_lat: latlng.lat, location_lng: latlng.lng } : null
        );
      });

      // Handle map clicks
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        const latStr = lat.toFixed(6);
        const lngStr = lng.toFixed(6);
        setLatInput(latStr);
        setLngInput(lngStr);
        setProfile((prev) =>
          prev ? { ...prev, location_lat: lat, location_lng: lng } : null
        );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile?.role]);

  const handleLatChange = (val: string) => {
    setLatInput(val);
    const latNum = parseFloat(val);
    const lngNum = parseFloat(lngInput);
    if (!isNaN(latNum)) {
      setProfile((prev) => (prev ? { ...prev, location_lat: latNum } : null));
      if (markerRef.current && leafletMapRef.current) {
        const activeLng = isNaN(lngNum) ? 110.8166 : lngNum;
        markerRef.current.setLatLng([latNum, activeLng]);
        leafletMapRef.current.setView([latNum, activeLng]);
      }
    }
  };

  const handleLngChange = (val: string) => {
    setLngInput(val);
    const latNum = parseFloat(latInput);
    const lngNum = parseFloat(val);
    if (!isNaN(lngNum)) {
      setProfile((prev) => (prev ? { ...prev, location_lng: lngNum } : null));
      if (markerRef.current && leafletMapRef.current) {
        const activeLat = isNaN(latNum) ? -7.5666 : latNum;
        markerRef.current.setLatLng([activeLat, lngNum]);
        leafletMapRef.current.setView([activeLat, lngNum]);
      }
    }
  };

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
        const latStr = lat.toFixed(6);
        const lngStr = lng.toFixed(6);
        setLatInput(latStr);
        setLngInput(lngStr);
        setProfile((prev) =>
          prev ? { ...prev, location_lat: lat, location_lng: lng } : null
        );

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "ktp" | "doc") => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast("Mengunggah berkas...", "info");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Update state path
      if (type === "ktp") {
        setProfile((prev) => prev ? { ...prev, ktp_url: filePath } : null);
      } else {
        setProfile((prev) => prev ? { ...prev, verification_document_url: filePath } : null);
      }

      // Generate signed URL for preview
      const { data: signedData, error: signedError } = await supabase.storage
        .from("verification-documents")
        .createSignedUrl(filePath, 3600);

      if (signedError) throw signedError;

      if (type === "ktp") {
        setKtpPreviewUrl(signedData.signedUrl);
      } else {
        setDocPreviewUrl(signedData.signedUrl);
      }

      showToast("Berkas berhasil diunggah! Ingat untuk menyimpan perubahan profil.", "success");
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast("Gagal mengunggah berkas: " + errMsg, "error");
    }
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const finalCapacity =
      profile.role === "volunteer" && capacityAmount
        ? `${capacityAmount} ${capacityUnit}`
        : profile.role === "volunteer"
        ? ""
        : profile.estimated_capacity;

    const { error } = await supabase
      .from("profiles")
      .update({
        name: profile.name,
        type: profile.type,
        location: profile.location,
        contact_number: profile.contact_number,
        estimated_capacity: finalCapacity,
        whatsapp_opt_in: profile.whatsapp_opt_in,
        location_lat: profile.location_lat,
        location_lng: profile.location_lng,
        ktp_url: profile.ktp_url,
        verification_document_url: profile.verification_document_url,
      })
      .eq("id", user.id);

    if (error) {
      showToast("Gagal menyimpan profil: " + error.message, "error");
    } else {
      await supabase.auth.updateUser({
        data: {
          name: profile.name,
          type: profile.type,
          location: profile.location,
          contact_number: profile.contact_number,
          estimated_capacity: finalCapacity,
          whatsapp_opt_in: profile.whatsapp_opt_in,
          location_lat: profile.location_lat,
          location_lng: profile.location_lng,
          ktp_url: profile.ktp_url,
          verification_document_url: profile.verification_document_url,
        },
      });
      showToast("Profil berhasil diperbarui!", "success");
      // Log activity
      try {
        await logUserActivity({
          userId: user.id,
          action: "Memperbarui Profil Pengguna",
          resourceType: "profile",
          resourceId: user.id,
          metadata: { name: profile.name },
        });
      } catch (logErr) {
        console.error("Gagal mencatat log aktivitas:", logErr);
      }
    }
    setSaving(false);
  }


  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-sm text-[#9AA39C]">Memuat profil...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="px-3 sm:px-6 py-5 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1B1F1C]">Profil Saya</h1>
        <p className="text-sm text-[#9AA39C]">Kelola data akun dan pengaturan notifikasi</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-[20px] p-4 xs:p-6 shadow-sm space-y-4">
        <Input
          label="Nama Lengkap / Nama Usaha"
          id="profile-name"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-[#1B1F1C] block mb-1.5">Peran</label>
            <div className="h-10 px-3 rounded-[8px] bg-[#F4F6F3] border border-[#E4F0E8] flex items-center text-sm font-medium text-[#9AA39C] capitalize cursor-not-allowed">
              {profile.role}
            </div>
          </div>
          <div>
            {["donor", "volunteer", "non-consumption"].includes(profile.role) ? (
              <Select
                label="Tipe"
                id="profile-type"
                value={profile.type}
                onChange={(e) => setProfile({ ...profile, type: e.target.value })}
                options={getTypeOptions(profile.role)}
                required
              />
            ) : (
              <div>
                <label className="text-sm font-medium text-[#1B1F1C] block mb-1.5">Tipe</label>
                <div className="h-10 px-3 rounded-[8px] bg-[#F4F6F3] border border-[#E4F0E8] flex items-center text-sm font-medium text-[#9AA39C] cursor-not-allowed">
                  {profile.type || "-"}
                </div>
              </div>
            )}
          </div>
        </div>

        <Input
          label="Nomor WhatsApp"
          id="profile-phone"
          type="tel"
          value={profile.contact_number}
          onChange={(e) => setProfile({ ...profile, contact_number: e.target.value })}
          required
          leftIcon={<Phone size={16} />}
        />

        <Input
          label="Alamat Utama"
          id="profile-location"
          value={profile.location}
          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
          required
          leftIcon={<MapPin size={16} />}
        />

        {["donor", "volunteer", "non-consumption"].includes(profile.role) && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-[#1B1F1C] block">
                  {profile.role === "donor" ? "Peta Lokasi Penjemputan" : "Peta Lokasi Operasional"} <span className="text-[#D14343] ml-0.5">*</span>
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
              <p className="text-xs text-[#9AA39C]">
                {profile.role === "donor"
                  ? "Geser penanda atau klik pada peta untuk menentukan koordinat jemput surplus pangan."
                  : "Geser penanda atau klik pada peta untuk menentukan koordinat dasar operasional Anda."}
              </p>
              <div
                ref={mapContainerRef}
                className="w-full h-56 rounded-[12px] border border-[#E4F0E8] overflow-hidden z-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude"
                required
                value={latInput}
                onChange={(e) => handleLatChange(e.target.value)}
                placeholder="Contoh: -7.5666"
                className="font-mono text-xs"
              />
              <Input
                label="Longitude"
                required
                value={lngInput}
                onChange={(e) => handleLngChange(e.target.value)}
                placeholder="Contoh: 110.8166"
                className="font-mono text-xs"
              />
            </div>
          </div>
        )}

        {profile.role === "volunteer" && (
          <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
            <div className="xs:col-span-2">
              <Input
                label="Estimasi Kapasitas Penerima"
                id="profile-capacity-amount"
                type="number"
                min="0"
                step="any"
                value={capacityAmount}
                onChange={(e) => setCapacityAmount(e.target.value)}
                placeholder="Contoh: 50"
              />
            </div>
            <div>
              <Select
                label="Satuan"
                id="profile-capacity-unit"
                value={capacityUnit}
                onChange={(e) => setCapacityUnit(e.target.value)}
                options={[
                  { value: "porsi", label: "Porsi" },
                  { value: "kg", label: "Kg" },
                  { value: "liter", label: "Liter" },
                  { value: "box", label: "Box" },
                  { value: "paket", label: "Paket" },
                ]}
              />
            </div>
          </div>
        )}

        {["volunteer", "non-consumption"].includes(profile.role) && (
          <div className="border-t border-[#F4F6F3] pt-4 space-y-4">
            <h3 className="text-sm font-bold text-[#1B1F1C]">Verifikasi Dokumen Akun</h3>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5B655D] font-medium">Status Verifikasi:</span>
              {profile.is_verified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E4F0E8] text-[#2F6E4F]">
                  ✓ Akun Terverifikasi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF9E6] text-[#D4A373]">
                  ⚠ Menunggu Verifikasi Admin
                </span>
              )}
            </div>

            {!profile.is_verified && (
              <div className="p-3 bg-[#F4F6F3] rounded-[12px] border border-[#E4F0E8]">
                <p className="text-[11px] text-[#5B655D] leading-relaxed">
                  Silakan unggah dokumen persyaratan di bawah. Admin akan meninjau berkas Anda sebelum mengaktifkan akun untuk berpartisipasi penuh dalam penyelamatan pangan.
                </p>
              </div>
            )}

            {/* KTP File Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1B1F1C] block">
                Foto KTP (Kartu Tanda Penduduk) <span className="text-[#D14343]">*</span>
              </label>
              {ktpPreviewUrl && (
                <div className="w-full max-w-[200px] h-32 rounded-[12px] border border-[#E4F0E8] overflow-hidden relative bg-[#F4F6F3] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ktpPreviewUrl} alt="KTP Preview" className="w-full h-full object-cover" />
                </div>
              )}
              {!profile.is_verified ? (
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, "ktp")}
                  className="block w-full text-xs text-[#5B655D] file:mr-4 file:py-1.5 file:px-3 file:rounded-[6px] file:border-0 file:text-xs file:font-semibold file:bg-[#E4F0E8] file:text-[#2F6E4F] hover:file:bg-[#d0e5d7] cursor-pointer"
                />
              ) : (
                <p className="text-[11px] text-[#9AA39C] italic">Berkas dikunci (Akun sudah terverifikasi)</p>
              )}
            </div>

            {/* Verification Document Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1B1F1C] block">
                {profile.role === "non-consumption"
                  ? "Bukti Lahan Ternak / Maggot / Kompos"
                  : "Bukti Anggota / Keterangan Komunitas"}{" "}
                <span className="text-[#D14343]">*</span>
              </label>
              {docPreviewUrl && (
                <div className="w-full max-w-[200px] h-32 rounded-[12px] border border-[#E4F0E8] overflow-hidden relative bg-[#F4F6F3] flex items-center justify-center">
                  {docPreviewUrl.toLowerCase().includes(".pdf") || (docPreviewUrl.includes("sign/verification-documents") && !docPreviewUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)) ? (
                    <div className="text-center p-2">
                      <span className="text-[11px] text-[#2F6E4F] font-bold block">Dokumen Diunggah</span>
                      <a href={docPreviewUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline">
                        Buka File ↗
                      </a>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={docPreviewUrl} alt="Document Preview" className="w-full h-full object-cover" />
                  )}
                </div>
              )}
              {!profile.is_verified ? (
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, "doc")}
                  className="block w-full text-xs text-[#5B655D] file:mr-4 file:py-1.5 file:px-3 file:rounded-[6px] file:border-0 file:text-xs file:font-semibold file:bg-[#E4F0E8] file:text-[#2F6E4F] hover:file:bg-[#d0e5d7] cursor-pointer"
                />
              ) : (
                <p className="text-[11px] text-[#9AA39C] italic">Berkas dikunci (Akun sudah terverifikasi)</p>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-[#F4F6F3] pt-4">

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.whatsapp_opt_in}
              onChange={(e) => setProfile({ ...profile, whatsapp_opt_in: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-[#9AA39C] text-[#2F6E4F] focus:ring-[#2F6E4F] accent-[#2F6E4F]"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-[#1B1F1C] block">Notifikasi WhatsApp</span>
              <span className="text-xs text-[#9AA39C] block mt-0.5">
                Kirim informasi surplus pangan terdekat atau update status pickup ke nomor WhatsApp saya.
              </span>
            </div>
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={saving}
          id="btn-save-profile"
        >
          <Save size={16} />
          Simpan Perubahan
        </Button>
      </form>

      <style>{`
        .custom-profile-pin-icon {
          background: transparent !important;
          border: none !important;
        }
        .profile-select-pin {
          transition: transform 0.15s ease;
        }
      `}</style>
    </div>
  );
}
