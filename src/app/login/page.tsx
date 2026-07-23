"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Baca pesan dari query params ketika halaman dimuat
  useEffect(() => {
    const msg = searchParams.get("message");
    const err = searchParams.get("error");
    if (msg) {
      setSuccess(msg);
    }
    if (err) {
      if (err === "gagal_autentikasi") {
        setError("Gagal melakukan verifikasi masuk. Tautan mungkin kedaluwarsa atau tidak valid.");
      } else {
        setError(err);
      }
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error("Supabase authError:", authError);
        setError(
          authError.message === "Invalid login credentials"
            ? "Email atau kata sandi salah. Periksa kembali."
            : authError.message || "Gagal masuk. Silakan coba lagi."
        );
        return;
      }

      if (authData?.user) {
        // Fetch profiles.is_disabled status (safely ignore error if column is not yet migrated)
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_disabled")
          .eq("id", authData.user.id)
          .single();

        if (profile?.is_disabled) {
          await supabase.auth.signOut();
          setError("Akun Anda telah ditangguhkan/dinonaktifkan oleh administrator. Silakan hubungi dukungan.");
          return;
        }

        // Log login activity
        try {
          await supabase.from("user_activity_log").insert({
            user_id: authData.user.id,
            user_name: authData.user.user_metadata?.name || authData.user.email || "Pengguna SisaPangan",
            role: authData.user.user_metadata?.role || "donor",
            action: "Masuk ke Platform (Login)",
          });
        } catch (e) {
          // ignore non-critical log error
        }
      }

      // Force full window navigation to guarantee fresh cookies are sent to server middleware on first click
      window.location.href = "/app/dashboard";
    } catch (err: any) {
      setError(`Terjadi kesalahan: ${err?.message || err}`);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F3] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center font-bold mb-6"
          >
            <img src="/images/logo_full.png" alt="SisaPangan Logo" className="h-16 w-auto object-contain" />
          </Link>
          <h1 className="text-2xl font-bold text-[#1B1F1C] mt-2">
            Masuk ke Akun
          </h1>
          <p className="text-sm text-[#9AA39C] mt-1">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="text-[#2F6E4F] font-medium hover:underline"
            >
              Daftar di sini
            </Link>
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-6 space-y-4">
          {success && (
            <div
              role="alert"
              className="bg-[#E4F0E8] border border-[#2F6E4F]/20 rounded-[8px] px-4 py-3 text-sm text-[#2F6E4F] flex items-start gap-2"
            >
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="bg-[#FAEAEA] border border-[#D14343]/20 rounded-[8px] px-4 py-3 text-sm text-[#A02020]"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kamu@contoh.com"
              required
              autoComplete="email"
              leftIcon={<Mail size={16} />}
            />

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-sm font-medium text-[#1B1F1C]"
                >
                  Kata Sandi{" "}
                  <span className="text-[#D14343]" aria-hidden="true">
                    *
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#2F6E4F] hover:underline"
                >
                  Lupa kata sandi?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA39C]"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kata sandi"
                  required
                  autoComplete="current-password"
                  className="w-full h-10 pl-9 pr-10 rounded-[8px] text-sm text-[#1B1F1C] bg-white border border-[#9AA39C] focus:outline-none focus:ring-2 focus:ring-[#2F6E4F] focus:border-[#2F6E4F] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA39C] hover:text-[#5B655D] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              id="btn-login"
            >
              Masuk
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[#9AA39C] mt-6">
          Dengan masuk, kamu menyetujui{" "}
          <Link
            href="/terms"
            className="underline cursor-pointer hover:text-[#5B655D]"
          >
            Syarat & Ketentuan
          </Link>{" "}
          SisaPangan Solo.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F6F3] flex items-center justify-center">
          <div className="text-[#9AA39C] text-sm">Memuat...</div>
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
