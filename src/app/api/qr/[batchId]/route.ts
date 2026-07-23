import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import QRCode from "qrcode";

/**
 * GET /api/qr/[batchId]
 * Returns QR code data URL for a given batch. Public (no auth required)
 * since QR codes are meant to be displayed in the app and printed.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host;
  const proto = request.headers.get("x-forwarded-proto") || (request.nextUrl.protocol === "https:" ? "https" : "http");
  const origin = `${proto}://${host}`;

  const { batchId } = await params;

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

  const { data: batch } = await supabase
    .from("surplus_batch")
    .select("id, qr_code, qr_data_url, name")
    .eq("id", batchId)
    .single();

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  // Return cached data URL if available
  if (batch.qr_data_url) {
    return NextResponse.json({ dataUrl: batch.qr_data_url, qrCode: batch.qr_code });
  }

  // Generate on the fly
  const qrCode = batch.qr_code ?? batchId.slice(0, 8).toUpperCase();
  const scanUrl = `${origin}/scan/${qrCode}`;

  const dataUrl = await QRCode.toDataURL(scanUrl, {
    errorCorrectionLevel: "M",
    width: 256,
    margin: 2,
    color: {
      dark: "#1E4A35",
      light: "#FFFFFF",
    },
  });

  // Persist
  await supabase
    .from("surplus_batch")
    .update({ qr_code: qrCode, qr_data_url: dataUrl })
    .eq("id", batchId);

  return NextResponse.json({ dataUrl, qrCode });
}
