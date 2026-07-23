"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Shield,
  Edit,
  CheckCircle,
  AlertTriangle,
  Ban,
  Play,
  ArrowLeft,
  XCircle,
  UserCheck,
  UserX,
  MapPin,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";

interface UserProfile {
  id: string;
  name: string;
  role: "donor" | "volunteer" | "non-consumption" | "monitor" | "admin";
  type: string | null;
  location: string | null;
  contact_number: string | null;
  is_verified: boolean;
  is_disabled?: boolean;
  whatsapp_opt_in: boolean;
  created_at: string;
}

export default function UserManagementPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [verifyFilter, setVerifyFilter] = useState<string>("all");

  // Edit user modal state
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserProfile["role"]>("volunteer");
  const [editType, setEditType] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editVerified, setEditVerified] = useState(false);
  const [editDisabled, setEditDisabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Check if current user is admin
      const role = user.user_metadata?.role;
      if (role !== "admin") {
        router.push("/app/dashboard");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const profiles = (data as UserProfile[]) ?? [];
      setUsers(profiles.filter((u) => u.role !== "admin"));
    } catch (err: any) {
      showToast(err.message || "Gagal memuat daftar pengguna.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleToggleVerify(user: UserProfile) {
    try {
      const supabase = createClient();
      const nextVerifyState = !user.is_verified;

      const { error } = await supabase
        .from("profiles")
        .update({
          is_verified: nextVerifyState,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;

      showToast(
        `User ${user.name} berhasil ${nextVerifyState ? "diverifikasi" : "dibatalkan verifikasinya"}.`,
        "success"
      );

      // Send WhatsApp notification if verified and opted in
      if (nextVerifyState && user.contact_number && user.whatsapp_opt_in) {
        try {
          const roleLabel = 
            user.role === "volunteer" 
              ? "Relawan / Penerima" 
              : user.role === "non-consumption" 
              ? "Pengelola Non-Konsumsi" 
              : user.role === "donor" 
              ? "Donor" 
              : user.role;
          const message = 
            `🟢 *Akun SisaPangan Solo Terverifikasi!*\n\n` +
            `Halo *${user.name}*,\n` +
            `Akun Anda telah berhasil diverifikasi oleh Admin sebagai *${roleLabel}*.\n\n` +
            `Sekarang Anda dapat membuka Peta Surplus untuk melihat dan mengklaim makanan berlebih terdekat.\n\n` +
            `Buka aplikasi:\n` +
            `${window.location.origin}/app/dashboard`;

          await fetch("/api/notifications/whatsapp", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              target: user.contact_number,
              message,
            }),
          });
        } catch (notifErr) {
          console.error("Gagal mengirim notifikasi WA verifikasi:", notifErr);
        }
      }

      // Update state locally
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_verified: nextVerifyState } : u))
      );
    } catch (err: any) {
      showToast(err.message || "Gagal mengubah status verifikasi.", "error");
    }
  }

  async function handleToggleDisable(user: UserProfile) {
    try {
      const supabase = createClient();
      const nextDisabledState = !user.is_disabled;

      const { error } = await supabase
        .from("profiles")
        .update({
          is_disabled: nextDisabledState,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) {
        // If column doesn't exist, tell the user to run SQL
        if (error.message.includes("column") && error.message.includes("is_disabled")) {
          showToast(
            "Kolom 'is_disabled' belum ada di database. Silakan jalankan SQL di deskripsi.",
            "error"
          );
          return;
        }
        throw error;
      }

      showToast(
        `Akun ${user.name} berhasil ${nextDisabledState ? "dinonaktifkan" : "diaktifkan kembali"}.`,
        "success"
      );

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_disabled: nextDisabledState } : u))
      );
    } catch (err: any) {
      showToast(err.message || "Gagal mengubah status aktif akun.", "error");
    }
  }

  function handleOpenEdit(user: UserProfile) {
    setSelectedUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditType(user.type || "");
    setEditContact(user.contact_number || "");
    setEditLocation(user.location || "");
    setEditVerified(user.is_verified);
    setEditDisabled(user.is_disabled || false);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSaving(true);

    try {
      const supabase = createClient();
      const updateData: any = {
        name: editName,
        role: editRole,
        type: editType || null,
        contact_number: editContact || null,
        location: editLocation || null,
        is_verified: editVerified,
        updated_at: new Date().toISOString()
      };

      // Try updating with is_disabled first
      const { error: err } = await supabase
        .from("profiles")
        .update({ ...updateData, is_disabled: editDisabled })
        .eq("id", selectedUser.id);

      if (err) {
        // Retry without is_disabled if it indicates column does not exist
        const isColumnError = err.message.includes("column") && err.message.includes("is_disabled");
        if (isColumnError) {
          const { error: retryErr } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", selectedUser.id);

          if (retryErr) throw retryErr;

          showToast(
            "Profil disimpan, namun kolom 'is_disabled' belum ada di Supabase. Silakan jalankan SQL migration di dashboard.",
            "warning"
          );
        } else {
          throw err;
        }
      } else {
        showToast("Profil pengguna berhasil diperbarui!", "success");
      }

      // Send WhatsApp notification if newly verified and opted in
      const newlyVerified = editVerified && !selectedUser.is_verified;
      if (newlyVerified && editContact && selectedUser.whatsapp_opt_in) {
        try {
          const roleLabel = 
            editRole === "volunteer" 
              ? "Relawan / Penerima" 
              : editRole === "non-consumption" 
              ? "Pengelola Non-Konsumsi" 
              : editRole === "donor" 
              ? "Donor" 
              : editRole;
          const message = 
            `🟢 *Akun SisaPangan Solo Terverifikasi!*\n\n` +
            `Halo *${editName}*,\n` +
            `Akun Anda telah berhasil diverifikasi oleh Admin sebagai *${roleLabel}*.\n\n` +
            `Sekarang Anda dapat membuka Peta Surplus untuk melihat dan mengklaim makanan berlebih terdekat.\n\n` +
            `Buka aplikasi:\n` +
            `${window.location.origin}/app/dashboard`;

          await fetch("/api/notifications/whatsapp", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              target: editContact,
              message,
            }),
          });
        } catch (notifErr) {
          console.error("Gagal mengirim notifikasi WA verifikasi:", notifErr);
        }
      }

      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      showToast(err.message || "Gagal memperbarui profil pengguna.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  const filteredUsers = users.filter((user) => {
    // Search query
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.contact_number && user.contact_number.includes(searchQuery)) ||
      (user.type && user.type.toLowerCase().includes(searchQuery.toLowerCase()));

    // Role filter
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    // Verification filter
    const matchesVerify =
      verifyFilter === "all" ||
      (verifyFilter === "verified" && user.is_verified) ||
      (verifyFilter === "unverified" && !user.is_verified);

    return matchesSearch && matchesRole && matchesVerify;
  });

  const countPendingVerification = users.filter(
    (u) => !u.is_verified && (u.role === "volunteer" || u.role === "non-consumption")
  ).length;

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6">
      {/* Back to Dashboard */}
      <button
        onClick={() => router.push("/app/dashboard")}
        className="flex items-center gap-2 text-sm text-[#2F6E4F] font-medium hover:underline"
      >
        <ArrowLeft size={16} />
        Kembali ke Dashboard
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1B1F1C]">Manajemen Pengguna</h1>
          <p className="text-sm text-[#9AA39C]">
            Verifikasi relawan, edit data profil, dan kontrol penangguhan akun pengguna.
          </p>
        </div>

        {/* Warning Badge for Pending Verification */}
        {countPendingVerification > 0 && (
          <div className="flex items-center gap-2 bg-[#FEF3C7] border border-[#F59E0B]/20 px-3.5 py-1.5 rounded-[12px] text-xs text-[#B45309] font-semibold animate-pulse">
            <AlertTriangle size={14} />
            <span>Ada {countPendingVerification} Pengguna Butuh Verifikasi!</span>
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#E4F0E8]/50 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full space-y-1.5">
          <label className="text-xs font-bold text-[#5B655D]">Pencarian Pengguna</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA39C]" />
            <input
              type="search"
              placeholder="Cari nama, nomor WhatsApp, atau komunitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-[8px] text-sm border border-[#9AA39C] focus:outline-none focus:ring-2 focus:ring-[#2F6E4F]"
            />
          </div>
        </div>

        <div className="w-full md:w-48 space-y-1.5">
          <Select
            label="Filter Peran"
            id="filter-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: "all", label: "Semua Peran" },
              { value: "donor", label: "Donor (Penyumbang)" },
              { value: "volunteer", label: "Volunteer (Relawan)" },
              { value: "non-consumption", label: "Non-Konsumsi (Mitra)" },
              { value: "monitor", label: "Monitor (Pemantau)" }
            ]}
          />
        </div>

        <div className="w-full md:w-48 space-y-1.5">
          <Select
            label="Filter Verifikasi"
            id="filter-verify"
            value={verifyFilter}
            onChange={(e) => setVerifyFilter(e.target.value)}
            options={[
              { value: "all", label: "Semua Status" },
              { value: "verified", label: "Terverifikasi" },
              { value: "unverified", label: "Butuh Verifikasi" }
            ]}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#E4F0E8]/50">
        {loading ? (
          <div className="space-y-4 py-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-[#F4F6F3] rounded-[10px] animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-[#9AA39C]">
            <Users size={40} className="mx-auto mb-2 opacity-40 text-[#5B655D]" />
            <p className="text-sm font-semibold">Tidak ada pengguna yang cocok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="border-b border-[#E4F0E8] text-xs font-bold text-[#5B655D] uppercase tracking-wider">
                  <th className="py-3 px-3">Nama Lengkap</th>
                  <th className="py-3 px-3">Peran / Komunitas</th>
                  <th className="py-3 px-3">Kontak WA</th>
                  <th className="py-3 px-3 text-center">Verifikasi</th>
                  <th className="py-3 px-3 text-center">Status Akun</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4F0E8]/60 text-xs text-[#1B1F1C]">
                {filteredUsers.map((user) => {
                  const needsApproval =
                    !user.is_verified && (user.role === "volunteer" || user.role === "non-consumption");

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-[#F4F6F3]/50 transition-colors ${
                        user.is_disabled ? "bg-red-50/20" : ""
                      }`}
                    >
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#1B1F1C]">{user.name}</span>
                          {user.role === "admin" && (
                            <span className="bg-[#2F6E4F]/10 text-[#2F6E4F] text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] flex items-center gap-0.5">
                              <Shield size={10} />
                              <span>ADMIN</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#9AA39C]">
                          Terdaftar: {new Date(user.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                      </td>

                      <td className="py-4 px-3">
                        <span className="capitalize font-semibold text-[#2F6E4F]">
                          {user.role === "non-consumption" ? "Penerima Pakan" : user.role}
                        </span>
                        {user.type && (
                          <p className="text-[10px] text-[#5B655D] font-medium italic">
                            ({user.type})
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-3 font-mono font-medium text-[#1B1F1C]">
                        {user.contact_number ? (
                          <a
                            href={`https://wa.me/62${user.contact_number.replace(/^0/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            <Phone size={12} className="text-[#3AA65A]" />
                            {user.contact_number}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="py-4 px-3 text-center">
                        {user.is_verified ? (
                          <span className="bg-[#EBF5EE] text-[#2F6E4F] text-[10px] font-bold px-2 py-1 rounded-full">
                            Terverifikasi
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                              needsApproval
                                ? "bg-[#FDF2F2] text-[#D14343] animate-pulse"
                                : "bg-[#F4F6F3] text-[#9AA39C]"
                            }`}
                          >
                            {needsApproval ? "Butuh Verifikasi" : "Bebas"}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-3 text-center">
                        {user.is_disabled ? (
                          <span className="bg-[#FAEAEA] text-[#D14343] text-[10px] font-bold px-2 py-1 rounded-full">
                            Nonaktif
                          </span>
                        ) : (
                          <span className="bg-[#EBF5EE] text-[#3AA65A] text-[10px] font-bold px-2 py-1 rounded-full">
                            Aktif
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Verify Shortcut */}
                          {(user.role === "volunteer" || user.role === "non-consumption") && (
                            <button
                              type="button"
                              onClick={() => handleToggleVerify(user)}
                              className={`p-1.5 rounded-[6px] border transition-all cursor-pointer ${
                                user.is_verified
                                  ? "bg-white text-[#5B655D] border-[#9AA39C] hover:bg-[#FAEAEA] hover:text-[#D14343]"
                                  : "bg-[#2F6E4F] text-white border-[#2F6E4F] hover:bg-[#204E38]"
                              }`}
                              title={user.is_verified ? "Batalkan Verifikasi" : "Verifikasi Relawan"}
                            >
                              <UserCheck size={14} />
                            </button>
                          )}

                          {/* Disable / Enable Account */}
                          {user.role !== "admin" && (
                            <button
                              type="button"
                              onClick={() => handleToggleDisable(user)}
                              className={`p-1.5 rounded-[6px] border transition-all cursor-pointer ${
                                user.is_disabled
                                  ? "bg-[#3AA65A] text-white border-[#3AA65A] hover:bg-[#204E38]"
                                  : "bg-white text-[#D14343] border-[#D14343]/20 hover:bg-[#FAEAEA]"
                              }`}
                              title={user.is_disabled ? "Aktifkan Akun" : "Nonaktifkan Akun"}
                            >
                              {user.is_disabled ? <Play size={14} /> : <Ban size={14} />}
                            </button>
                          )}

                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-[6px] border border-[#9AA39C]/40 bg-white text-[#5B655D] hover:bg-[#F4F6F3] transition-all cursor-pointer"
                            title="Edit Data User"
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {selectedUser && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedUser(null)}
          title="Edit Data Pengguna"
          size="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 font-sans">
            <Input
              label="Nama Lengkap"
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />

            <Select
              label="Peran Akun"
              id="edit-role"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as any)}
              options={[
                { value: "donor", label: "Donor (Penyumbang)" },
                { value: "volunteer", label: "Volunteer (Relawan)" },
                { value: "non-consumption", label: "Non-Konsumsi (Penerima Kompos/Pakan)" },
                { value: "monitor", label: "Monitor (Pemantau)" }
              ]}
              required
            />

            <Input
              label="Nama Komunitas / Perusahaan"
              id="edit-type"
              value={editType}
              onChange={(e) => setEditType(e.target.value)}
              placeholder="Contoh: Catering Berkah / Panti Asuhan Bersama"
            />

            <Input
              label="Nomor WhatsApp"
              id="edit-contact"
              value={editContact}
              onChange={(e) => setEditContact(e.target.value)}
              placeholder="Contoh: 08123456789"
            />

            <Input
              label="Alamat / Lokasi Operasional"
              id="edit-location"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              placeholder="Contoh: Jl. Slamet Riyadi No. 12, Surakarta"
            />

            {/* Checkbox Controls */}
            <div className="space-y-3 pt-2 border-t border-[#E4F0E8] mt-2">
              <div className="flex items-center justify-between p-2 rounded-[8px] bg-[#F4F6F3]">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#1B1F1C]">Status Verifikasi Akun</span>
                  <p className="text-[10px] text-[#9AA39C]">
                    Membuka akses volunteer untuk mengklaim surplus
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editVerified}
                  onChange={(e) => setEditVerified(e.target.checked)}
                  className="w-4.5 h-4.5 text-[#2F6E4F] border-[#9AA39C] rounded-[4px] focus:ring-[#2F6E4F]"
                />
              </div>

              {selectedUser.role !== "admin" && (
                <div className="flex items-center justify-between p-2 rounded-[8px] bg-red-50/30 border border-red-100">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#D14343]">Tangguhkan / Disable Akun</span>
                    <p className="text-[10px] text-[#9AA39C]">
                      Memblokir pengguna dari login ke dalam platform SisaPangan
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editDisabled}
                    onChange={(e) => setEditDisabled(e.target.checked)}
                    className="w-4.5 h-4.5 text-[#D14343] border-red-300 rounded-[4px] focus:ring-[#D14343]"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E4F0E8]">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setSelectedUser(null)}
                className="border border-[#9AA39C] text-[#5B655D] hover:bg-[#F4F6F3]"
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
