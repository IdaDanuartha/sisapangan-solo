"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Calendar, Clock, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";

export default function EditRecurringTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { showToast } = useToast();
  
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("porsi");
  const [storageCondition, setStorageCondition] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("6");
  const [notes, setNotes] = useState("");
  const [scheduleDays, setScheduleDays] = useState<number[]>([]);
  const [scheduleTime, setScheduleTime] = useState("08:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  useEffect(() => {
    async function loadTemplate() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error: loadErr } = await supabase
          .from("surplus_template")
          .select("*")
          .eq("id", id)
          .single();

        if (loadErr || !data) {
          throw new Error("Template tidak ditemukan.");
        }

        setName(data.name);
        setCategory(data.category);
        setQuantity(data.quantity.toString());
        setUnit(data.unit || "porsi");
        setStorageCondition(data.storage_condition || "");
        setEstimatedHours(data.estimated_hours.toString());
        setNotes(data.notes || "");
        setScheduleDays(data.schedule_days || []);
        setScheduleTime(data.schedule_time || "08:00");
      } catch (err: any) {
        setError(err.message || "Gagal memuat detail template.");
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadTemplate();
    }
  }, [id, router]);

  function toggleDay(idx: number) {
    setScheduleDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort()
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !category || !quantity || scheduleDays.length === 0) {
      setError("Isi semua kolom wajib dan pilih minimal satu hari.");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { error: updateErr } = await supabase
        .from("surplus_template")
        .update({
          name,
          category,
          quantity: parseFloat(quantity),
          unit,
          storage_condition: storageCondition || null,
          estimated_hours: parseFloat(estimatedHours),
          notes: notes || null,
          schedule_days: scheduleDays,
          schedule_time: scheduleTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateErr) throw updateErr;

      // Call notify API via Fonnte
      try {
        await fetch("/api/surplus/recurring/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateName: name,
            scheduleDays,
            scheduleTime,
          }),
        });
      } catch (notifErr) {
        console.error("Gagal mengirim notifikasi WA Fonnte:", notifErr);
      }

      showToast("Template surplus rutin diperbarui!", "success");
      router.push("/app/surplus/recurring");
    } catch (err) {
      console.error(err);
      setError("Gagal memperbarui template rutin. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-[#9AA39C] animate-pulse">Memuat template...</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[#2F6E4F] font-medium mb-5 hover:underline"
      >
        <ArrowLeft size={16} />
        Kembali
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1B1F1C]">Edit Surplus Rutin</h1>
        <p className="text-sm text-[#9AA39C]">Perbarui template untuk posting terjadwal</p>
      </div>

      {error && (
        <div role="alert" className="mb-4 bg-[#FAEAEA] border border-[#D14343]/20 rounded-[10px] px-4 py-3 text-sm text-[#A02020]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-[20px] p-6 shadow-sm">
        <Input
          label="Nama / Jenis Makanan"
          id="template-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Paket makan siang sisa catering"
          required
        />

        <Select
          label="Kategori"
          id="template-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={categoryOptions}
          placeholder="-- Pilih kategori --"
          required
        />

        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="Jumlah"
              id="template-quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Contoh: 15"
              required
            />
          </div>
          <div className="w-32">
            <Select
              label="Satuan"
              id="template-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              options={unitOptions}
            />
          </div>
        </div>

        {/* Schedule days */}
        <div>
          <label className="text-sm font-medium text-[#1B1F1C] block mb-2">
            Hari Pengingat Otomatis (Reminder) <span className="text-[#D14343]">*</span>
          </label>
          <div className="flex gap-1.5 justify-between">
            {DAY_LABELS.map((label, idx) => {
              const active = scheduleDays.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={[
                    "w-10 h-10 rounded-full text-xs font-semibold border flex items-center justify-center transition-colors",
                    active
                      ? "bg-[#2F6E4F] text-white border-[#2F6E4F]"
                      : "bg-white text-[#5B655D] border-[#9AA39C] hover:border-[#2F6E4F]",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule time */}
        <Input
          label="Jam Pengingat Otomatis (Reminder)"
          id="template-time"
          type="time"
          value={scheduleTime}
          onChange={(e) => setScheduleTime(e.target.value)}
          required
          leftIcon={<Clock size={16} />}
        />

        <Input
          label="Estimasi Jam Layak Konsumsi"
          id="template-expiry"
          type="number"
          value={estimatedHours}
          onChange={(e) => setEstimatedHours(e.target.value)}
          required
          hint="Misal: 6 jam setelah diposting"
        />

        <Textarea
          label="Catatan Simpan/Kondisi"
          id="template-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Contoh: Diambil hangat jam 13.00"
          rows={3}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={isSubmitting}
          id="btn-edit-template"
        >
          <Save size={16} />
          Simpan Perubahan
        </Button>
      </form>
    </div>
  );
}
