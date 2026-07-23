"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Map, Trash2, Pencil, Phone, MapPin, X, Building, Navigation, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

interface Beneficiary {
  id: string;
  name: string;
  location_label: string;
  location_lat: number;
  location_lng: number;
  contact_number: string;
  created_at: string;
}

export function DropOffManagementClient() {
  const { showToast } = useToast();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(true);
  const [submittingBeneficiary, setSubmittingBeneficiary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Edit mode tracking
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newBeneficiary, setNewBeneficiary] = useState({
    name: "",
    location_label: "",
    location_lat: "-7.567200",
    location_lng: "110.812000",
    contact_number: "",
  });

  // Map Refs
  const selectMapRef = useRef<HTMLDivElement>(null);
  const selectLeafletMapRef = useRef<any>(null);
  const selectMarkerRef = useRef<any>(null);
  const [selectMapInstance, setSelectMapInstance] = useState<any>(null);

  // Delete modal state
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [beneficiaryToDelete, setBeneficiaryToDelete] = useState<string | null>(null);

  const loadBeneficiaries = async () => {
    setLoadingBeneficiaries(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("beneficiaries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setBeneficiaries((data as Beneficiary[]) || []);
    } catch (err: any) {
      console.error("Gagal memuat penerima:", err);
      showToast("Gagal memuat data drop-off: " + err.message, "error");
    } finally {
      setLoadingBeneficiaries(false);
    }
  };

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  // Initialize Selection Map
  useEffect(() => {
    if (!selectMapRef.current || selectLeafletMapRef.current) return;

    let active = true;

    const initSelectMap = async () => {
      const L = (await import("leaflet")).default;
      if (!active) return;

      if (selectMapRef.current && selectMapRef.current.classList.contains("leaflet-container")) {
        console.warn("Select map container already initialized.");
        return;
      }
      
      const defaultLat = -7.5672;
      const defaultLng = 110.8120;
      
      const initialLat = parseFloat(newBeneficiary.location_lat) || defaultLat;
      const initialLng = parseFloat(newBeneficiary.location_lng) || defaultLng;

      const map = L.map(selectMapRef.current!, {
        center: [initialLat, initialLng],
        zoom: 13,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: "picker-pin-icon",
        html: `<div style="width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#C1502E;border:2px solid #FFFFFF;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><div style="width:8px;height:8px;border-radius:50%;background:#FFFFFF;"></div></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([initialLat, initialLng], { icon: pinIcon, draggable: true }).addTo(map);
      selectMarkerRef.current = marker;

      // Handle marker drag
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setNewBeneficiary(prev => ({
          ...prev,
          location_lat: pos.lat.toFixed(6),
          location_lng: pos.lng.toFixed(6),
        }));
      });

      // Handle map click
      map.on("click", (e: any) => {
        const pos = e.latlng;
        marker.setLatLng(pos);
        setNewBeneficiary(prev => ({
          ...prev,
          location_lat: pos.lat.toFixed(6),
          location_lng: pos.lng.toFixed(6),
        }));
      });

      selectLeafletMapRef.current = map;
      setSelectMapInstance(map);
    };

    initSelectMap();

    return () => {
      active = false;
      if (selectLeafletMapRef.current) {
        selectLeafletMapRef.current.remove();
        selectLeafletMapRef.current = null;
        selectMarkerRef.current = null;
        setSelectMapInstance(null);
      }
    };
  }, []);

  // Sync manual inputs to marker position
  const handleLatChange = (val: string) => {
    setNewBeneficiary(prev => ({ ...prev, location_lat: val }));
    const latNum = parseFloat(val);
    const lngNum = parseFloat(newBeneficiary.location_lng);
    if (!isNaN(latNum) && !isNaN(lngNum) && selectMarkerRef.current && selectLeafletMapRef.current) {
      selectMarkerRef.current.setLatLng([latNum, lngNum]);
      selectLeafletMapRef.current.panTo([latNum, lngNum]);
    }
  };

  const handleLngChange = (val: string) => {
    setNewBeneficiary(prev => ({ ...prev, location_lng: val }));
    const latNum = parseFloat(newBeneficiary.location_lat);
    const lngNum = parseFloat(val);
    if (!isNaN(latNum) && !isNaN(lngNum) && selectMarkerRef.current && selectLeafletMapRef.current) {
      selectMarkerRef.current.setLatLng([latNum, lngNum]);
      selectLeafletMapRef.current.panTo([latNum, lngNum]);
    }
  };

  const handleSaveBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBeneficiary.name || !newBeneficiary.location_label || !newBeneficiary.location_lat || !newBeneficiary.location_lng) {
      showToast("Harap isi semua kolom wajib!", "error");
      return;
    }

    setSubmittingBeneficiary(true);
    try {
      const supabase = createClient();
      
      const latVal = parseFloat(newBeneficiary.location_lat);
      const lngVal = parseFloat(newBeneficiary.location_lng);
      
      if (editingId) {
        // Edit mode
        const { error } = await supabase
          .from("beneficiaries")
          .update({
            name: newBeneficiary.name,
            location_label: newBeneficiary.location_label,
            location_lat: latVal,
            location_lng: lngVal,
            contact_number: newBeneficiary.contact_number,
          })
          .eq("id", editingId);

        if (error) throw error;
        showToast("Lokasi drop-off berhasil diperbarui!", "success");
      } else {
        // Add mode
        const { error } = await supabase
          .from("beneficiaries")
          .insert({
            name: newBeneficiary.name,
            location_label: newBeneficiary.location_label,
            location_lat: latVal,
            location_lng: lngVal,
            contact_number: newBeneficiary.contact_number,
          });

        if (error) throw error;
        showToast("Lokasi drop-off baru berhasil ditambahkan!", "success");
      }

      handleCancelEdit();
      await loadBeneficiaries();
    } catch (err: any) {
      console.error(err);
      showToast("Gagal menyimpan lokasi: " + err.message, "error");
    } finally {
      setSubmittingBeneficiary(false);
    }
  };

  const handleEditBeneficiary = (b: Beneficiary) => {
    setEditingId(b.id);
    setNewBeneficiary({
      name: b.name,
      location_label: b.location_label,
      location_lat: b.location_lat.toString(),
      location_lng: b.location_lng.toString(),
      contact_number: b.contact_number || "",
    });

    if (selectMarkerRef.current && selectLeafletMapRef.current) {
      selectMarkerRef.current.setLatLng([b.location_lat, b.location_lng]);
      selectLeafletMapRef.current.setView([b.location_lat, b.location_lng], 14);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewBeneficiary({
      name: "",
      location_label: "",
      location_lat: "-7.567200",
      location_lng: "110.812000",
      contact_number: "",
    });

    if (selectMarkerRef.current && selectLeafletMapRef.current) {
      selectMarkerRef.current.setLatLng([-7.5672, 110.8120]);
      selectLeafletMapRef.current.setView([-7.5672, 110.8120], 13);
    }
  };

  const handleDeleteBeneficiary = (id: string) => {
    setBeneficiaryToDelete(id);
    setShowConfirmDelete(true);
  };

  const confirmDeleteBeneficiary = async () => {
    if (!beneficiaryToDelete) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("beneficiaries")
        .delete()
        .eq("id", beneficiaryToDelete);
      if (error) throw error;
      showToast("Lokasi drop-off berhasil dihapus!", "success");
      
      if (editingId === beneficiaryToDelete) {
        handleCancelEdit();
      }
      
      await loadBeneficiaries();
    } catch (err: any) {
      console.error(err);
      showToast("Gagal menghapus lokasi: " + err.message, "error");
    } finally {
      setBeneficiaryToDelete(null);
      setShowConfirmDelete(false);
    }
  };

  const filteredBeneficiaries = beneficiaries.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.location_label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-3 sm:px-6 py-5 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1B1F1C]">Manajemen Drop-off</h1>
          <p className="text-sm text-[#9AA39C]">
            Kelola daftar yayasan sosial, panti asuhan, dan mitra penyaluran pangan penerima bantuan.
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Beneficiaries (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-[20px] p-5 shadow-sm space-y-4 border border-[#E4F0E8]/40">
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[#1B1F1C]">Daftar Lokasi Drop-off</h2>
            <div className="relative w-full xs:w-56">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9AA39C]" />
              <input
                type="search"
                placeholder="Cari lokasi drop-off..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-2 rounded-[6px] text-xs border border-[#9AA39C] focus:outline-none focus:ring-1 focus:ring-[#2F6E4F]"
              />
            </div>
          </div>

          {loadingBeneficiaries ? (
            <div className="space-y-2 py-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-[#F4F6F3] rounded-[10px] animate-pulse" />
              ))}
            </div>
          ) : filteredBeneficiaries.length === 0 ? (
            <p className="text-xs text-[#9AA39C] text-center py-12">Belum ada lokasi drop-off terdaftar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-[#E4F0E8] text-[10px] font-bold text-[#5B655D] uppercase tracking-wider">
                    <th className="py-3 px-2">Nama Instansi</th>
                    <th className="py-3 px-2">Alamat Lengkap</th>
                    <th className="py-3 px-2">Koordinat (Lat, Lng)</th>
                    <th className="py-3 px-2">Kontak</th>
                    <th className="py-3 px-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4F0E8]/60 text-xs text-[#1B1F1C]">
                  {filteredBeneficiaries.map((b) => (
                    <tr 
                      key={b.id} 
                      className={`hover:bg-[#F4F6F3]/50 transition-colors ${
                        editingId === b.id ? "bg-[#E4F0E8]/35 font-medium" : ""
                      }`}
                    >
                      <td className="py-3 px-2 font-semibold min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <Building size={14} className="text-[#2F6E4F]" />
                          <span>{b.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 max-w-[200px] truncate" title={b.location_label}>
                        {b.location_label}
                      </td>
                      <td className="py-3 px-2 font-mono text-[10px] text-[#5B655D] select-all">
                        {b.location_lat.toFixed(5)}, {b.location_lng.toFixed(5)}
                      </td>
                      <td className="py-3 px-2 text-[#5B655D] font-mono">{b.contact_number || "—"}</td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditBeneficiary(b)}
                            className={`p-1.5 rounded-[6px] transition-colors inline-flex cursor-pointer ${
                              editingId === b.id 
                                ? "bg-[#2F6E4F] text-white" 
                                : "text-[#2F6E4F] hover:bg-[#2F6E4F]/10"
                            }`}
                            title="Edit Lokasi"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBeneficiary(b.id)}
                            className="p-1.5 rounded-[6px] text-[#C1502E] hover:bg-[#C1502E]/10 transition-colors inline-flex cursor-pointer"
                            title="Hapus Lokasi"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Add/Edit Beneficiary Form (1 col) */}
        <div className="bg-white rounded-[20px] p-5 shadow-sm space-y-4 border border-[#E4F0E8]/50 flex flex-col">
          <div>
            <h2 className="text-base font-semibold text-[#1B1F1C]">
              {editingId ? "Edit Lokasi Drop-off" : "Tambah Lokasi Drop-off"}
            </h2>
            <p className="text-xs text-[#9AA39C]">
              {editingId ? "Perbarui informasi dan koordinat instansi penerima bantuan." : "Daftarkan penerima bantuan baru beserta koordinat peta."}
            </p>
          </div>

          <form onSubmit={handleSaveBeneficiary} className="space-y-4 pt-2">
            <div>
              <label className="text-[10px] font-bold text-[#5B655D] block mb-1">Nama Instansi / Yayasan <span className="text-[#C1502E]">*</span></label>
              <input
                type="text"
                placeholder="Contoh: Panti Asuhan Kasih Ibu"
                required
                value={newBeneficiary.name}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, name: e.target.value }))}
                className="w-full h-9 px-3 rounded-[8px] text-xs border border-[#9AA39C] focus:outline-none focus:ring-1 focus:ring-[#2F6E4F]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#5B655D] block mb-1">Alamat Lengkap <span className="text-[#C1502E]">*</span></label>
              <textarea
                placeholder="Jl. Slamet Riyadi No. 45, Laweyan, Surakarta"
                required
                value={newBeneficiary.location_label}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, location_label: e.target.value }))}
                className="w-full min-h-[60px] p-2.5 rounded-[8px] text-xs border border-[#9AA39C] focus:outline-none focus:ring-1 focus:ring-[#2F6E4F] leading-normal"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#5B655D] block mb-1">Pilih Lokasi di Peta (Geser penanda atau klik peta) <span className="text-[#C1502E]">*</span></label>
              <div 
                ref={selectMapRef}
                className="w-full h-44 rounded-[8px] border border-[#9AA39C]/40 overflow-hidden z-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[#5B655D] block mb-1">Latitude <span className="text-[#C1502E]">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: -7.56720"
                  required
                  value={newBeneficiary.location_lat}
                  onChange={(e) => handleLatChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-[8px] text-xs border border-[#9AA39C] focus:outline-none focus:ring-1 focus:ring-[#2F6E4F] font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#5B655D] block mb-1">Longitude <span className="text-[#C1502E]">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: 110.81200"
                  required
                  value={newBeneficiary.location_lng}
                  onChange={(e) => handleLngChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-[8px] text-xs border border-[#9AA39C] focus:outline-none focus:ring-1 focus:ring-[#2F6E4F] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#5B655D] block mb-1">Nomor Telepon Kontak</label>
              <input
                type="text"
                placeholder="Contoh: 08123456789"
                value={newBeneficiary.contact_number}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, contact_number: e.target.value }))}
                className="w-full h-9 px-3 rounded-[8px] text-xs border border-[#9AA39C] focus:outline-none focus:ring-1 focus:ring-[#2F6E4F] font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              {editingId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="flex-1 border border-[#9AA39C] text-[#5B655D] hover:bg-[#F4F6F3]"
                >
                  Batal
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={submittingBeneficiary}
                className="flex-1 justify-center"
              >
                {editingId ? "Simpan Perubahan" : "Simpan Lokasi Drop-off"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Konfirmasi Hapus Lokasi"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#5B655D]">
            Apakah Anda yakin ingin menghapus lokasi drop-off ini secara permanen dari sistem?
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
              onClick={confirmDeleteBeneficiary}
              isLoading={beneficiaryToDelete === null && showConfirmDelete}
            >
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
