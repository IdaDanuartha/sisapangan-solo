"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasSession(true);
        } else {
          setHasSession(false);
        }
      } catch (err) {
        console.error("Gagal memeriksa sesi reset:", err);
        setHasSession(false);
      } finally {
        setIsValidatingSession(false);
      }
    }
    checkSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Kata sandi minimal harus 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error("Supabase updateUser error:", updateError);
        setError(updateError.message || "Gagal memperbarui kata sandi.");
        setIsLoading(false);
        return;
      }

      // Keluar dari sesi sementara setelah reset sukses
      await supabase.auth.signOut();
      
      // Arahkan ke login dengan pesan sukses
      router.push("/login?message=Kata sandi berhasil diubah. Silakan masuk dengan kata sandi baru.");
    } catch (err: any) {
      setError(`Terjadi kesalahan: ${err?.message || err}`);
      setIsLoading(false);
    }
  }

  if (isValidatingSession) {
    return (
      <div className="min-h-screen bg-[#F4F6F3] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="inline-block w-8 h-8 border-4 border-[#2F6E4F] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-[#9AA39C]">Memvalidasi sesi keamanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F3] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center font-bold mb-6">
            <img
              src="/images/logo_full.png"
              alt="SisaPangan Logo"
              className="h-16 w-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold text-[#1B1F1C] mt-2">
            Atur Ulang Kata Sandi
          </h1>
          <p className="text-sm text-[#9AA39C] mt-1">
            Buat kata sandi baru yang aman untuk akun kamu.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-6 space-y-4">
          {!hasSession ? (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FAEAEA] text-[#D14343] mb-2">
                <AlertCircle size={28} />
              </div>
              <h2 className="text-lg font-semibold text-[#1B1F1C]">
                Tautan Tidak Valid
              </h2>
              <p className="text-sm text-[#5B655D] leading-relaxed">
                Tautan atur ulang kata sandi ini sudah kedaluwarsa atau tidak valid. 
                Silakan minta tautan baru melalui halaman lupa kata sandi.
              </p>
              <div className="pt-2">
                <Link href="/forgot-password" className="w-full">
                  <Button variant="primary" className="w-full">
                    Minta Tautan Baru
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div
                  role="alert"
                  className="bg-[#FAEAEA] border border-[#D14343]/20 rounded-[8px] px-4 py-3 text-sm text-[#A02020]"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Kata Sandi Baru */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="reset-password"
                    className="text-sm font-medium text-[#1B1F1C]"
                  >
                    Kata Sandi Baru{" "}
                    <span className="text-[#D14343]" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA39C]"
                      aria-hidden="true"
                    />
                    <input
                      id="reset-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      required
                      autoComplete="new-password"
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

                {/* Konfirmasi Kata Sandi */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="confirm-password"
                    className="text-sm font-medium text-[#1B1F1C]"
                  >
                    Konfirmasi Kata Sandi Baru{" "}
                    <span className="text-[#D14343]" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA39C]"
                      aria-hidden="true"
                    />
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      required
                      autoComplete="new-password"
                      className="w-full h-10 pl-9 pr-10 rounded-[8px] text-sm text-[#1B1F1C] bg-white border border-[#9AA39C] focus:outline-none focus:ring-2 focus:ring-[#2F6E4F] focus:border-[#2F6E4F] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={
                        showConfirmPassword
                          ? "Sembunyikan kata sandi"
                          : "Tampilkan kata sandi"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA39C] hover:text-[#5B655D] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full mt-2"
                  isLoading={isLoading}
                  id="btn-reset-password"
                >
                  Ubah Kata Sandi
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#9AA39C] mt-6">
          © {new Date().getFullYear()} SisaPangan Solo. Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  );
}
