import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const protectedRoutes = ["/dashboard", "/admin"];

function isValidHttpUrl(urlString?: string): boolean {
  if (!urlString) return false;
  let cleanUrl = urlString.trim().replace(/^["']|["']$/g, "");
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = `https://${cleanUrl}`;
  }
  try {
    const parsed = new URL(cleanUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const hasSupabaseConfig = isValidHttpUrl(rawUrl) && Boolean(rawKey.trim());

  if (!hasSupabaseConfig) {
    return response;
  }

  let cleanUrl = rawUrl.trim().replace(/^["']|["']$/g, "");
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = `https://${cleanUrl}`;
  }

  try {
    const supabase = createServerClient(
      cleanUrl,
      rawKey.trim().replace(/^["']|["']$/g, ""),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route));
    const isAdminLoginRoute = request.nextUrl.pathname === "/admin/login";

    if (isProtectedRoute && !isAdminLoginRoute && !user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = request.nextUrl.pathname.startsWith("/admin") ? "/admin/login" : "/login";
      redirectUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  } catch {
    // If Supabase auth check fails due to invalid credentials, allow request to proceed safely
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
