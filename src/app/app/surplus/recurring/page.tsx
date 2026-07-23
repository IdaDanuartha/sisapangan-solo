"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Pause, Play, Trash2, Clock, Calendar, Edit } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CategoryBadge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

interface SurplusTemplate {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  schedule_days: number[]; // 0=Sun, 1=Mon, ...
  schedule_time: string; // "HH:MM"
  paused: boolean;
  created_at: string;
}

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function RecurringSurplusPage() {
  const [templates, setTemplates] = useState<SurplusTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const { showToast } = useToast();

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("surplus_template")
      .select("*")
      .eq("donor_id", user.id)
      .order("created_at", { ascending: false });
    setTemplates((data as SurplusTemplate[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function togglePause(id: string, currentPaused: boolean) {
    const supabase = createClient();
    await supabase
      .from("surplus_template")
      .update({ paused: !currentPaused })
      .eq("id", id);
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, paused: !currentPaused } : t))
    );
    showToast(
      currentPaused ? "Template diaktifkan kembali." : "Template dijeda.",
      "info"
    );
  }

  async function deleteTemplate(id: string) {
    setTemplateToDelete(id);
    setShowConfirmDelete(true);
  }

  async function confirmDeleteTemplate() {
    if (!templateToDelete) return;
    const supabase = createClient();
    await supabase.from("surplus_template").delete().eq("id", templateToDelete);
    setTemplates((prev) => prev.filter((t) => t.id !== templateToDelete));
    showToast("Template berhasil dihapus.", "success");
    setTemplateToDelete(null);
    setShowConfirmDelete(false);
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1B1F1C]">Surplus Rutin</h1>
          <p className="text-sm text-[#9AA39C]">
            Template surplus berulang — konfirmasi harian dalam 1 ketukan
          </p>
        </div>
        <Link href="/app/surplus/recurring/new">
          <Button variant="primary" size="sm" id="btn-new-template">
            <Plus size={16} />
            Buat Template
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-[14px] animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          title="Belum Ada Template"
          description='Buat template surplus rutin agar kamu bisa konfirmasi batch harian hanya dengan satu ketukan. Cocok untuk kantin dan katering.'
          variant="default"
          action={
            <Link href="/app/surplus/recurring/new">
              <Button variant="primary" size="sm">
                <Plus size={14} />
                Buat Template Pertama
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className={[
                "bg-white rounded-[14px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-opacity",
                t.paused ? "opacity-60" : "",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-[#1B1F1C] truncate">
                      {t.name}
                    </p>
                    {t.paused && (
                      <span className="text-xs text-[#9AA39C] bg-[#F4F6F3] px-2 py-0.5 rounded-full">
                        Dijeda
                      </span>
                    )}
                  </div>
                  <CategoryBadge label={t.category} />
                  <p className="text-xs text-[#9AA39C] mt-1">
                    {t.quantity} {t.unit}
                  </p>

                  {/* Schedule */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-[#5B655D]">
                      <Calendar size={12} />
                      <span>
                        {t.schedule_days.map((d) => DAY_LABELS[d]).join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#5B655D]">
                      <Clock size={12} />
                      <span>{t.schedule_time}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePause(t.id, t.paused)}
                    aria-label={t.paused ? "Aktifkan template" : "Jeda template"}
                    className="text-[#5B655D] hover:text-[#2F6E4F]"
                  >
                    {t.paused ? <Play size={14} /> : <Pause size={14} />}
                  </Button>
                  <Link href={`/app/surplus/recurring/${t.id}/edit`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Edit template"
                      className="text-[#5B655D] hover:text-[#2F6E4F]"
                    >
                      <Edit size={14} />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTemplate(t.id)}
                    aria-label="Hapus template"
                    className="text-[#D14343] hover:bg-[#FAEAEA]"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {/* Confirm today CTA */}
              {!t.paused && (
                <Link href={`/app/surplus/add?template=${t.id}`}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full mt-3"
                    id={`btn-confirm-${t.id}`}
                  >
                    Konfirmasi Batch Hari Ini
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Konfirmasi Hapus"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#5B655D]">
            Apakah Anda yakin ingin menghapus template surplus rutin ini?
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
              onClick={confirmDeleteTemplate}
            >
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
