import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Buat URL pengalihan berdasarkan URL permintaan saat ini
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = next;
      // Hapus query params yang berhubungan dengan proses callback
      redirectUrl.searchParams.delete("code");
      redirectUrl.searchParams.delete("next");
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Arahkan kembali ke halaman login jika pertukaran kode gagal
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("error", "gagal_autentikasi");
  return NextResponse.redirect(loginUrl);
}
