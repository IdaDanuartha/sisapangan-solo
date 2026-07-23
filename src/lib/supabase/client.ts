import { createBrowserClient } from "@supabase/ssr";

const SEVEN_DAYS = 7 * 24 * 60 * 60; // 7 hari dalam detik (604,800s)

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: SEVEN_DAYS,
        path: "/",
        sameSite: "lax",
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
}
