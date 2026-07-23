"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { MapPin, Clock, ArrowRight, CheckCircle2, Phone, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { logUserActivity } from "@/lib/activity";
import { useRouter } from "next/navigation";


interface ClaimedBatch {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
  freshness_status: "safe" | "urgent" | "non-consumption";
  estimated_expiry: string;
  location_lat: number;
  location_lng: number;
  location_label: string;
  isCompleted?: boolean;
  profiles?: { name: string; contact_number?: string } | null;
  created_at?: string;
}

interface Recipient {
  name: string;
  location_label: string;
  lat: number;
  lng: number;
}

const SOLO_RECIPIENTS: Recipient[] = [
  {
    name: "Panti Asuhan PAAY Surakarta",
    location_label: "Jl. Slamet Riyadi No. 112, Kerten, Laweyan, Surakarta",
    lat: -7.5672,
    lng: 110.8120
  },
  {
    name: "Panti Asuhan Pamardi Kasih",
    location_label: "Jl. Kolonel Sutarto No. 15, Jebres, Surakarta",
    lat: -7.5580,
    lng: 110.8350
  },
  {
    name: "Yayasan Aisyiyah Surakarta",
    location_label: "Jl. KH Ahmad Dahlan No. 34, Keprabon, Surakarta",
    lat: -7.5620,
    lng: 110.8220
  },
  {
    name: "Pondok Yatim Solo Peduli",
    location_label: "Jl. Danudirja Setiabudi No. 10, Gilingan, Banjarsari, Surakarta",
    lat: -7.5510,
    lng: 110.8150
  }
];

const DPS_RECIPIENTS: Recipient[] = [
  {
    name: "Panti Asuhan Tat Twam Asi Denpasar",
    location_label: "Jl. Jaya Giri VIII No. 14, Renon, Denpasar Selatan",
    lat: -8.6732,
    lng: 115.2260
  },
  {
    name: "Panti Asuhan Asy Syifa Denpasar",
    location_label: "Jl. Cargo Indah No. 2, Denpasar Barat",
    lat: -8.6510,
    lng: 115.2010
  },
  {
    name: "Panti Asuhan Salam Bali",
    location_label: "Jl. Bypass Ngurah Rai No. 200, Sanur, Denpasar Selatan",
    lat: -8.6850,
    lng: 115.2420
  },
  {
    name: "Panti Asuhan Evangeline Booth",
    location_label: "Jl. WR Supratman No. 56, Denpasar Timur",
    lat: -8.6590,
    lng: 115.2310
  }
];

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const TOMORROW_MOCK_BATCHES: ClaimedBatch[] = [
  {
    id: "mock-besok-1",
    name: "Paket Nasi Kotak & Lauk",
    category: "Makanan Matang",
    quantity: 15,
    unit: "porsi",
    status: "Diklaim",
    freshness_status: "safe",
    estimated_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    location_lat: -7.5672,
    location_lng: 110.8120,
    location_label: "Jl. Slamet Riyadi No. 12, Solo",
    profiles: { name: "Catering Berkah" }
  },
  {
    id: "mock-besok-2",
    name: "Roti Manis & Kue Box",
    category: "Roti/Bakery",
    quantity: 25,
    unit: "box",
    status: "Diklaim",
    freshness_status: "safe",
    estimated_expiry: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString(),
    location_lat: -7.5580,
    location_lng: 110.8350,
    location_label: "Jl. Kolonel Sutarto No. 15, Jebres, Solo",
    profiles: { name: "Bakery Aroma" }
  }
];

export default function PickupRoutePage() {
  const [batches, setBatches] = useState<ClaimedBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"hari-ini" | "besok" | "riwayat">("hari-ini");
  const { showToast } = useToast();
  const router = useRouter();

  const [dbRecipients, setDbRecipients] = useState<Recipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Record<string, Recipient>>({});

  // Confirmation modal state
  type ConfirmType = "pickup" | "deliver" | "cancel";
  const [confirmAction, setConfirmAction] = useState<{ type: ConfirmType; batchId: string; name: string } | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedIssueReason, setSelectedIssueReason] = useState("");

  const activeBatches = useMemo(() => {
    return activeTab === "hari-ini"
      ? batches.filter((b) => b.status === "Diklaim" || b.status === "Diambil")
      : activeTab === "besok"
      ? TOMORROW_MOCK_BATCHES
      : batches.filter((b) => b.status === "Selesai");
  }, [batches, activeTab]);

  async function loadBeneficiaries() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("beneficiaries").select("*");
      if (error) {
        console.error("Gagal memuat beneficiaries dari DB:", error);
        return;
      }
      if (data && data.length > 0) {
        const mapped: Recipient[] = data.map((b: any) => ({
          name: b.name,
          location_label: b.location_label,
          lat: b.location_lat,
          lng: b.location_lng
        }));
        setDbRecipients(mapped);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  function getRecipientsForBatch(b: ClaimedBatch): Recipient[] {
    const list = dbRecipients.length > 0 ? dbRecipients : [...SOLO_RECIPIENTS, ...DPS_RECIPIENTS];
    const isDenpasar = Math.abs(b.location_lat - (-8.6)) < Math.abs(b.location_lat - (-7.5));
    const filtered = list.filter((r) => {
      const isRecipDenpasar = Math.abs(r.lat - (-8.6)) < Math.abs(r.lat - (-7.5));
      return isDenpasar ? isRecipDenpasar : !isRecipDenpasar;
    });
    if (filtered.length === 0) {
      return isDenpasar ? DPS_RECIPIENTS : SOLO_RECIPIENTS;
    }
    return filtered;
  }

  function getClosestRecipient(b: ClaimedBatch): Recipient {
    const options = getRecipientsForBatch(b);
    let closest = options[0];
    let minDist = 999999;
    options.forEach((r) => {
      const dist = calculateDistance(b.location_lat, b.location_lng, r.lat, r.lng);
      if (dist < minDist) {
        minDist = dist;
        closest = r;
      }
    });
    return closest;
  }

  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routeLineRef = useRef<any>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
        },
        () => {
          setUserLat(-7.5755);
          setUserLng(110.8243);
        }
      );
    } else {
      setUserLat(-7.5755);
      setUserLng(110.8243);
    }
  }, []);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch ALL distribution_log entries by this volunteer (any status)
    const { data: logs } = await supabase
      .from("distribution_log")
      .select("batch_id, status")
      .eq("volunteer_id", user.id)
      .in("status", ["Diklaim", "Diambil", "Selesai"]);

    // Keep only the most recent log per batch
    const latestByBatch: Record<string, string> = {};
    (logs ?? []).forEach((l: any) => {
      // Priority: Selesai > Diambil > Diklaim
      const priority: Record<string, number> = { Diklaim: 0, Diambil: 1, Selesai: 2 };
      const existing = latestByBatch[l.batch_id];
      if (!existing || (priority[l.status] ?? -1) > (priority[existing] ?? -1)) {
        latestByBatch[l.batch_id] = l.status;
      }
    });

    const ids = Object.keys(latestByBatch);
    if (ids.length === 0) { setBatches([]); setLoading(false); return; }

    const { data } = await supabase
      .from("surplus_batch")
      .select("*, profiles:donor_id(name, contact_number)")
      .in("id", ids)
      .in("status", ["Diklaim", "Diambil", "Selesai"])
      .order("estimated_expiry", { ascending: true });

    setBatches((data as ClaimedBatch[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Initialize default recipients for each batch based on closest distance
  useEffect(() => {
    const allAvailable = [...batches, ...TOMORROW_MOCK_BATCHES];
    if (allAvailable.length === 0) return;
    const initial = { ...selectedRecipients };
    let changed = false;
    allAvailable.forEach((b) => {
      if (!initial[b.id]) {
        initial[b.id] = getClosestRecipient(b);
        changed = true;
      }
    });
    if (changed) {
      setSelectedRecipients(initial);
    }
  }, [batches]);

  // Sort stops by distance once user location is available
  useEffect(() => {
    if (userLat === null || userLng === null || batches.length === 0) return;

    // Calculate distance helper
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371; // km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // Calculate current distances
    const calculated = batches.map(b => ({
      ...b,
      distance: calculateDistance(userLat, userLng, b.location_lat, b.location_lng)
    }));

    // If already sorted, don't trigger state update to prevent loops
    const isSorted = calculated.every((val, i, arr) => !i || arr[i - 1].distance <= val.distance);
    if (!isSorted) {
      const sortedBatches = [...calculated].sort((a, b) => a.distance - b.distance);
      // Remove temporary property
      const finalBatches = sortedBatches.map(({ distance, ...rest }) => rest);
      setBatches(finalBatches);
    }
  }, [userLat, userLng, batches.length]);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || userLat === null || leafletMapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      const map = L.map(mapRef.current!, {
        center: [userLat!, userLng!],
        zoom: 13,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      leafletMapRef.current = map;
      setMapInstance(map);

      setTimeout(() => {
        if (leafletMapRef.current === map) {
          map.invalidateSize();
        }
      }, 150);
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        setMapInstance(null);
      }
    };
  }, [userLat, loading, activeBatches.length > 0]);

  // Handle map size correction on tab switches
  useEffect(() => {
    if (mapInstance) {
      setTimeout(() => {
        mapInstance.invalidateSize();
      }, 150);
    }
  }, [mapInstance, activeTab]);

  // Draw Route and Markers (includes both Pickup and Drop-off locations dynamically)
  useEffect(() => {
    if (!mapInstance || userLat === null) return;

    if (leafletMapRef.current === mapInstance) {
      markersRef.current.forEach((m) => {
        try {
          mapInstance.removeLayer(m);
        } catch (e) {
          console.error("Error removing marker:", e);
        }
      });
    }
    markersRef.current = [];

    if (routeLineRef.current) {
      if (leafletMapRef.current === mapInstance) {
        try {
          mapInstance.removeLayer(routeLineRef.current);
        } catch (e) {
          console.error("Error removing route line:", e);
        }
      }
      routeLineRef.current = null;
    }

    if (activeBatches.length === 0) return;

    const drawRoute = async () => {
      const L = (await import("leaflet")).default;
      
      // Guard: check if map was destroyed while importing Leaflet
      if (!leafletMapRef.current || leafletMapRef.current !== mapInstance) return;

      const newMarkers: any[] = [];
      const points: [number, number][] = [[userLat!, userLng!]];

      // User location marker (pulse)
      const userIcon = L.divIcon({
        className: "user-gps-icon",
        html: `<div class="user-pulse-marker"><div class="core"></div><div class="pulse"></div></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const userMarker = L.marker([userLat!, userLng!], { icon: userIcon })
        .addTo(mapInstance)
        .bindPopup("Lokasi Saya");
      newMarkers.push(userMarker);

      // Stop markers (generate Pickup stop and Drop-off stop for each batch)
      activeBatches.forEach((b: ClaimedBatch, idx: number) => {
        const recip = selectedRecipients[b.id] || getClosestRecipient(b);
        
        // 1. Pickup stop (Donor)
        const pickupIdx = idx * 2 + 1;
        const isPickupCompleted = b.status === "Diambil" || b.status === "Selesai";
        const pickupColor = isPickupCompleted ? "#3AA65A" : "#2F6E4F";
        const pickupIcon = L.divIcon({
          className: "route-stop-icon",
          html: `<div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#FFFFFF;background:${pickupColor};border:2px solid ${pickupColor};box-shadow:0 2px 6px rgba(0,0,0,0.25);">${isPickupCompleted ? "✓" : pickupIdx}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const pickupMarker = L.marker([b.location_lat, b.location_lng], { icon: pickupIcon })
          .addTo(mapInstance)
          .bindPopup(`<strong>Stop ${pickupIdx} (Pickup): ${b.name}</strong><br/>${b.location_label}`);
        newMarkers.push(pickupMarker);
        points.push([b.location_lat, b.location_lng]);

        // 2. Drop-off stop (Recipient)
        const dropIdx = idx * 2 + 2;
        const isDropCompleted = b.status === "Selesai";
        const dropPinColor = isDropCompleted ? "#3AA65A" : "#FFFFFF";
        const dropTextColor = isDropCompleted ? "#FFFFFF" : "#2F6E4F";
        const dropBorderColor = isDropCompleted ? "#3AA65A" : "#2F6E4F";
        const dropIcon = L.divIcon({
          className: "route-stop-icon",
          html: `<div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:${dropTextColor};background:${dropPinColor};border:2px solid ${dropBorderColor};box-shadow:0 2px 6px rgba(0,0,0,0.25);">${isDropCompleted ? "✓" : dropIdx}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const dropMarker = L.marker([recip.lat, recip.lng], { icon: dropIcon })
          .addTo(mapInstance)
          .bindPopup(`<strong>Stop ${dropIdx} (Drop-off): ${recip.name}</strong><br/>${recip.location_label}`);
        newMarkers.push(dropMarker);
        points.push([recip.lat, recip.lng]);
      });

      markersRef.current = newMarkers;

      routeLineRef.current = L.polyline(points, {
        color: "#2F6E4F",
        weight: 3,
        opacity: 0.75,
        dashArray: "8, 8",
      }).addTo(mapInstance);

      mapInstance.fitBounds(points, { padding: [50, 50] });
    };

    drawRoute();
  }, [activeBatches, mapInstance, userLat, userLng, selectedRecipients]);

  async function markPickedUp(batchId: string) {
    setCompleting(batchId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCompleting(null); return; }

    const activeBatchName = batches.find((b) => b.id === batchId)?.name || "Surplus Pangan";

    // Update surplus_batch status
    const { error: batchErr } = await supabase
      .from("surplus_batch")
      .update({ status: "Diambil" })
      .eq("id", batchId);
    if (batchErr) {
      showToast("Gagal mengambil donasi: " + batchErr.message, "error");
      setCompleting(null);
      return;
    }

    // Update the existing distribution_log row (change Diklaim → Diambil)
    const { error: logErr } = await supabase
      .from("distribution_log")
      .update({ status: "Diambil", timestamp: new Date().toISOString() })
      .eq("batch_id", batchId)
      .eq("volunteer_id", user.id)
      .eq("status", "Diklaim");
    if (logErr) {
      showToast("Gagal mencatat log: " + logErr.message, "error");
      setCompleting(null);
      return;
    }

    // Log activity
    try {
      await logUserActivity({
        userId: user.id,
        action: "Mengambil Makanan (Pickup)",
        resourceType: "surplus_batch",
        resourceId: batchId,
        metadata: { name: activeBatchName, status: "Diambil" },
      });
    } catch (logErr) {
      console.error("Gagal mencatat log aktivitas:", logErr);
    }

    await load();
    setCompleting(null);
    showToast("Makanan berhasil diambil dari donor!", "success");
  }

  async function markDelivered(batchId: string) {
    setCompleting(batchId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCompleting(null); return; }

    const activeBatchName = batches.find((b) => b.id === batchId)?.name || "Surplus Pangan";

    // Update surplus_batch status
    const { error: batchErr } = await supabase
      .from("surplus_batch")
      .update({ status: "Selesai" })
      .eq("id", batchId);
    if (batchErr) {
      showToast("Gagal menyelesaikan rute: " + batchErr.message, "error");
      setCompleting(null);
      return;
    }

    // Update the existing distribution_log row (change Diambil → Selesai)
    const { error: logErr } = await supabase
      .from("distribution_log")
      .update({ status: "Selesai", timestamp: new Date().toISOString() })
      .eq("batch_id", batchId)
      .eq("volunteer_id", user.id)
      .eq("status", "Diambil");
    if (logErr) {
      showToast("Gagal mencatat log selesai: " + logErr.message, "error");
      setCompleting(null);
      return;
    }

    // Log activity
    try {
      await logUserActivity({
        userId: user.id,
        action: "Menyelesaikan Distribusi Pangan",
        resourceType: "surplus_batch",
        resourceId: batchId,
        metadata: { name: activeBatchName, status: "Selesai" },
      });
    } catch (logErr) {
      console.error("Gagal mencatat log aktivitas:", logErr);
    }

    await load();
    setCompleting(null);
    showToast("Pengantaran berhasil diselesaikan!", "success");
  }

  async function cancelClaim(batchId: string) {
    setCompleting(batchId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCompleting(null); return; }

    const activeBatchName = batches.find((b) => b.id === batchId)?.name || "Surplus Pangan";

    // Revert surplus_batch back to Tersedia
    const { error: batchErr } = await supabase
      .from("surplus_batch")
      .update({ status: "Tersedia" })
      .eq("id", batchId);
    if (batchErr) {
      showToast("Gagal membatalkan klaim: " + batchErr.message, "error");
      setCompleting(null);
      return;
    }

    // Delete the distribution_log row
    const { error: logErr } = await supabase
      .from("distribution_log")
      .delete()
      .eq("batch_id", batchId)
      .eq("volunteer_id", user.id)
      .eq("status", "Diklaim");
    if (logErr) {
      showToast("Gagal menghapus log klaim: " + logErr.message, "error");
      setCompleting(null);
      return;
    }

    // Log activity
    try {
      await logUserActivity({
        userId: user.id,
        action: "Membatalkan Penjemputan Batch",
        resourceType: "surplus_batch",
        resourceId: batchId,
        metadata: { name: activeBatchName, status: "Tersedia" },
      });
    } catch (logErr) {
      console.error("Gagal mencatat log aktivitas:", logErr);
    }

    setBatches((prev) => prev.filter((b) => b.id !== batchId));
    setCompleting(null);
    showToast("Klaim berhasil dibatalkan. Surplus kembali tersedia.", "info");
  }

  const handleReportIssue = async (reason: string) => {
    const activeBatch = activeBatches.find(b => b.status === "Diklaim" || b.status === "Diambil");
    if (!activeBatch) {
      showToast("Tidak ada donasi aktif untuk dilaporkan.", "warning");
      return;
    }

    const donorName = activeBatch?.profiles?.name || "Pendonor";
    const donorNumber = activeBatch?.profiles?.contact_number;

    if (!donorNumber) {
      showToast("Nomor kontak pendonor tidak ditemukan.", "error");
      return;
    }

    const text = `Halo ${donorName}, saya adalah Relawan SisaPangan yang bertugas menjemput surplus pangan Anda.
Saya ingin mengabarkan bahwa terdapat kendala dalam perjalanan penjemputan:
- Kendala: ${reason}
- Surplus Pangan: ${activeBatch.name}

Mohon maaf atas ketidaknyamanannya. Mohon ditunggu update selanjutnya.`;

    setShowReportModal(false);
    setSelectedIssueReason("");
    showToast("Mengirim notifikasi kendala ke pendonor...", "info");

    try {
      const res = await fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: donorNumber,
          message: text,
          batchId: activeBatch.id,
          eventType: "kendala_pickup"
        })
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast("Laporan kendala berhasil dikirim otomatis ke pendonor!", "success");
      } else {
        console.warn("Fonnte API error or token not set, falling back to manual WhatsApp redirect...");
        // Fallback: open WhatsApp link directly
        const fallbackUrl = `https://wa.me/${donorNumber.replace(/^0/, "62")}?text=${encodeURIComponent(text)}`;
        window.open(fallbackUrl, "_blank");
        showToast("Token Fonnte tidak aktif. Membuka WhatsApp untuk kirim manual...", "info");
      }
    } catch (err) {
      console.error("WhatsApp notification failed:", err);
      // Fallback: open WhatsApp link directly
      const fallbackUrl = `https://wa.me/${donorNumber.replace(/^0/, "62")}?text=${encodeURIComponent(text)}`;
      window.open(fallbackUrl, "_blank");
      showToast("Gagal mengirim otomatis. Membuka WhatsApp untuk kirim manual...", "info");
    }
  };

  const gmapsUrl = () => {
    if (activeBatches.length === 0) return "#";
    
    const routePoints: string[] = [];
    activeBatches.forEach((b: ClaimedBatch) => {
      const recip = selectedRecipients[b.id] || getClosestRecipient(b);
      routePoints.push(`${b.location_lat},${b.location_lng}`);
      routePoints.push(`${recip.lat},${recip.lng}`);
    });
    
    const dest = routePoints[routePoints.length - 1];
    const waypoints = routePoints.slice(0, -1).join("|");
    
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}&waypoints=${waypoints}`;
  };

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const totalPickup = activeBatches.length;
  const totalDrop = activeBatches.length;
  const totalStops = activeBatches.length * 2;
  const totalMakanan = activeBatches.reduce((acc: number, b: ClaimedBatch) => acc + b.quantity, 0);
  
  const completedStops = activeBatches.reduce((acc: number, b: ClaimedBatch) => {
    if (b.status === "Selesai") return acc + 2;
    if (b.status === "Diambil") return acc + 1;
    return acc;
  }, 0);
  
  const progressPercent = totalStops === 0 ? 0 : Math.round((completedStops / totalStops) * 100);

  // Estimated stop times (08:30 + 15 min per stop)
  const getStopTime = (idx: number) => {
    const base = new Date();
    base.setHours(8, 30, 0, 0);
    base.setMinutes(base.getMinutes() + idx * 15);
    return base.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const getStopDist = (lat: number, lng: number) => {
    if (userLat === null || userLng === null) return "~1.2 km";
    const dist = calculateDistance(userLat, userLng, lat, lng);
    return `~${dist.toFixed(1)} km`;
  };

  const formatStopDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-5 flex flex-col min-h-screen pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B1F1C]">Pickup Route</h1>
        <p className="text-sm text-[#9AA39C]">Relawan mengambil makanan dari donor dan mengantar ke penerima.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {[
          { id: "hari-ini", label: `Rute Hari Ini (${batches.filter((b) => b.status === "Diklaim" || b.status === "Diambil").length})` },
          { id: "besok",    label: `Rute Besok (${TOMORROW_MOCK_BATCHES.length})` },
          { id: "riwayat",  label: `Riwayat Rute (${batches.filter((b) => b.status === "Selesai").length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-2 text-xs font-bold rounded-[8px] transition-all ${
              activeTab === tab.id
                ? "bg-[#2F6E4F] text-white"
                : "bg-[#F4F6F3] text-[#5B655D] hover:bg-[#E4F0E8] hover:text-[#2F6E4F]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-[14px] animate-pulse" />
          ))}
        </div>
      ) : activeBatches.length === 0 ? (
        <EmptyState
          title={
            activeTab === "hari-ini"
              ? "Tidak Ada Pickup Aktif"
              : activeTab === "besok"
              ? "Tidak Ada Rute Terjadwal"
              : "Belum Ada Riwayat Rute"
          }
          description={
            activeTab === "hari-ini"
              ? "Klaim surplus dari peta terdekat untuk mulai pickup."
              : activeTab === "besok"
              ? "Silakan periksa kembali nanti."
              : "Selesaikan pengantaran makanan untuk merekam riwayat rute."
          }
          variant="default"
          action={
            activeTab === "hari-ini" ? (
              <button
                onClick={() => router.push("/app/surplus/nearby")}
                className="px-4 py-2 rounded-[8px] bg-[#2F6E4F] text-white text-xs font-bold hover:bg-[#1E4A35] transition-colors"
              >
                Cari Surplus Terdekat
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* KPI Metrics Strip */}
          <div className="bg-white border border-[#E4F0E8] rounded-[16px] p-4 flex flex-wrap items-center gap-6">
            <div className="flex gap-8 flex-wrap flex-1">
              <div>
                <p className="text-2xl font-bold text-[#1B1F1C]">{totalPickup}</p>
                <p className="text-[10px] text-[#9AA39C] font-semibold mt-0.5">Pickup</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1B1F1C]">{totalDrop}</p>
                <p className="text-[10px] text-[#9AA39C] font-semibold mt-0.5">Pengantaran</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1B1F1C]">{totalMakanan} kg</p>
                <p className="text-[10px] text-[#9AA39C] font-semibold mt-0.5">Total Makanan</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1B1F1C]">2 jam 45 mnt</p>
                <p className="text-[10px] text-[#9AA39C] font-semibold mt-0.5">Estimasi Waktu</p>
              </div>
            </div>

            {/* Progress Rute */}
            <div className="flex flex-col justify-center items-end shrink-0 pr-2">
              <p className="text-[10px] font-bold text-[#9AA39C] text-right">Progress Rute</p>
              <p className="text-sm font-extrabold text-[#1B1F1C] text-right mt-0.5">{completedStops} dari {totalStops} selesai</p>
            </div>   
          </div>

          {/* Main Content: Map + Stop List + Info Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start flex-1">

            {/* LEFT + CENTER: Map (2 cols) */}
            <div className="lg:col-span-2 space-y-3">
              {/* Leaflet Map */}
              <div className="bg-white rounded-[16px] border border-[#E4F0E8] overflow-hidden relative" style={{ height: "360px" }}>
                <div ref={mapRef} className="w-full h-full" />
                {userLat === null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <p className="text-sm text-[#9AA39C]">Mendeteksi lokasi...</p>
                  </div>
                )}

                {/* Map legend overlay */}
                <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-[8px] px-3 py-2 shadow-sm border border-[#E4F0E8] text-[10px] font-semibold text-[#5B655D]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#2F6E4F] inline-block" />
                    Donor Pickup
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border-2 border-[#2F6E4F] bg-white inline-block" />
                    Penerima Drop-off
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#2F6E4F] inline-block" />
                    Lokasi Saya
                  </span>
                </div>
              </div>

              {/* Daftar Stop list */}
              <div className="bg-white rounded-[16px] border border-[#E4F0E8] p-4 flex flex-col">
                <h3 className="text-xs font-bold text-[#1B1F1C] mb-3 shrink-0">
                  Daftar Stop ({totalPickup} Pickup - {totalDrop} Drop-off)
                </h3>

                <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {/* Starting point */}
                <div className="flex items-center gap-3 py-2 border-b border-[#F4F6F3]">
                  <div className="w-7 h-7 rounded-full bg-[#F4F6F3] border border-[#E4F0E8] flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#9AA39C]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#1B1F1C]">Mulai dari Lokasi Saya</p>
                    <p className="text-[10px] text-[#9AA39C] font-semibold">Estimasi {getStopTime(0)}</p>
                  </div>
                  <span className="text-[10px] font-bold text-[#2F6E4F] bg-[#E4F0E8] px-2 py-0.5 rounded-full">Mulai</span>
                </div>

                {/* Stops */}
                {activeBatches.map((b: ClaimedBatch, idx: number) => {
                  const recip = selectedRecipients[b.id] || getClosestRecipient(b);
                  
                  const pickupIdx = idx * 2 + 1;
                  const dropIdx = idx * 2 + 2;

                  const isPickupCompleted = b.status === "Diambil" || b.status === "Selesai";
                  const isDropCompleted = b.status === "Selesai";

                  const donorName = b.profiles?.name || "Warung Makan Bu Sari";
                  const donorAddr = b.location_label || "Jl. Contoh No. 1";

                  const pickupTime = getStopTime(pickupIdx);
                  const dropTime = getStopTime(dropIdx);

                  const pickupDist = getStopDist(b.location_lat, b.location_lng);
                  const dropDist = getStopDist(recip.lat, recip.lng);

                  return (
                    <div key={b.id} className="space-y-0.5">
                      {/* 1. Pickup Card */}
                      <div className="flex items-start gap-3 py-2.5 border-b border-[#F4F6F3]">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5 ${
                          isPickupCompleted
                            ? "bg-[#3AA65A] text-white"
                            : "bg-[#2F6E4F] text-white"
                        }`}>
                          {isPickupCompleted ? "✓" : pickupIdx}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-[#9AA39C] uppercase tracking-wide">
                            Pickup - Donor {b.created_at ? `• ${formatStopDate(b.created_at)}` : ""}
                          </p>
                          <p className="text-xs font-extrabold text-[#1B1F1C] truncate">{donorName}</p>
                          <p className="text-[10px] text-[#9AA39C] font-semibold truncate">{donorAddr}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-[#1B1F1C]">{pickupTime}</p>
                          <p className="text-[10px] text-[#9AA39C] font-semibold">{pickupDist}</p>
                          {!isPickupCompleted && (
                            <div className="flex flex-col items-end gap-0.5 mt-1">
                              <button
                                onClick={() => setConfirmAction({ type: "pickup", batchId: b.id, name: b.name })}
                                disabled={completing === b.id}
                                className="text-[9px] font-bold text-[#2F6E4F] hover:underline"
                              >
                                Konfirmasi Ambil
                              </button>
                              <button
                                onClick={() => setConfirmAction({ type: "cancel", batchId: b.id, name: b.name })}
                                disabled={completing === b.id}
                                className="text-[9px] font-bold text-[#D14343] hover:underline flex items-center gap-0.5"
                              >
                                <XCircle size={9} />
                                Batal Klaim
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. Drop-off Card */}
                      <div className="flex items-start gap-3 py-2.5 border-b border-[#F4F6F3] last:border-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5 ${
                          isDropCompleted
                            ? "bg-[#3AA65A] text-white"
                            : "border-2 border-[#2F6E4F] bg-white text-[#2F6E4F]"
                        }`}>
                          {isDropCompleted ? "✓" : dropIdx}
                        </div>
                         <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-[#9AA39C] uppercase tracking-wide">
                            Drop-off - Penerima {b.created_at ? `• ${formatStopDate(b.created_at)}` : ""}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <select
                              value={recip.name}
                              onChange={(e) => {
                                const opts = getRecipientsForBatch(b);
                                const selected = opts.find(o => o.name === e.target.value);
                                if (selected) {
                                  setSelectedRecipients(prev => ({
                                    ...prev,
                                    [b.id]: selected
                                  }));
                                }
                              }}
                              className="bg-transparent text-xs font-extrabold text-[#1B1F1C] border-b border-[#2F6E4F] focus:outline-none cursor-pointer pb-0.5 max-w-[180px] truncate"
                              disabled={isPickupCompleted}
                            >
                              {getRecipientsForBatch(b).map((r) => (
                                <option key={r.name} value={r.name}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                          <p className="text-[10px] text-[#9AA39C] font-semibold truncate mt-0.5">{recip.location_label}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-[#1B1F1C]">{dropTime}</p>
                          <p className="text-[10px] text-[#9AA39C] font-semibold">{dropDist}</p>
                          
                          {/* If not picked up yet */}
                          {b.status === "Diklaim" && (
                            <span className="text-[9px] text-[#9AA39C] font-semibold italic">Menunggu pickup</span>
                          )}

                          {/* If picked up but not delivered */}
                          {b.status === "Diambil" && (
                            <button
                              onClick={() => setConfirmAction({ type: "deliver", batchId: b.id, name: b.name })}
                              disabled={completing === b.id}
                              className="mt-1 text-[9px] font-bold text-[#2F6E4F] hover:underline"
                            >
                              Konfirmasi Antar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

              {/* Mulai Navigasi full-width */}
              <a
                href={gmapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-12 text-sm font-bold rounded-[12px] bg-[#2F6E4F] text-white hover:bg-[#1E4A35] transition-colors"
                id="btn-mulai-navigasi"
              >
                Mulai Navigasi
              </a>
            </div>

            {/* RIGHT: Info Panel */}
            <div className="space-y-4">
              {/* Informasi Rute */}
              <div className="bg-white rounded-[16px] border border-[#E4F0E8] p-4 space-y-3">
                <h3 className="text-sm font-bold text-[#1B1F1C]">Informasi Rute</h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#9AA39C] font-semibold">Tanggal</span>
                    <span className="font-bold text-[#1B1F1C]">{today}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9AA39C] font-semibold">Waktu Mulai</span>
                    <span className="font-bold text-[#1B1F1C]">08:30 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9AA39C] font-semibold">Total Jarak</span>
                    <span className="font-bold text-[#1B1F1C]">~7.4 km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9AA39C] font-semibold">Estimasi Durasi</span>
                    <span className="font-bold text-[#1B1F1C]">2 jam 45 mnt</span>
                  </div>
                </div>
              </div>

              {/* Catatan Penting */}
              <div className="bg-white rounded-[16px] border border-[#E4F0E8] p-4 space-y-2.5">
                <h3 className="text-sm font-bold text-[#1B1F1C]">Catatan Penting</h3>
                <ul className="space-y-1.5 text-[10px] text-[#5B655D] font-semibold list-disc list-inside leading-relaxed">
                  <li>Pastikan makanan diambil tepat waktu.</li>
                  <li>Periksa kondisi makanan sebelum membawa.</li>
                  <li>Jaga kebersihan selama pengantaran.</li>
                </ul>
              </div>

              {/* Kontak Darurat */}
              <div className="bg-white rounded-[16px] border border-[#E4F0E8] p-4 space-y-3">
                <h3 className="text-sm font-bold text-[#1B1F1C]">Kontak Darurat</h3>
                <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[#9AA39C] font-semibold">Admin SisaPangan Solo</span>
                    <a href="tel:081234567890" className="font-bold text-[#1B1F1C] hover:underline flex items-center gap-1">
                      <Phone size={10} />
                      0812-3456-7890
                    </a>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#9AA39C] font-semibold">Penerima Terakhir</span>
                    <a href="tel:081298765432" className="font-bold text-[#1B1F1C] hover:underline flex items-center gap-1">
                      <Phone size={10} />
                      0812-9876-5432
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="w-full h-9 border border-[#E4F0E8] rounded-[8px] text-xs font-bold text-[#1B1F1C] hover:bg-[#F4F6F3] transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={13} className="text-[#D14343]" />
                  Laporkan Kendala
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== Confirmation Modal ===== */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction?.type === "pickup" ? "Konfirmasi Ambil"
          : confirmAction?.type === "deliver" ? "Konfirmasi Pengantaran"
          : "Batalkan Klaim"
        }
        size="sm"
      >
        <div className="space-y-4 font-sans">
          <p className="text-sm text-[#5B655D]">
            {confirmAction?.type === "pickup" && (
              <>Konfirmasi bahwa kamu sudah mengambil <strong className="text-[#1B1F1C]">{confirmAction.name}</strong> dari donor. Tindakan ini tidak dapat dibatalkan.</>)}
            {confirmAction?.type === "deliver" && (
              <>Konfirmasi bahwa <strong className="text-[#1B1F1C]">{confirmAction.name}</strong> sudah berhasil diantar ke penerima. Status akan berubah menjadi <strong>Selesai</strong>.</>)}
            {confirmAction?.type === "cancel" && (
              <>Yakin ingin membatalkan klaim <strong className="text-[#1B1F1C]">{confirmAction.name}</strong>? Surplus ini akan kembali tersedia untuk relawan lain.</>)}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="border border-[#9AA39C] text-[#5B655D] hover:bg-[#F4F6F3]"
              onClick={() => setConfirmAction(null)}
              disabled={!!completing}
            >
              Batal
            </Button>
            <Button
              variant={confirmAction?.type === "cancel" ? "danger" : "primary"}
              size="sm"
              isLoading={!!completing}
              onClick={() => {
                if (!confirmAction) return;
                const { type, batchId } = confirmAction;
                setConfirmAction(null);
                if (type === "pickup") markPickedUp(batchId);
                else if (type === "deliver") markDelivered(batchId);
                else cancelClaim(batchId);
              }}
            >
              {confirmAction?.type === "pickup" ? "Ya, Sudah Diambil"
                : confirmAction?.type === "deliver" ? "Ya, Sudah Diantar"
                : "Ya, Batalkan Klaim"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===== Report Issue Modal ===== */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Laporkan Kendala Perjalanan"
        size="sm"
      >
        <div className="space-y-4 font-sans text-[#5B655D]">
          <p className="text-xs leading-relaxed">
            Pilih kendala yang Anda hadapi untuk membuat draf laporan darurat ke Admin SisaPangan Solo via WhatsApp:
          </p>
          <div className="space-y-2.5">
            {[
              "Ban bocor / kendaraan mogok / kecelakaan",
              "Donor tutup / tidak berada di lokasi",
              "Penerima (Panti Asuhan) tutup / menolak menerima",
              "Jumlah porsi makanan tidak sesuai deskripsi",
              "Lainnya (Tulis manual di WhatsApp)"
            ].map((reason) => (
              <label
                key={reason}
                className="flex items-start gap-2.5 p-3 rounded-[12px] border border-[#E4F0E8] hover:bg-[#F4F6F3] cursor-pointer transition-colors text-xs font-semibold text-[#1B1F1C]"
              >
                <input
                  type="radio"
                  name="issue_reason"
                  checked={selectedIssueReason === reason}
                  onChange={() => setSelectedIssueReason(reason)}
                  className="mt-0.5 accent-[#2F6E4F]"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="border border-[#9AA39C] text-[#5B655D] hover:bg-[#F4F6F3]"
              onClick={() => setShowReportModal(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-[#D14343] hover:bg-red-700 text-white border-0"
              disabled={!selectedIssueReason}
              onClick={() => {
                handleReportIssue(selectedIssueReason);
              }}
            >
              Kirim via WhatsApp
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        .leaflet-div-icon {
          background: transparent !important;
          border: none !important;
        }
        .user-pulse-marker {
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .user-pulse-marker .core {
          width: 12px;
          height: 12px;
          background-color: #2F6E4F;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          z-index: 2;
        }
        .user-pulse-marker .pulse {
          position: absolute;
          width: 24px;
          height: 24px;
          background-color: rgba(47, 110, 79, 0.4);
          border-radius: 50%;
          z-index: 1;
          animation: user-pulse-anim 1.8s infinite ease-in-out;
        }
        @keyframes user-pulse-anim {
          0%  { transform: scale(0.6); opacity: 1; }
          100%{ transform: scale(2.2); opacity: 0; }
        }

        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F4F6F3;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #C8D1CA;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9AA39C;
        }
      `}</style>
    </div>
  );
}
