"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/auth/callback?next=/reset-password`;
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: redirectUrl,
        }
      );

      if (resetError) {
        console.error("Supabase resetError:", resetError);
        setError(
          resetError.message === "User not found"
            ? "Email tidak terdaftar dalam sistem."
            : resetError.message || "Gagal mengirim email reset kata sandi."
        );
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(`Terjadi kesalahan: ${err?.message || err}`);
    } finally {
      setIsLoading(false);
    }
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
            Lupa Kata Sandi?
          </h1>
          <p className="text-sm text-[#9AA39C] mt-1">
            Masukkan email terdaftar kamu untuk menerima tautan atur ulang kata sandi.
          </p>
        </div>

        {/* Form / Success Card */}
        <div className="bg-white rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-6 space-y-4">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#E4F0E8] text-[#2F6E4F] mb-2">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="text-lg font-semibold text-[#1B1F1C]">
                Email Terkirim!
              </h2>
              <p className="text-sm text-[#5B655D] leading-relaxed">
                Kami telah mengirimkan tautan untuk atur ulang kata sandi ke email{" "}
                <span className="font-semibold text-[#1B1F1C]">{email}</span>.
                Silakan periksa kotak masuk atau folder spam Anda.
              </p>
              <div className="pt-2">
                <Link href="/login" className="w-full">
                  <Button variant="primary" className="w-full">
                    Kembali ke Login
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
                <Input
                  label="Email Terdaftar"
                  type="email"
                  id="forgot-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kamu@contoh.com"
                  required
                  autoComplete="email"
                  leftIcon={<Mail size={16} />}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full mt-2"
                  isLoading={isLoading}
                  id="btn-forgot-password"
                >
                  Kirim Tautan Reset
                </Button>
              </form>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#2F6E4F] hover:underline font-medium"
                >
                  <ArrowLeft size={12} /> Kembali ke halaman masuk
                </Link>
              </div>
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
