import crypto from "crypto";
import { NextResponse } from "next/server";

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

  let payload: unknown = null;
  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return NextResponse.json({ error: "Invalid webhook JSON payload." }, { status: 400 });
  }

  console.log("Meta webhook received", {
    signatureConfigured: signatureCheck.configured,
    receivedAt: new Date().toISOString(),
    payload,
  });

  return NextResponse.json({ ok: true });
}
