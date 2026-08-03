import crypto from "crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
const appSecret = process.env.META_APP_SECRET?.trim();
const allowInvalidSignatureForTests = process.env.META_WEBHOOK_ACCEPT_INVALID_SIGNATURE_FOR_TESTS === "true";

function timingSafeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function isValidMetaSignature(rawBody: Buffer, signatureHeader: string | null, legacySignatureHeader: string | null) {
  if (!appSecret) {
    return {
      valid: true,
      configured: false,
      expectedPrefix: null,
      receivedPrefix: signatureHeader?.slice(0, 17) ?? null,
      legacyValid: false,
      expectedLegacyPrefix: null,
      receivedLegacyPrefix: legacySignatureHeader?.slice(0, 13) ?? null,
    };
  }

  const expected = signatureHeader?.startsWith("sha256=")
    ? `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex")}`
    : null;
  const sha256Valid = Boolean(expected && signatureHeader && timingSafeEqual(expected, signatureHeader));
  const expectedLegacy = legacySignatureHeader?.startsWith("sha1=")
    ? `sha1=${crypto.createHmac("sha1", appSecret).update(rawBody).digest("hex")}`
    : null;
  const legacyValid = Boolean(expectedLegacy && legacySignatureHeader && timingSafeEqual(expectedLegacy, legacySignatureHeader));

  return {
    valid: sha256Valid || legacyValid,
    configured: true,
    expectedPrefix: expected?.slice(0, 17) ?? null,
    receivedPrefix: signatureHeader?.slice(0, 17) ?? null,
    legacyValid,
    expectedLegacyPrefix: expectedLegacy?.slice(0, 13) ?? null,
    receivedLegacyPrefix: legacySignatureHeader?.slice(0, 13) ?? null,
  };
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

function compactUnique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]));
}

function getMessagingEvent(payload: MetaWebhookPayload) {
  return payload.entry?.[0]?.messaging?.[0] as
    | {
        sender?: { id?: string };
        recipient?: { id?: string };
        message?: { mid?: string; text?: string };
        postback?: { title?: string };
      }
    | undefined;
}

function getProviderAccountCandidates(payload: MetaWebhookPayload) {
  const entry = payload.entry?.[0];
  const changeValue = entry?.changes?.[0]?.value as
    | {
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        id?: string;
        page_id?: string;
        recipient_id?: string;
      }
    | undefined;
  const messagingEvent = getMessagingEvent(payload);

  return compactUnique([
    entry?.id,
    messagingEvent?.recipient?.id,
    changeValue?.id,
    changeValue?.page_id,
    changeValue?.recipient_id,
    changeValue?.metadata?.phone_number_id,
  ]);
}

function getChannelType(payload: MetaWebhookPayload) {
  if (payload.entry?.[0]?.changes?.[0]?.value?.messaging_product === "whatsapp") return "whatsapp";
  if (payload.object === "instagram") return "instagram";
  if (payload.object === "page") return "facebook";
  return "messenger";
}

function getChannelTypeCandidates(payload: MetaWebhookPayload) {
  if (payload.entry?.[0]?.changes?.[0]?.value?.messaging_product === "whatsapp") return ["whatsapp"];
  if (payload.object === "instagram") return ["instagram"];

  // Meta can deliver Instagram/Messenger events under object: "page" depending on the product subscription.
  // Prefer Instagram for Pasnex because the current live setup stores the Instagram business id as the channel handle.
  if (payload.object === "page" && payload.entry?.[0]?.messaging?.length) {
    return ["instagram", "messenger", "facebook"];
  }

  if (payload.object === "page") return ["facebook", "instagram", "messenger"];
  return [getChannelType(payload)];
}

function extractMessageText(payload: MetaWebhookPayload) {
  const entry = payload.entry?.[0];
  const changeValue = entry?.changes?.[0]?.value as
    | { messages?: unknown[]; text?: string; message?: string; comment_id?: string }
    | undefined;
  const whatsappMessage = changeValue?.messages?.[0] as { text?: { body?: string }; button?: { text?: string } } | undefined;
  const messagingEvent = getMessagingEvent(payload);

  return (
    whatsappMessage?.text?.body ||
    whatsappMessage?.button?.text ||
    messagingEvent?.message?.text ||
    messagingEvent?.postback?.title ||
    changeValue?.text ||
    changeValue?.message ||
    "Provider webhook event received."
  );
}

function extractProviderMessageId(payload: MetaWebhookPayload) {
  const entry = payload.entry?.[0];
  const changeValue = entry?.changes?.[0]?.value;
  const whatsappMessage = changeValue?.messages?.[0] as { id?: string } | undefined;
  const messagingEvent = getMessagingEvent(payload);

  return whatsappMessage?.id || messagingEvent?.message?.mid || null;
}

function extractProviderSenderId(payload: MetaWebhookPayload) {
  const entry = payload.entry?.[0];
  const changeValue = entry?.changes?.[0]?.value;
  const whatsappMessage = changeValue?.messages?.[0] as { from?: string } | undefined;
  const messagingEvent = getMessagingEvent(payload);

  return whatsappMessage?.from || messagingEvent?.sender?.id || null;
}

async function updateConversationProviderMapping(conversationId: string, recipientId: string | null, eventId: string | null) {
  if (!recipientId && !eventId) return;

  try {
    const supabase = createSupabaseAdminClient();
    await supabase
      .from("conversations")
      .update({
        provider_recipient_id: recipientId,
        provider_thread_id: recipientId,
        provider_last_event_id: eventId,
      })
      .eq("id", conversationId);
  } catch (error) {
    console.warn(
      "Provider recipient mapping skipped. Run docs/supabase-provider-outbound.sql before live outbound replies.",
      error instanceof Error ? error.message : error,
    );
  }
}

async function storeWebhookEvent(payload: MetaWebhookPayload, rawBody: string, signatureVerified: boolean) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("provider_webhook_events").insert({
      provider: "meta",
      event_type: detectEventType(payload),
      provider_account_id: getProviderAccountId(payload),
      signature_verified: signatureVerified,
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
  const providerAccountCandidates = getProviderAccountCandidates(payload);

  if (!providerAccountCandidates.length) {
    await updateWebhookProcessingStatus(
      eventId,
      "unmapped",
      "Meta payload did not include any provider account id candidates from entry.id, recipient.id, or metadata.",
    );
    return { processed: false, reason: "missing_provider_account_id" };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const channelTypeCandidates = getChannelTypeCandidates(payload);
    const { data: channels, error: channelError } = await supabase
      .from("channels")
      .select("id, business_id, type, handle")
      .in("type", channelTypeCandidates)
      .in("handle", providerAccountCandidates)
      .order("connected_at", { ascending: false })
      .returns<Array<{ id: string; business_id: string; type: string; handle: string | null }>>();

    if (channelError) {
      throw new Error(channelError.message);
    }

    const channel =
      channels?.find((item) => item.type === channelTypeCandidates[0]) ??
      channels?.find((item) => item.type === "instagram") ??
      channels?.[0] ??
      null;

    if (!channel) {
      await updateWebhookProcessingStatus(
        eventId,
        "unmapped",
        `No channel matched webhook. Tried types ${channelTypeCandidates.join(", ")} and provider IDs ${providerAccountCandidates.join(", ")}.`,
      );
      return { processed: false, reason: "channel_mapping_not_found" };
    }

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        business_id: channel.business_id,
        channel_id: channel.id,
        name: "Provider Test Lead",
        source: channel.type,
        status: "qualified",
        score: 78,
        interest: "Provider webhook test message",
        next_action: "Review mapped provider event in inbox",
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    if (leadError || !lead) {
      throw new Error(leadError?.message ?? "Webhook lead was not created.");
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        business_id: channel.business_id,
        channel_id: channel.id,
        lead_id: lead.id,
        status: "open",
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    if (conversationError || !conversation) {
      throw new Error(conversationError?.message ?? "Conversation was not created.");
    }

    const providerSenderId = extractProviderSenderId(payload);
    const providerMessageId = extractProviderMessageId(payload);
    await updateConversationProviderMapping(conversation.id, providerSenderId, eventId);

    const { error: messageError } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_type: "customer",
      message_text: `[Provider test event] ${extractMessageText(payload)}`,
      ai_generated: false,
      provider_message_id: providerMessageId,
      delivery_status: "received",
    });

    if (messageError) {
      const { error: fallbackMessageError } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_type: "customer",
        message_text: `[Provider test event] ${extractMessageText(payload)}`,
        ai_generated: false,
      });

      if (fallbackMessageError) {
        throw new Error(fallbackMessageError.message);
      }
    }

    if (eventId) {
      await updateWebhookProcessingStatus(
        eventId,
        "processed",
        providerSenderId
          ? `Inbox conversation created and recipient id ${providerSenderId} mapped for outbound replies.`
          : "Inbox conversation created. Recipient id was not found in the provider payload.",
        true,
      );
    }

    return { processed: true, reason: "conversation_created", recipientMapped: Boolean(providerSenderId) };
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
  const rawBodyBuffer = Buffer.from(await request.arrayBuffer());
  const rawBody = rawBodyBuffer.toString("utf8");
  const signature = request.headers.get("x-hub-signature-256");
  const legacySignature = request.headers.get("x-hub-signature");
  const signatureCheck = isValidMetaSignature(rawBodyBuffer, signature, legacySignature);

  if (!signatureCheck.valid) {
    console.warn("Invalid Meta webhook signature", {
      appSecretConfigured: Boolean(appSecret),
      invalidSignatureTestBypassEnabled: allowInvalidSignatureForTests,
      signatureHeaderPresent: Boolean(signature),
      signatureHeaderFormatValid: Boolean(signature?.startsWith("sha256=")),
      legacySignatureHeaderPresent: Boolean(legacySignature),
      expectedSignaturePrefix: signatureCheck.expectedPrefix,
      receivedSignaturePrefix: signatureCheck.receivedPrefix,
      legacySignatureValid: signatureCheck.legacyValid,
      expectedLegacySignaturePrefix: signatureCheck.expectedLegacyPrefix,
      receivedLegacySignaturePrefix: signatureCheck.receivedLegacyPrefix,
      rawBodyLength: rawBodyBuffer.length,
      rawBodySha256Prefix: crypto.createHash("sha256").update(rawBodyBuffer).digest("hex").slice(0, 10),
      receivedAt: new Date().toISOString(),
    });

    if (!allowInvalidSignatureForTests) {
      return NextResponse.json({ error: "Invalid Meta webhook signature." }, { status: 401 });
    }
  }

  let payload: MetaWebhookPayload = {};
  try {
    payload = rawBody ? (JSON.parse(rawBody) as MetaWebhookPayload) : {};
  } catch {
    return NextResponse.json({ error: "Invalid webhook JSON payload." }, { status: 400 });
  }

  const storedEventId = await storeWebhookEvent(payload, rawBody, signatureCheck.valid);
  const inboxResult = await createInboxMessageFromWebhook(payload, storedEventId);

  console.log("Meta webhook received", {
    signatureConfigured: signatureCheck.configured,
    stored: Boolean(storedEventId),
    inboxResult,
    eventType: detectEventType(payload),
    providerAccountCandidates: getProviderAccountCandidates(payload),
    channelTypeCandidates: getChannelTypeCandidates(payload),
    receivedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, stored: Boolean(storedEventId), inboxResult, eventType: detectEventType(payload) });
}
