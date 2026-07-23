"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, User, Store, Sprout } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

type Role = "donor" | "volunteer" | "non-consumption";

const roleOptions: {
  id: Role;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "donor",
    label: "Donor",
    desc: "UMKM, restoran, katering, atau individu yang punya surplus pangan",
    icon: <Store size={22} />,
  },
  {
    id: "volunteer",
    label: "Relawan / Penerima",
    desc: "Relawan individu, komunitas, panti, dapur umum, atau posyandu",
    icon: <User size={22} />,
  },
  {
    id: "non-consumption",
    label: "Pengelola Non-Konsumsi",
    desc: "Budidaya maggot, peternak, pengompos, atau bank sampah organik",
    icon: <Sprout size={22} />,
  },
];

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



function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRole = (searchParams.get("role") as Role | null) ?? null;

  const [step, setStep] = useState<"role" | "details">(
    preselectedRole ? "details" : "role"
  );
  const [selectedRole, setSelectedRole] = useState<Role | null>(preselectedRole);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    location: "",
    contactNumber: "",
    estimatedCapacity: "",
    whatsappOptIn: true,
    password: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: string, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const getTypeOptions = () => {
    if (selectedRole === "donor") return donorTypeOptions;
    if (selectedRole === "volunteer") return volunteerTypeOptions;
    return nonConsumptionTypeOptions;
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.email) errs.email = "Email wajib diisi";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errs.email = "Format email tidak valid";
    if (!formData.password || formData.password.length < 8)
      errs.password = "Kata sandi minimal 8 karakter";
    if (!formData.name) errs.name = "Nama wajib diisi";
    if (!formData.type) errs.type = "Tipe wajib dipilih";
    if (!formData.location) errs.location = "Alamat/lokasi wajib diisi";
    if (!formData.contactNumber) errs.contactNumber = "Nomor kontak wajib diisi";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setServerError("");
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: selectedRole,
            type: formData.type,
            location: formData.location,
            contact_number: formData.contactNumber,
            estimated_capacity: formData.estimatedCapacity,
            whatsapp_opt_in: formData.whatsappOptIn,
          },
        },
      });

      if (signUpError) {
        setServerError(
          signUpError.message.includes("already registered")
            ? "Email ini sudah terdaftar. Silakan masuk."
            : "Terjadi kesalahan pendaftaran. Coba lagi."
        );
        return;
      }

      router.push("/app/dashboard");
      router.refresh();
    } catch {
      setServerError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F3] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center font-bold"
          >
            <img src="/images/logo_full.png" alt="SisaPangan Logo" className="h-16 w-auto object-contain" />
          </Link>
          <h1 className="text-2xl font-bold text-[#1B1F1C] mt-4">
            Buat Akun
          </h1>
          <p className="text-sm text-[#9AA39C] mt-1">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="text-[#2F6E4F] font-medium hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </div>

        {/* Step 1: Role selection */}
        {step === "role" && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#5B655D] text-center mb-4">
              Pilih peran Anda:
            </p>
            {roleOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setSelectedRole(opt.id);
                  setStep("details");
                }}
                className={[
                  "w-full flex items-start gap-4 p-4 rounded-[14px] border-2 text-left transition-all duration-150",
                  selectedRole === opt.id
                    ? "border-[#2F6E4F] bg-[#E4F0E8]"
                    : "border-[#E4F0E8] bg-white hover:border-[#2F6E4F]/50 hover:bg-[#F4F6F3]",
                ].join(" ")}
                id={`role-${opt.id}`}
              >
                <div className="w-10 h-10 rounded-[10px] bg-[#E4F0E8] flex items-center justify-center flex-shrink-0 text-[#2F6E4F]">
                  {opt.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1B1F1C]">
                    {opt.label}
                  </p>
                  <p className="text-xs text-[#9AA39C] mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Details */}
        {step === "details" && selectedRole && (
          <div className="bg-white rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-6">
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setStep("role")}
                className="text-xs text-[#2F6E4F] hover:underline"
              >
                ← Ganti peran
              </button>
              <span className="text-xs text-[#9AA39C]">
                {roleOptions.find((r) => r.id === selectedRole)?.label}
              </span>
            </div>

            {serverError && (
              <div
                role="alert"
                className="bg-[#FAEAEA] border border-[#D14343]/20 rounded-[8px] px-4 py-3 text-sm text-[#A02020] mb-4"
              >
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Email"
                type="email"
                id="reg-email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
                error={errors.email}
                placeholder="kamu@contoh.com"
                autoComplete="email"
              />

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="reg-password"
                  className="text-sm font-medium text-[#1B1F1C]"
                >
                  Kata Sandi{" "}
                  <span className="text-[#D14343]" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="reg-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Minimal 8 karakter"
                  required
                  autoComplete="new-password"
                  className={[
                    "w-full h-10 px-3 rounded-[8px] text-sm border transition-colors focus:outline-none focus:ring-2",
                    errors.password
                      ? "border-[#D14343] focus:ring-[#D14343]"
                      : "border-[#9AA39C] focus:ring-[#2F6E4F] focus:border-[#2F6E4F]",
                  ].join(" ")}
                />
                {errors.password && (
                  <p role="alert" className="text-xs text-[#D14343]">
                    {errors.password}
                  </p>
                )}
              </div>

              <Input
                label="Nama Lengkap / Nama Usaha"
                type="text"
                id="reg-name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                error={errors.name}
                placeholder="Contoh: Warung Makan Bu Sari"
                autoComplete="organization"
              />

              <Select
                label={
                  selectedRole === "donor"
                    ? "Tipe Donor"
                    : selectedRole === "volunteer"
                    ? "Tipe Relawan / Penerima"
                    : "Tipe Pengelolaan"
                }
                id="reg-type"
                value={formData.type}
                onChange={(e) => updateField("type", e.target.value)}
                required
                error={errors.type}
                options={getTypeOptions()}
                placeholder="-- Pilih tipe --"
              />

              <Input
                label="Alamat / Lokasi Operasional"
                type="text"
                id="reg-location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                required
                error={errors.location}
                placeholder="Contoh: Jl. Slamet Riyadi No. 12, Solo"
                hint="Digunakan untuk pencocokan lokasi surplus terdekat"
              />

              <Input
                label="Nomor WhatsApp / Kontak"
                type="tel"
                id="reg-contact"
                value={formData.contactNumber}
                onChange={(e) => updateField("contactNumber", e.target.value)}
                required
                error={errors.contactNumber}
                placeholder="08xxxxxxxxxx"
                hint="Nomor ini juga digunakan untuk notifikasi WhatsApp"
                autoComplete="tel"
              />

              {selectedRole === "volunteer" && (
                <Input
                  label="Estimasi Kapasitas Penerima"
                  type="text"
                  id="reg-capacity"
                  value={formData.estimatedCapacity}
                  onChange={(e) =>
                    updateField("estimatedCapacity", e.target.value)
                  }
                  placeholder="Contoh: 50 porsi / hari"
                  hint="Membantu sistem mencocokkan volume surplus yang sesuai"
                />
              )}

              {/* WhatsApp opt-in */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="whatsapp-optin"
                  checked={formData.whatsappOptIn}
                  onChange={(e) =>
                    updateField("whatsappOptIn", e.target.checked)
                  }
                  className="mt-0.5 w-4 h-4 rounded border-[#9AA39C] text-[#2F6E4F] focus:ring-[#2F6E4F] accent-[#2F6E4F]"
                />
                <span className="text-sm text-[#5B655D]">
                  Saya setuju menerima notifikasi penting melalui WhatsApp di
                  nomor di atas.{" "}
                  <span className="text-[#9AA39C] text-xs">
                    (Bisa diubah kapan saja di profil)
                  </span>
                </span>
              </label>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
                id="btn-register"
              >
                Buat Akun
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F6F3] flex items-center justify-center">
          <div className="text-[#9AA39C] text-sm">Memuat...</div>
        </div>
      }
    >
      <RegisterPageInner />
    </Suspense>
  );
}
