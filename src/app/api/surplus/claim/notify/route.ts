import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const fonnteToken = process.env.FONNTE_TOKEN;
  if (!fonnteToken) {
    return NextResponse.json({ success: true, message: "Fonnte token not configured, skipped notification" });
  }

  try {
    const { batchId, volunteerId } = await request.json();
    if (!batchId || !volunteerId) {
      return NextResponse.json({ error: "batchId and volunteerId required" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch batch details including donor profile
    const { data: batch, error: batchErr } = await supabase
      .from("surplus_batch")
      .select(`
        id, name, quantity, unit, estimated_expiry, location_label,
        donor_id,
        donor:donor_id(name, contact_number, whatsapp_opt_in)
      `)
      .eq("id", batchId)
      .single();

    if (batchErr || !batch) {
      return NextResponse.json({ error: "Batch not found: " + (batchErr?.message || "") }, { status: 404 });
    }

    // 2. Fetch volunteer details
    const { data: volunteer, error: volunteerErr } = await supabase
      .from("profiles")
      .select("name, contact_number, whatsapp_opt_in")
      .eq("id", volunteerId)
      .single();

    if (volunteerErr || !volunteer) {
      return NextResponse.json({ error: "Volunteer not found: " + (volunteerErr?.message || "") }, { status: 404 });
    }

    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host;
    const proto = request.headers.get("x-forwarded-proto") || (request.nextUrl.protocol === "https:" ? "https" : "http");
    const origin = `${proto}://${host}`;

    const donorProfile = batch.donor as any;

    // Send WhatsApp to Donor if they opted in
    if (donorProfile?.contact_number && donorProfile.whatsapp_opt_in !== false) {
      const donorMessage =
        `🔔 *Surplus Pangan Anda Diklaim!*\n\n` +
        `Halo *${donorProfile.name}*,\n` +
        `Surplus pangan Anda berikut telah diklaim oleh Relawan:\n\n` +
        `🍱 *${batch.name}* (${batch.quantity} ${batch.unit})\n` +
        `👤 *Nama Relawan:* ${volunteer.name}\n` +
        `📞 *Kontak Relawan:* ${volunteer.contact_number || "—"}\n\n` +
        `Relawan akan menjemput makanan ke lokasi Anda. Silakan persiapkan makanan sebelum kedaluwarsa.\n` +
        `Pantau detail transaksi di:\n` +
        `${origin}/app/surplus/${batch.id}`;

      await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: fonnteToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: donorProfile.contact_number,
          message: donorMessage,
        }),
      }).catch(err => console.error("Error sending WhatsApp to Donor:", err));
    }

    // Send WhatsApp to Volunteer if they opted in
    if (volunteer.contact_number && volunteer.whatsapp_opt_in !== false) {
      const volunteerMessage =
        `✅ *Klaim Surplus Berhasil!*\n\n` +
        `Halo *${volunteer.name}*,\n` +
        `Anda berhasil mengklaim surplus pangan berikut:\n\n` +
        `🍱 *${batch.name}* (${batch.quantity} ${batch.unit})\n` +
        `📍 *Lokasi Donor:* ${donorProfile?.name || "Donor"}\n` +
        `Alamat: ${batch.location_label || "—"}\n` +
        `⏰ *Batas Layak Konsumsi:* ${new Date(batch.estimated_expiry).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}\n\n` +
        `Silakan ambil makanan di lokasi donor dan bawa wadah mandiri bila diperlukan.\n` +
        `Buka rute penjemputan Anda di:\n` +
        `${origin}/app/pickup/route`;

      await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: fonnteToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: volunteer.contact_number,
          message: volunteerMessage,
        }),
      }).catch(err => console.error("Error sending WhatsApp to Volunteer:", err));
    }

    return NextResponse.json({ success: true, message: "Notifications processed successfully" });
  } catch (err: any) {
    console.error("Failed to process claim notification:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
