"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { StatusBadge, CategoryBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, Download, MapPin, Gift, Package, Map, List, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SearchAutocomplete, type SearchSuggestion } from "@/components/ui/SearchAutocomplete";

interface Batch {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
  freshness_status: "safe" | "urgent" | "non-consumption";
  created_at: string;
  estimated_expiry: string;
  location_lat?: number;
  location_lng?: number;
  location_label?: string;
  profiles?: {
    name: string;
  } | null;
}

const statusOptions = ["Semua", "Tersedia", "Diklaim", "Diambil", "Selesai"];

export function HistoryClient({ batches, role }: { batches: Batch[]; role: string }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  const [view, setView] = useState<"list" | "map">("list");

  // Map state
  const [mapInstance, setMapInstance] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Full-screen map state
  const [fullMapInstance, setFullMapInstance] = useState<any>(null);
  const mapFullRef = useRef<HTMLDivElement>(null);
  const leafletFullMapRef = useRef<any>(null);
  const fullMarkersRef = useRef<any[]>([]);

  const filtered = useMemo(() => {
    return batches.filter((b) => {
      const matchSearch =
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.category.toLowerCase().includes(search.toLowerCase()) ||
        (b.profiles?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "Semua" || b.status === filterStatus;
      const matchCategory = !filterCategory || b.category === filterCategory;
      const matchDate =
        !filterDate ||
        new Date(b.created_at).toISOString().split("T")[0] === filterDate;
      return matchSearch && matchStatus && matchCategory && matchDate;
    });
  }, [batches, search, filterStatus, filterCategory, filterDate]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterCategory, filterDate]);

  // Auto select first item in filtered list
  useEffect(() => {
    if (filtered.length > 0 && !selectedBatch) {
      setSelectedBatch(filtered[0]);
    } else if (filtered.length === 0) {
      setSelectedBatch(null);
    }
  }, [filtered, selectedBatch]);

  // Leaflet Map integration (update coordinates and marker color dynamically)
  useEffect(() => {
    if (!mapRef.current || !selectedBatch) return;

    const lat = selectedBatch.location_lat || -7.5755;
    const lng = selectedBatch.location_lng || 110.8243;
    let active = true;

    const updateOrInit = async () => {
      const L = (await import("leaflet")).default;
      if (!active) return;

      const pinColor = selectedBatch.status === "Selesai" ? "#3AA65A" : "#2F6E4F";
      const icon = L.divIcon({
        className: "custom-mini-map-marker",
        html: `<div style="width:24px;height:24px;border-radius:50%;background:${pinColor};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;"><svg width="10" height="10" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      if (leafletMapRef.current) {
        leafletMapRef.current.setView([lat, lng], 14);
        setTimeout(() => {
          if (leafletMapRef.current && active) {
            leafletMapRef.current.invalidateSize();
          }
        }, 150);
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          markerRef.current.setPopupContent(`<strong>${selectedBatch.name}</strong>`);
          markerRef.current.setIcon(icon);
        }
        return;
      }

      if (mapRef.current && mapRef.current.classList.contains("leaflet-container")) {
        console.warn("Mini map container already initialized.");
        return;
      }

      const map = L.map(mapRef.current!, {
        center: [lat, lng],
        zoom: 14,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<strong>${selectedBatch.name}</strong>`)
        .openPopup();

      leafletMapRef.current = map;
      markerRef.current = marker;
      setMapInstance(map);

      setTimeout(() => {
        if (active) {
          map.invalidateSize();
        }
      }, 150);
    };

    updateOrInit();

    return () => {
      active = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
        setMapInstance(null);
      }
    };
  }, [selectedBatch]);

  // Full-screen map init
  useEffect(() => {
    if (view !== "map" || filtered.length === 0) return;

    // Center on first item or default Solo coords
    const firstBatch = filtered[0];
    const lat = firstBatch?.location_lat || -7.5755;
    const lng = firstBatch?.location_lng || 110.8243;

    const timer = setTimeout(async () => {
      if (!mapFullRef.current || leafletFullMapRef.current) return;

      const L = (await import("leaflet")).default;
      const map = L.map(mapFullRef.current, {
        center: [lat, lng],
        zoom: 13,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      leafletFullMapRef.current = map;
      setFullMapInstance(map);
      setTimeout(() => map.invalidateSize(), 150);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (leafletFullMapRef.current) {
        leafletFullMapRef.current.remove();
        leafletFullMapRef.current = null;
        setFullMapInstance(null);
      }
    };
  }, [view]);

  // Draw markers on full-screen map
  useEffect(() => {
    if (!fullMapInstance || view !== "map") return;

    let active = true;

    const drawFullMarkers = async () => {
      const L = (await import("leaflet")).default;
      if (!active) return;

      // Clear existing markers
      fullMarkersRef.current.forEach((m) => fullMapInstance.removeLayer(m));
      fullMarkersRef.current = [];

      const newMarkers: any[] = [];

      filtered.forEach((b) => {
        const lat = b.location_lat;
        const lng = b.location_lng;
        if (!lat || !lng) return;

        const pinColor = b.status === "Selesai" ? "#3AA65A" : "#2F6E4F";
        const icon = L.divIcon({
          className: "custom-full-map-marker",
          html: `<div style="width:32px;height:32px;border-radius:50%;background:${pinColor};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
          iconSize: [32, 32], iconAnchor: [16, 16],
        });

        if (!active) return;

        const marker = L.marker([lat, lng], { icon }).addTo(fullMapInstance);
        
        const donor = b.profiles?.name || "Katering Sehat";
        const popupContent = `
          <div style="font-family: inherit; width: 200px; line-height: 1.4;">
            <h4 style="margin: 0; font-size: 12px; font-weight: 800; color: #1B1F1C;">${b.name}</h4>
            <p style="margin: 2px 0 6px 0; font-size: 10px; color: #9AA39C; font-weight: 600;">oleh ${donor}</p>
            <div style="font-size: 9px; color: #5B655D; font-weight: 700; border-top: 1px solid #F4F6F3; padding-top: 6px;">
              <span>Status: ${b.status}</span> · <span>${b.quantity} ${b.unit}</span>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent, { offset: [0, -8] });
        newMarkers.push(marker);
      });

      if (active) {
        fullMarkersRef.current = newMarkers;
        // Zoom/fit map to show all markers
        if (newMarkers.length > 0) {
          const group = L.featureGroup(newMarkers);
          fullMapInstance.fitBounds(group.getBounds().pad(0.1));
        }
      } else {
        newMarkers.forEach((m) => fullMapInstance.removeLayer(m));
      }
    };

    drawFullMarkers();

    return () => {
      active = false;
    };
  }, [filtered, fullMapInstance, view]);

  const itemsPerPage = 4;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Dynamic CSV Downloader
  const downloadCSV = () => {
    const headers = ["Nama", "Kategori", "Jumlah", "Satuan", "Status Makanan", "Status Distribusi", "Tanggal"];
    const rows = filtered.map((b) => [
      b.name,
      b.category,
      b.quantity,
      b.unit,
      b.freshness_status,
      b.status,
      new Date(b.created_at).toLocaleDateString("id-ID"),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `riwayat_distribusi_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDisplayStatus = (status: string, freshness: string) => {
    if (status === "Selesai") {
      return { label: "Selesai", bg: "bg-[#E4F0E8] text-[#2F6E4F]" };
    }
    if (status === "Diklaim" || status === "Diambil") {
      return { label: "Diproses", bg: "bg-[#FBEBD8] text-[#8A4A00]" };
    }
    if (freshness === "non-consumption") {
      return { label: "Non-konsumsi", bg: "bg-[#E4E8E6] text-[#5B655D]" };
    }
    return { label: "Tersedia", bg: "bg-[#E8F7ED] text-[#1F7A3B]" };
  };

  const formatTimeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    
    const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `Hari ini, ${timeStr}`;
    if (isYesterday) return `Kemarin, ${timeStr}`;
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) + `, ${timeStr}`;
  };

  // Autocomplete suggestions from all batches
  const historySearchSuggestions: SearchSuggestion[] = useMemo(() => {
    const seen = new Set<string>();
    const results: SearchSuggestion[] = [];
    batches.forEach((b) => {
      if (!seen.has(b.id)) {
        seen.add(b.id);
        results.push({
          id: b.id,
          label: b.name,
          sublabel: `${b.category}${b.profiles?.name ? " · " + b.profiles.name : ""}`,
          type: "food",
          icon: "food",
        });
      }
    });
    return results;
  }, [batches]);

  // Handle suggestion select → select that batch and pan map
  const handleHistorySelect = useCallback(
    (s: SearchSuggestion) => {
      const found = batches.find((b) => b.id === s.id);
      if (!found) return;
      setSelectedBatch(found);
      if (leafletMapRef.current) {
        const lat = found.location_lat || -7.5755;
        const lng = found.location_lng || 110.8243;
        leafletMapRef.current.setView([lat, lng], 15, { animate: true });
      }
    },
    [batches]
  );

  return (
    <div className="px-3 sm:px-6 py-5 max-w-7xl mx-auto space-y-6 flex flex-col min-h-screen pb-12">
      {/* Header */}
      <div className="flex flex-col justify-between items-start gap-3">
        <div>
          <h1 className="text-xl xs:text-2xl font-bold text-[#1B1F1C]">Riwayat Distribusi</h1>
          <p className="text-sm text-[#9AA39C]">
            Melihat riwayat klaim, pickup, distribusi, dan status akhir surplus pangan.
          </p>
        </div>
        <div className="flex gap-2 items-center w-full">
          {/* View Switcher: List vs Peta */}
          <div className="flex bg-[#F4F6F3] p-1 rounded-[10px] mr-1">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-2 xs:px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all ${
                view === "list"
                  ? "bg-white text-[#2F6E4F] shadow-sm"
                  : "text-[#5B655D] hover:text-[#1B1F1C]"
              }`}
            >
              <List size={13} />
              <span className="hidden xs:inline">Daftar</span>
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 px-2 xs:px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all ${
                view === "map"
                  ? "bg-white text-[#2F6E4F] shadow-sm"
                  : "text-[#5B655D] hover:text-[#1B1F1C]"
              }`}
            >
              <Map size={13} />
              <span className="hidden xs:inline">Peta</span>
            </button>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 h-10 px-3 rounded-[8px] border border-[#9AA39C] bg-white text-xs font-semibold text-[#1B1F1C] focus:outline-none cursor-pointer"
          >
            <option value="Semua">Semua Status</option>
            <option value="Tersedia">Tersedia</option>
            <option value="Diklaim">Diklaim</option>
            <option value="Diambil">Diambil</option>
            <option value="Selesai">Selesai</option>
          </select>
          <Button
            onClick={downloadCSV}
            variant="secondary"
            className="h-10 px-3 xs:px-5 rounded-[8px] border border-[#1B1F1C] bg-white hover:bg-[#F4F6F3] text-xs font-bold text-[#1B1F1C] flex-shrink-0"
            id="btn-download-history"
          >
            <span className="hidden xs:inline">Unduh </span>CSV
          </Button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        {/* Search with autocomplete */}
        <SearchAutocomplete
          value={search}
          onChange={setSearch}
          placeholder="Cari donor, penerima, atau jenis makanan"
          suggestions={historySearchSuggestions}
          onSelect={handleHistorySelect}
          className="flex-1 w-full"
        />
        
        {/* 3 Select dropdowns */}
        <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-10 px-2 rounded-[8px] border border-[#9AA39C] bg-white text-xs text-[#5B655D] focus:outline-none cursor-pointer w-full"
            placeholder="Tanggal"
          />

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-10 px-2 rounded-[8px] border border-[#9AA39C] bg-white text-xs text-[#5B655D] focus:outline-none cursor-pointer w-full"
          >
            <option value="">Kategori</option>
            {["Makanan Matang", "Roti/Bakery", "Buah Potong", "Sayuran", "Bahan Segar"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-2 rounded-[8px] border border-[#9AA39C] bg-white text-xs text-[#5B655D] focus:outline-none cursor-pointer w-full"
          >
            <option value="Semua">Status</option>
            <option value="Tersedia">Tersedia</option>
            <option value="Diklaim">Diklaim</option>
            <option value="Diambil">Diambil</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak Ada Riwayat"
          description="Transaksi yang memenuhi kriteria filter akan muncul di sini."
          variant="history"
        />
      ) : view === "list" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start flex-1">
          {/* Left Column: Transaction List (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-3">
              {paginated.map((b) => {
                const disp = getDisplayStatus(b.status, b.freshness_status);
                const donor = b.profiles?.name || "Katering Sehat";
                const recipient = "Panti Asuhan Nur";
                const volunteer = role === "volunteer" ? "Anda" : "Aditya";
                const details = `${donor} → ${recipient} · Relawan: ${volunteer} · ${b.quantity} ${b.unit}`;

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBatch(b)}
                    className={`flex items-center justify-between p-4 rounded-[16px] border transition-all cursor-pointer ${
                      selectedBatch?.id === b.id
                        ? "bg-[#E4F0E8] border-[#2F6E4F] shadow-sm"
                        : "bg-white border-[#E4F0E8] hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#F4F6F3] flex items-center justify-center text-[#5B655D] shrink-0">
                        <Package size={18} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#1B1F1C] truncate">{b.name}</h3>
                        <p className="text-xs text-[#9AA39C] mt-1 font-semibold truncate">{details}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-1 ml-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${disp.bg}`}>
                        {disp.label}
                      </span>
                      <span className="text-[10px] text-[#9AA39C] font-semibold">
                        {formatTimeAgo(b.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginator */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#E4F0E8] select-none">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-[8px] text-xs font-semibold border border-[#9AA39C] text-[#5B655D] bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F4F6F3]"
                >
                  ← Sebelum
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-[8px] text-xs font-semibold ${
                        currentPage === page
                          ? "bg-[#1B1F1C] text-white"
                          : "text-[#5B655D] hover:bg-[#F4F6F3]"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-[8px] text-xs font-semibold border border-[#9AA39C] text-[#5B655D] bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F4F6F3]"
                >
                  Sesudah →
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Statistics Summary and Map (Span 1) */}
          <div className="space-y-4">
            {/* Ringkasan Riwayat */}
            <div className="bg-white rounded-[20px] shadow-sm p-5 border border-[#E4F0E8] space-y-4">
              <h2 className="text-sm font-bold text-[#1B1F1C] border-b border-[#F4F6F3] pb-3">Ringkasan Riwayat</h2>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#9AA39C] font-semibold">Total Distribusi</span>
                  <span className="font-extrabold text-[#1B1F1C]">{batches.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#9AA39C] font-semibold">Selesai</span>
                  <span className="font-extrabold text-[#1B1F1C]">
                    {batches.filter((b) => b.status === "Selesai").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#9AA39C] font-semibold">Diproses</span>
                  <span className="font-extrabold text-[#1B1F1C]">
                    {batches.filter((b) => b.status === "Diklaim" || b.status === "Diambil").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#9AA39C] font-semibold">Dibatalkan</span>
                  <span className="font-extrabold text-[#1B1F1C]">
                    {batches.filter((b) => b.status === "Dibatalkan").length || 2}
                  </span>
                </div>
              </div>
            </div>

            {/* Peta Riwayat Pickup */}
            <div className="bg-white rounded-[20px] shadow-sm p-4 border border-[#E4F0E8] space-y-3">
              <div className="flex justify-between items-center border-b border-[#F4F6F3] pb-3">
                <h2 className="text-sm font-bold text-[#1B1F1C]">Peta Riwayat Pickup</h2>
                <button
                  onClick={() => setView("map")}
                  className="text-xs font-bold text-[#2F6E4F] hover:underline flex items-center gap-1"
                >
                  <Maximize2 size={12} />
                  Layar Penuh
                </button>
              </div>
              <div className="h-44 rounded-[14px] overflow-hidden relative border border-[#E4F0E8]">
                <div ref={mapRef} className="w-full h-full" />
                {!selectedBatch && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-[20px] backdrop-blur-[1px]">
                    <p className="text-xs text-[#9AA39C]">Memuat peta...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-[20px] overflow-hidden border border-[#E4F0E8] flex-1" style={{ minHeight: "calc(100vh - 280px)" }}>
          <div ref={mapFullRef} className="w-full h-full absolute inset-0" />
          
          {/* Count badge */}
          <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-sm rounded-[10px] px-3 py-2 shadow-md border border-[#E4F0E8] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2F6E4F] inline-block" />
            <span className="text-[11px] font-semibold text-[#1B1F1C]">{filtered.length} transaksi</span>
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-[10px] px-3 py-2 shadow-md border border-[#E4F0E8] text-[10px] font-semibold text-[#5B655D]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3AA65A] inline-block" />Selesai</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2F6E4F] inline-block" />Diproses</span>
          </div>
        </div>
      )}

      <style>{`
        .leaflet-div-icon {
          background: transparent !important;
          border: none !important;
        }
        .custom-full-map-marker {
          background: transparent !important;
          border: none !important;
          pointer-events: auto !important;
          cursor: pointer !important;
        }
        .custom-mini-map-marker {
          background: transparent !important;
          border: none !important;
          pointer-events: auto !important;
          cursor: pointer !important;
        }
      `}</style>
    </div>
  );
}
