import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { templateName, scheduleDays, scheduleTime } = await request.json();

  if (!templateName || !scheduleDays || !scheduleTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Fetch the donor's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, contact_number, whatsapp_opt_in")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.contact_number) {
    return NextResponse.json({ success: true, message: "Profile or contact number not found" });
  }

  const fonnteToken = process.env.FONNTE_TOKEN;
  if (fonnteToken && profile.whatsapp_opt_in) {
    try {
      const DAY_LABELS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const daysStr = scheduleDays.map((d: number) => DAY_LABELS[d]).join(", ");
      
      const message =
        `🛎️ *Pengingat Surplus Rutin Aktif!*\n\n` +
        `Halo *${profile.name || "Donor"}*,\n` +
        `Template surplus rutin Anda *"${templateName}"* telah berhasil didaftarkan.\n\n` +
        `📅 *Jadwal Pengingat:* setiap *${daysStr}* pukul *${scheduleTime}* WIB.\n\n` +
        `Sistem akan mengirimkan pengingat WhatsApp ini agar Anda tinggal mengklik link konfirmasi untuk memposting surplus secara instan. Terima kasih telah berpartisipasi mencegah sampah makanan! 🍱`;

      await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: fonnteToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: profile.contact_number,
          message,
          delay: "1",
          countryCode: "62",
        }),
      });
    } catch (notifErr) {
      console.error("[Fonnte] Template notification failed:", notifErr);
    }
  }

  return NextResponse.json({ success: true });
}
