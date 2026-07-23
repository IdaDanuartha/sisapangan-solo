"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircle, Search, Eye, Pencil, Trash2, Package, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge, CategoryBadge, DistributionBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
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
  location_label?: string | null;
  profiles?: {
    name: string;
  } | null;
}

interface Props {
  initialBatches: Batch[];
  currentUserId: string;
  currentUserRole: string;
}

export function SurplusManagementClient({ initialBatches, currentUserId, currentUserRole }: Props) {
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const triggerDelete = (id: string) => {
    setBatchToDelete(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!batchToDelete) return;
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("surplus_batch")
        .delete()
        .eq("id", batchToDelete);

      if (error) throw error;

      setBatches((prev) => prev.filter((b) => b.id !== batchToDelete));
      showToast("Surplus berhasil dihapus!", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Gagal menghapus surplus: " + err.message, "error");
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
      setBatchToDelete(null);
    }
  };

  const pageSize = 10;

  // Filtering
  const filtered = useMemo(() => {
    return batches.filter((b) => {
      const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.category.toLowerCase().includes(search.toLowerCase()) ||
        (b.profiles?.name || "").toLowerCase().includes(search.toLowerCase());
      
      const matchCategory = !filterCategory || b.category === filterCategory;
      const matchStatus = filterStatus === "Semua" || b.status === filterStatus;
      
      return matchSearch && matchCategory && matchStatus;
    });
  }, [batches, search, filterCategory, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const categories = ["Makanan Matang", "Roti/Bakery", "Buah Potong", "Sayuran", "Bahan Segar", "Lainnya"];
  const statuses = ["Tersedia", "Diklaim", "Diambil", "Selesai"];

  // Autocomplete suggestions from all batches
  const surplusSearchSuggestions: SearchSuggestion[] = useMemo(() => {
    const seen = new Set<string>();
    const results: SearchSuggestion[] = [];
    batches.forEach((b) => {
      if (!seen.has(b.id)) {
        seen.add(b.id);
        results.push({
          id: b.id,
          label: b.name,
          sublabel: `${b.category} · ${b.status}`,
          type: "food",
          icon: "food",
        });
      }
    });
    return results;
  }, [batches]);

  // Handle suggestion select → navigate to detail page
  const handleSurplusSelect = useCallback(
    (s: SearchSuggestion) => {
      router.push(`/app/surplus/${s.id}`);
    },
    [router]
  );

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6 flex flex-col min-h-screen pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B1F1C]">Data Surplus Pangan</h1>
          <p className="text-sm text-[#9AA39C]">
            Kelola dan pantau seluruh surplus pangan yang Anda posting untuk diselamatkan.
          </p>
        </div>
        <Link href="/app/surplus/add" className="w-full sm:w-auto">
          <Button
            variant="primary"
            className="w-full sm:w-auto flex items-center justify-center gap-2 h-10 px-5 rounded-[8px]"
            id="btn-tambah-surplus-data"
          >
            <PlusCircle size={16} />
            Tambah Surplus
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center bg-white p-4 rounded-[16px] border border-[#E4F0E8] shadow-sm">
        {/* Search with autocomplete */}
        <SearchAutocomplete
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1); }}
          placeholder="Cari nama makanan atau kategori..."
          suggestions={surplusSearchSuggestions}
          onSelect={handleSurplusSelect}
          className="flex-1 w-full"
        />

        {/* Dropdowns */}
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 px-3 rounded-[8px] border border-[#9AA39C] bg-white text-xs text-[#5B655D] focus:outline-none cursor-pointer flex-1 md:flex-initial"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 px-3 rounded-[8px] border border-[#9AA39C] bg-white text-xs text-[#5B655D] focus:outline-none cursor-pointer flex-1 md:flex-initial"
          >
            <option value="Semua">Semua Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table or Card List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak Ada Data Surplus"
          description="Tambahkan surplus pangan pertama Anda untuk memulai aksi penyelamatan pangan."
          variant="default"
          action={
            <Link href="/app/surplus/add">
              <button className="px-4 py-2 rounded-[8px] bg-[#2F6E4F] text-white text-xs font-bold hover:bg-[#1E4A35] transition-colors">
                Tambah Surplus Sekarang
              </button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden bg-white border border-[#E4F0E8] rounded-[16px] shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-[#F4F6F3] text-[#5B655D] font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Nama Pangan</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4 text-center">Jumlah</th>
                  <th className="px-6 py-4 text-center">Kesegaran</th>
                  <th className="px-6 py-4 text-center">Status Distribusi</th>
                  <th className="px-6 py-4">Tanggal Dibuat</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4F0E8] text-[#1B1F1C]">
                {paginated.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F4F6F3]/50 transition-colors">
                    <td className="px-6 py-4 font-bold max-w-[200px] truncate">{b.name}</td>
                    <td className="px-6 py-4">
                      <CategoryBadge label={b.category} />
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">
                      {b.quantity} {b.unit}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={b.freshness_status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <DistributionBadge status={b.status as any} />
                    </td>
                    <td className="px-6 py-4 text-[#5B655D]">
                      {new Date(b.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link href={`/app/surplus/${b.id}`}>
                          <button
                            className="p-1.5 rounded-full text-[#5B655D] hover:text-[#2F6E4F] hover:bg-[#F4F6F3] transition-colors"
                            title="Detail"
                          >
                            <Eye size={16} />
                          </button>
                        </Link>
                        {b.status === "Tersedia" && (
                          <>
                            <Link href={`/app/surplus/${b.id}/edit`}>
                              <button
                                className="p-1.5 rounded-full text-[#5B655D] hover:text-[#2F6E4F] hover:bg-[#F4F6F3] transition-colors"
                                title="Edit"
                              >
                                <Pencil size={16} />
                              </button>
                            </Link>
                            <button
                              onClick={() => triggerDelete(b.id)}
                              className="p-1.5 rounded-full text-[#D14343] hover:bg-[#FAEAEA] transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden space-y-3">
            {paginated.map((b) => (
              <div
                key={b.id}
                className="bg-white p-4 rounded-[16px] border border-[#E4F0E8] shadow-sm space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-[#1B1F1C]">{b.name}</h3>
                    <p className="text-[10px] text-[#9AA39C] mt-0.5">
                      Dibuat pada {new Date(b.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <DistributionBadge status={b.status as any} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <CategoryBadge label={b.category} />
                  <StatusBadge status={b.freshness_status} />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#F4F6F3]">
                  <span className="text-xs font-semibold text-[#5B655D]">
                    Jumlah: <strong className="text-[#1B1F1C]">{b.quantity} {b.unit}</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/app/surplus/${b.id}`}
                      className="p-1.5 rounded-full text-[#5B655D] hover:text-[#2F6E4F] hover:bg-[#F4F6F3] transition-colors"
                      title="Detail"
                    >
                      <Eye size={16} />
                    </Link>
                    {b.status === "Tersedia" && (
                      <>
                        <Link
                          href={`/app/surplus/${b.id}/edit`}
                          className="p-1.5 rounded-full text-[#5B655D] hover:text-[#2F6E4F] hover:bg-[#F4F6F3] transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </Link>
                        <button
                          onClick={() => triggerDelete(b.id)}
                          className="p-1.5 rounded-full text-[#D14343] hover:bg-[#FAEAEA] transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination bar */}
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
      )}

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
              onClick={confirmDelete}
              isLoading={isDeleting}
            >
              Hapus Permanen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
