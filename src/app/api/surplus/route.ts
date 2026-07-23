import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import QRCode from "qrcode";

/**
 * POST /api/surplus
 * Called after form submission to generate QR code and optionally
 * send WhatsApp notification via Fonnte.
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // read-only in route handler for auth check
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { batchId } = body;

  if (!batchId) {
    return NextResponse.json({ error: "batchId required" }, { status: 400 });
  }

  // Fetch the batch
  const { data: batch } = await supabase
    .from("surplus_batch")
    .select("id, name, category, donor_id, qr_code, location_label, location_lat, location_lng, freshness_status")
    .eq("id", batchId)
    .single();

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  // Only the donor can trigger this
  if (batch.donor_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Generate QR code if not already generated
  let qrCode = batch.qr_code;
  if (!qrCode) {
    qrCode = `${batchId.slice(0, 8).toUpperCase()}`;
    const qrDataUrl = await QRCode.toDataURL(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/scan/${qrCode}`,
      { errorCorrectionLevel: "M", width: 256 }
    );

    await supabase
      .from("surplus_batch")
      .update({ qr_code: qrCode, qr_data_url: qrDataUrl })
      .eq("id", batchId);
  }

  // Send WhatsApp notification via Fonnte (if FONNTE_TOKEN is set)
  const fonnteToken = process.env.FONNTE_TOKEN;
  if (fonnteToken) {
    try {
      const targetRole = batch.freshness_status === "non-consumption" ? "non-consumption" : "volunteer";
      console.log(`[Fonnte Notify] Triggered for batch ${batchId}. Target role: ${targetRole}`);

      // Fetch all volunteers/non-consumption managers with whatsapp_opt_in = true
      const { data: volunteers } = await supabase
        .from("profiles")
        .select("contact_number, location_lat, location_lng")
        .eq("role", targetRole)
        .eq("whatsapp_opt_in", true);

      console.log(`[Fonnte Notify] Found ${volunteers?.length || 0} registered users with role ${targetRole} and whatsapp_opt_in = true.`);

      if (volunteers && volunteers.length > 0) {
        const batchLat = batch.location_lat;
        const batchLng = batch.location_lng;
        console.log(`[Fonnte Notify] Batch Location: lat=${batchLat}, lng=${batchLng}`);

        let filteredVolunteers = volunteers;
        if (batchLat != null && batchLng != null) {
          filteredVolunteers = volunteers
            .map((v) => {
              let distance = 99999;
              if (v.location_lat != null && v.location_lng != null) {
                distance = haversine(batchLat, batchLng, v.location_lat, v.location_lng);
              }
              console.log(`   - User with number ${v.contact_number} is at lat=${v.location_lat}, lng=${v.location_lng}. Distance: ${distance.toFixed(2)} km`);
              return { ...v, distance };
            })
            .filter((v) => v.distance <= 50) // limit to 50 km radius (e.g. within Bali or Solo Raya)
            .sort((a, b) => a.distance - b.distance);
        }

        const targetVolunteers = filteredVolunteers.slice(0, 50);
        console.log(`[Fonnte Notify] Volunteers within 50km radius: ${targetVolunteers.length}`);

        if (targetVolunteers.length > 0) {
          const numbers = targetVolunteers
            .map((v) => v.contact_number)
            .filter(Boolean)
            .join(",");

          const message =
            targetRole === "non-consumption"
              ? `♻️ *Surplus Non-Konsumsi Tersedia (Pakan/Kompos)!*\n\n` +
                `*${batch.name}* (${batch.category})\n` +
                `📍 ${batch.location_label ?? "Lokasi tersedia"}\n\n` +
                `Ambil untuk pakan, maggot, atau kompos melalui:\n` +
                `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/app/surplus/${batchId}`
              : `🍱 *Surplus Baru Tersedia!*\n\n` +
                `*${batch.name}* (${batch.category})\n` +
                `📍 ${batch.location_label ?? "Lokasi tersedia"}\n\n` +
                `Klaim sebelum kedaluwarsa melalui:\n` +
                `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/app/surplus/${batchId}`;

          console.log(`[Fonnte Notify] Sending WhatsApp message to: ${numbers}`);
          const fonnteRes = await fetch("https://api.fonnte.com/send", {
            method: "POST",
            headers: {
              Authorization: fonnteToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              target: numbers,
              message,
              delay: "1",
              countryCode: "62",
            }),
          });
          const fonnteText = await fonnteRes.text();
          console.log(`[Fonnte Notify] Response Status: ${fonnteRes.status}, Body: ${fonnteText}`);
        } else {
          console.log(`[Fonnte Notify] No volunteers found within 50km radius of the surplus.`);
        }
      }
    } catch (notifErr) {
      // Non-fatal: log but don't fail the request
      console.error("[Fonnte] WhatsApp notification failed:", notifErr);
    }
  }

  return NextResponse.json({ success: true, qrCode });
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
