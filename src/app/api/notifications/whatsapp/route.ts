import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * POST /api/notifications/whatsapp
 * Generic WhatsApp message sender via Fonnte.
 * Used for volunteer-specific notifications (batch claimed, pickup confirmed, etc.)
 */
export async function POST(request: NextRequest) {
  const fonnteToken = process.env.FONNTE_TOKEN;

  if (!fonnteToken) {
    return NextResponse.json(
      { error: "Fonnte token not configured" },
      { status: 503 }
    );
  }

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

  const body = await request.json();
  const { target, message, batchId, eventType } = body;

  if (!target || !message) {
    return NextResponse.json(
      { error: "target and message required" },
      { status: 400 }
    );
  }

  // Log the notification attempt
  if (batchId && eventType) {
    await supabase.from("notification_log").insert({
      batch_id: batchId,
      sender_id: user.id,
      event_type: eventType,
      target_number: target,
      sent_at: new Date().toISOString(),
    });
  }

  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: fonnteToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target,
        message,
        delay: "1",
        countryCode: "62",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Fonnte API error", details: result },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("[WhatsApp notify]", err);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
