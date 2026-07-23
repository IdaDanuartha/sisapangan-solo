import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SEVEN_DAYS = 7 * 24 * 60 * 60; // 7 hari dalam detik (604,800s)

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
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
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              maxAge: SEVEN_DAYS,
              path: "/",
              sameSite: "lax",
            })
          );
        },
      },
    }
  );

  // Refresh the session — required for SSR to work
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /app/* routes — redirect to /login if not authenticated
  if (
    !user &&
    request.nextUrl.pathname.startsWith("/app") &&
    !request.nextUrl.pathname.startsWith("/app/api")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Route-level Role-Based Access Control (RBAC)
  if (user && request.nextUrl.pathname.startsWith("/app")) {
    const role = user.user_metadata?.role || "donor";
    const pathname = request.nextUrl.pathname;

    // 1. /app/users -> Admin only
    if (pathname.startsWith("/app/users") && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/app/dashboard";
      return NextResponse.redirect(url);
    }

    // 2. /app/surplus/add -> Donor & Admin only
    if (pathname.startsWith("/app/surplus/add") && role !== "donor" && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/app/dashboard";
      return NextResponse.redirect(url);
    }

    // 3. /app/surplus/nearby -> Volunteer, Non-consumption, Admin, Monitor only
    if (pathname.startsWith("/app/surplus/nearby") && role === "donor") {
      const url = request.nextUrl.clone();
      url.pathname = "/app/surplus";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Skip static files and _next internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
