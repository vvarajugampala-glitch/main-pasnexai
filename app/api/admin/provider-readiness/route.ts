import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const platformAdminEmails = new Set(["pasnexai@gmail.com"]);

function getSecretFingerprint(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return { configured: false, length: 0, sha256Prefix: null };
  }

  return {
    configured: true,
    length: trimmed.length,
    sha256Prefix: crypto.createHash("sha256").update(trimmed).digest("hex").slice(0, 10),
  };
}

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
    const appSecretFingerprint = getSecretFingerprint(process.env.META_APP_SECRET);

    return NextResponse.json(
      {
      meta: {
        callbackUrl,
        appId: process.env.META_APP_ID ?? null,
        appIdConfigured: Boolean(process.env.META_APP_ID),
        appSecretConfigured: appSecretFingerprint.configured,
        appSecretLength: appSecretFingerprint.length,
        appSecretSha256Prefix: appSecretFingerprint.sha256Prefix,
        verifyTokenConfigured: Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN),
        tokenEncryptionConfigured: Boolean(process.env.PROVIDER_TOKEN_ENCRYPTION_KEY),
        webhookRoute: "/api/provider/meta/webhook",
        vercelEnv: process.env.VERCEL_ENV ?? null,
        gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
      },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load provider readiness." },
      { status: 500 },
    );
  }
}
