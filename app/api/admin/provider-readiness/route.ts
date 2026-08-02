import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const platformAdminEmails = new Set(["pasnexai@gmail.com"]);

async function requireAdmin(token: string) {
  const supabase = createSupabaseAdminClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user?.email || !platformAdminEmails.has(user.email.toLowerCase())) {
    throw new Error("Platform admin access required.");
  }
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    await requireAdmin(token);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pasnex.com";
    const callbackUrl = process.env.META_WEBHOOK_CALLBACK_URL || `${siteUrl.replace(/\/$/, "")}/api/provider/meta/webhook`;

    return NextResponse.json({
      meta: {
        callbackUrl,
        appIdConfigured: Boolean(process.env.META_APP_ID),
        appSecretConfigured: Boolean(process.env.META_APP_SECRET),
        verifyTokenConfigured: Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN),
        tokenEncryptionConfigured: Boolean(process.env.PROVIDER_TOKEN_ENCRYPTION_KEY),
        webhookRoute: "/api/provider/meta/webhook",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load provider readiness." },
      { status: 500 },
    );
  }
}
