import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

async function getPostLoginPath(userId: string, nextPath: string | null) {
  if (nextPath?.startsWith("/admin")) {
    return nextPath;
  }

  const supabase = createSupabaseAdminClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("status, onboarding_completed")
    .eq("id", userId)
    .maybeSingle<{ status: string; onboarding_completed: boolean }>();

  if (error) {
    throw new Error(error.message);
  }

  if (!profile) {
    return "/register?verified=1&completeProfile=1&provider=google";
  }

  if (profile.status !== "approved") {
    return "/login?status=pending";
  }

  await supabase.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", userId);

  return profile.onboarding_completed ? "/dashboard" : "/onboarding";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");

  if (provider === "meta") {
    return NextResponse.redirect(new URL("/dashboard/channels?provider=meta&status=error&message=Use+the+Meta+provider+callback+URL", url.origin));
  }

  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_oauth_code", url.origin));
  }

  const redirectResponse = NextResponse.redirect(new URL("/login", url.origin));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", error?.message ?? "google_login_failed");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const nextPath = getSafeNextPath(url.searchParams.get("next"));
    const destination = await getPostLoginPath(data.user.id, nextPath);
    const destinationUrl = new URL(destination, url.origin);
    redirectResponse.headers.set("Location", destinationUrl.toString());
    return redirectResponse;
  } catch (error) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", error instanceof Error ? error.message : "Could not complete Google login.");
    redirectResponse.headers.set("Location", loginUrl.toString());
    return redirectResponse;
  }
}
