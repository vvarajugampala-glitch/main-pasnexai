import crypto from "crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
const appSecret = process.env.META_APP_SECRET;

function timingSafeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function isValidMetaSignature(rawBody: string, signatureHeader: string | null) {
  if (!appSecret) {
    return { valid: true, configured: false };
  }

  if (!signatureHeader?.startsWith("sha256=")) {
    return { valid: false, configured: true };
  }

  const expected = `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  return { valid: timingSafeEqual(expected, signatureHeader), configured: true };
}

type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    time?: number;
    messaging?: unknown[];
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;
        messages?: unknown[];
        statuses?: unknown[];
        comments?: unknown[];
        [key: string]: unknown;
      };
    }>;
  }>;
};

function detectEventType(payload: MetaWebhookPayload) {
  const object = payload.object ?? "meta";
  const firstEntry = payload.entry?.[0];
  const firstChange = firstEntry?.changes?.[0];

  if (firstEntry?.messaging?.length) {
    return `${object}.messaging`;
  }

  if (firstChange?.value?.messaging_product === "whatsapp") {
    if (firstChange.value.messages?.length) return "whatsapp.message";
    if (firstChange.value.statuses?.length) return "whatsapp.status";
    return "whatsapp.event";
  }

  if (firstChange?.field) {
    return `${object}.${firstChange.field}`;
  }

  return `${object}.unknown`;
}

function getProviderAccountId(payload: MetaWebhookPayload) {
  return payload.entry?.[0]?.id ?? null;
}

async function storeWebhookEvent(payload: MetaWebhookPayload, rawBody: string, signatureConfigured: boolean) {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("provider_webhook_events").insert({
      provider: "meta",
      event_type: detectEventType(payload),
      provider_account_id: getProviderAccountId(payload),
      signature_verified: signatureConfigured,
      payload,
      raw_body: rawBody,
    });

    if (error) {
      console.warn("Meta webhook event was received but not stored", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Meta webhook event storage skipped", error instanceof Error ? error.message : error);
    return false;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (!verifyToken) {
    return NextResponse.json({ error: "META_WEBHOOK_VERIFY_TOKEN is not configured." }, { status: 500 });
  }

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const signatureCheck = isValidMetaSignature(rawBody, signature);

  if (!signatureCheck.valid) {
    return NextResponse.json({ error: "Invalid Meta webhook signature." }, { status: 401 });
  }

  let payload: MetaWebhookPayload = {};
  try {
    payload = rawBody ? (JSON.parse(rawBody) as MetaWebhookPayload) : {};
  } catch {
    return NextResponse.json({ error: "Invalid webhook JSON payload." }, { status: 400 });
  }

  const stored = await storeWebhookEvent(payload, rawBody, signatureCheck.configured);

  console.log("Meta webhook received", {
    signatureConfigured: signatureCheck.configured,
    stored,
    eventType: detectEventType(payload),
    receivedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, stored, eventType: detectEventType(payload) });
}
