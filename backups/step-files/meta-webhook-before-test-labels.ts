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

type StoredWebhookEvent = {
  id: string;
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

function getChannelType(payload: MetaWebhookPayload) {
  if (payload.entry?.[0]?.changes?.[0]?.value?.messaging_product === "whatsapp") return "whatsapp";
  if (payload.object === "instagram") return "instagram";
  if (payload.object === "page") return "facebook";
  return "messenger";
}

function extractMessageText(payload: MetaWebhookPayload) {
  const entry = payload.entry?.[0];
  const changeValue = entry?.changes?.[0]?.value;
  const whatsappMessage = changeValue?.messages?.[0] as { text?: { body?: string }; button?: { text?: string } } | undefined;
  const messagingEvent = entry?.messaging?.[0] as { message?: { text?: string }; postback?: { title?: string } } | undefined;

  return (
    whatsappMessage?.text?.body ||
    whatsappMessage?.button?.text ||
    messagingEvent?.message?.text ||
    messagingEvent?.postback?.title ||
    "Provider webhook event received."
  );
}

async function storeWebhookEvent(payload: MetaWebhookPayload, rawBody: string, signatureConfigured: boolean) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("provider_webhook_events").insert({
      provider: "meta",
      event_type: detectEventType(payload),
      provider_account_id: getProviderAccountId(payload),
      signature_verified: signatureConfigured,
      processing_status: "received",
      processing_note: "Webhook received and queued for inbox mapping.",
      payload,
      raw_body: rawBody,
    }).select("id").maybeSingle<StoredWebhookEvent>();

    if (error) {
      console.warn("Meta webhook event was received but not stored", error.message);
      return null;
    }

    return data?.id ?? null;
  } catch (error) {
    console.warn("Meta webhook event storage skipped", error instanceof Error ? error.message : error);
    return null;
  }
}

async function updateWebhookProcessingStatus(eventId: string | null, status: string, note: string, processed = false) {
  if (!eventId) return;

  try {
    const supabase = createSupabaseAdminClient();
    await supabase
      .from("provider_webhook_events")
      .update({
        processing_status: status,
        processing_note: note,
        processed_at: processed ? new Date().toISOString() : null,
      })
      .eq("id", eventId);
  } catch (error) {
    console.warn("Provider webhook processing status update skipped", error instanceof Error ? error.message : error);
  }
}

async function createInboxMessageFromWebhook(payload: MetaWebhookPayload, eventId: string | null) {
  const providerAccountId = getProviderAccountId(payload);

  if (!providerAccountId) {
    await updateWebhookProcessingStatus(eventId, "unmapped", "Meta payload did not include an entry.id provider account id.");
    return { processed: false, reason: "missing_provider_account_id" };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const channelType = getChannelType(payload);
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("id, business_id, type")
      .eq("type", channelType)
      .eq("handle", providerAccountId)
      .maybeSingle<{ id: string; business_id: string; type: string }>();

    if (channelError) {
      throw new Error(channelError.message);
    }

    if (!channel) {
      await updateWebhookProcessingStatus(
        eventId,
        "unmapped",
        `No ${channelType} channel has handle/provider account id ${providerAccountId}.`,
      );
      return { processed: false, reason: "channel_mapping_not_found" };
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        business_id: channel.business_id,
        channel_id: channel.id,
        status: "open",
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    if (conversationError || !conversation) {
      throw new Error(conversationError?.message ?? "Conversation was not created.");
    }

    const { error: messageError } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_type: "customer",
      message_text: extractMessageText(payload),
      ai_generated: false,
    });

    if (messageError) {
      throw new Error(messageError.message);
    }

    if (eventId) {
      await updateWebhookProcessingStatus(eventId, "processed", "Inbox conversation and customer message created.", true);
    }

    return { processed: true, reason: "conversation_created" };
  } catch (error) {
    console.warn("Meta webhook inbox pipeline skipped", error instanceof Error ? error.message : error);
    await updateWebhookProcessingStatus(
      eventId,
      "failed",
      error instanceof Error ? error.message : "Webhook inbox pipeline failed.",
    );
    return { processed: false, reason: "pipeline_error" };
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

  const storedEventId = await storeWebhookEvent(payload, rawBody, signatureCheck.configured);
  const inboxResult = await createInboxMessageFromWebhook(payload, storedEventId);

  console.log("Meta webhook received", {
    signatureConfigured: signatureCheck.configured,
    stored: Boolean(storedEventId),
    inboxResult,
    eventType: detectEventType(payload),
    receivedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, stored: Boolean(storedEventId), inboxResult, eventType: detectEventType(payload) });
}
