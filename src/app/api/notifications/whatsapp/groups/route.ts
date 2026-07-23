import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
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

  try {
    // 1. Trigger group sync with Fonnte (runs in parallel/background, ignore failures)
    try {
      await fetch("https://api.fonnte.com/fetch-group", {
        method: "POST",
        headers: {
          Authorization: fonnteToken,
        },
      });
    } catch (syncErr) {
      console.warn("[Fonnte] sync-group failed, continuing to get list", syncErr);
    }

    // 2. Retrieve groups list from Fonnte
    const response = await fetch("https://api.fonnte.com/get-whatsapp-group", {
      method: "POST",
      headers: {
        Authorization: fonnteToken,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Fonnte API error", details: result },
        { status: 502 }
      );
    }

    // Fonnte returns JSON structure with "data" containing array of group objects
    let groups: { id: string; name: string }[] = [];
    if (result && Array.isArray(result.data)) {
      groups = result.data.map((g: any) => ({
        id: g.id || g.group_id || "",
        name: g.name || g.group_name || "Grup Tanpa Nama",
      }));
    }

    return NextResponse.json({ success: true, groups });
  } catch (err) {
    console.error("[WhatsApp get groups]", err);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}
