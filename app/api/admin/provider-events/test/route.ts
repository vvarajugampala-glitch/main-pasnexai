import crypto from "crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const platformAdminEmails = new Set(["pasnexai@gmail.com"]);
const validTypes = new Set(["instagram", "whatsapp", "messenger", "facebook"]);

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

function buildPayload(type: string, providerAccountId: string, message: string) {
  if (type === "whatsapp") {
    return {
      object: "whatsapp_business_account",
      entry: [
        {
          id: providerAccountId,
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                messages: [{ from: "919999999999", text: { body: message }, type: "text" }],
              },
            },
          ],
        },
      ],
    };
  }

  return {
    object: type === "instagram" ? "instagram" : "page",
    entry: [
      {
        id: providerAccountId,
        messaging: [{ sender: { id: "test_customer" }, recipient: { id: providerAccountId }, message: { text: message } }],
      },
    ],
  };
}

function signPayload(rawBody: string) {
  if (!process.env.META_APP_SECRET) return null;
  return `sha256=${crypto.createHmac("sha256", process.env.META_APP_SECRET).update(rawBody).digest("hex")}`;
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    await requireAdmin(token);

    const payload = (await request.json()) as { type?: string; providerAccountId?: string; message?: string };
    const type = payload.type?.toLowerCase() || "instagram";
    const providerAccountId = payload.providerAccountId?.trim();
    const message = payload.message?.trim() || "Hi, I want automation details.";

    if (!validTypes.has(type)) {
      return NextResponse.json({ error: "Valid provider type is required." }, { status: 400 });
    }

    if (!providerAccountId) {
      return NextResponse.json({ error: "Provider account ID is required." }, { status: 400 });
    }

    const webhookPayload = buildPayload(type, providerAccountId, message);
    const rawBody = JSON.stringify(webhookPayload);
    const signature = signPayload(rawBody);
    const webhookUrl = new URL("/api/provider/meta/webhook", request.url);
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(signature ? { "x-hub-signature-256": signature } : {}),
      },
      body: rawBody,
    });
    const result = (await response.json()) as { ok?: boolean; error?: string; stored?: boolean; inboxResult?: unknown };

    if (!response.ok || !result.ok) {
      throw new Error(result.error ?? "Test webhook failed.");
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send test webhook." },
      { status: 500 },
    );
  }
}
