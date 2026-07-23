import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SEVEN_DAYS = 7 * 24 * 60 * 60; // 7 hari dalam detik (604,800s)

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: SEVEN_DAYS,
        path: "/",
        sameSite: "lax",
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                maxAge: SEVEN_DAYS,
                path: "/",
                sameSite: "lax",
              })
            );
          } catch {
            // setAll dipanggil dari Server Component — aman diabaikan
          }
        },
      },
    }
  );
}
