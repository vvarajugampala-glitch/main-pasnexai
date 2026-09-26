import crypto from "crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildProviderOutboundPlan,
  dispatchMetaOutboundMessage,
  type ProviderDispatchResult,
  type ProviderOutboundInput,
} from "@/lib/provider-outbound";

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
        id?: string;
        comment_id?: string;
        text?: string;
        message?: string | { text?: string };
        from?: { id?: string; username?: string; name?: string };
        media?: { id?: string };
        post_id?: string;
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
  const entryId = payload.entry?.[0]?.id?.trim();
  if (entryId && entryId !== "0") return entryId;

  return getProviderAccountCandidates(payload)[0] ?? entryId ?? null;
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

function extractCommentDetails(payload: MetaWebhookPayload) {
  const changeValue = payload.entry?.[0]?.changes?.[0]?.value as
    | {
        id?: string;
        comment_id?: string;
        text?: string;
        message?: string | { text?: string };
        from?: { id?: string; username?: string; name?: string };
        media?: { id?: string };
        post_id?: string;
        item?: string;
        verb?: string;
      }
    | undefined;

  const changeMessageText =
    typeof changeValue?.message === "string" ? changeValue.message : changeValue?.message?.text;

  const isComment = changeValue?.item === "comment" || Boolean(changeValue?.comment_id) || Boolean(changeValue?.text && changeValue?.id);
  const commentId = changeValue?.comment_id || (isComment ? changeValue?.id : null) || null;
  const commentText = changeValue?.text || changeMessageText || null;
  const commenterId = changeValue?.from?.id || null;
  const defaultUser = payload.object === "instagram" ? "Instagram User" : "Facebook User";
  const commenterName = changeValue?.from?.name || changeValue?.from?.username || defaultUser;
  const postId = changeValue?.post_id || changeValue?.media?.id || null;

  return { commentId, commentText, commenterId, commenterName, postId, isComment };
}

function getProviderAccountCandidates(payload: MetaWebhookPayload) {
  const entry = payload.entry?.[0];
  const changeValue = entry?.changes?.[0]?.value as
    | {
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        id?: string;
        page_id?: string;
        recipient_id?: string;
        recipient?: { id?: string };
        sender?: { id?: string };
      }
    | undefined;
  const messagingEvent = getMessagingEvent(payload);

  return compactUnique([
    entry?.id,
    messagingEvent?.recipient?.id,
    changeValue?.recipient?.id,
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

  const messagingEvent = getMessagingEvent(payload);
  const mid = messagingEvent?.message?.mid;
  const isInstagramMessaging = Boolean(mid && (mid.startsWith("aWdf") || mid.includes("ig_") || mid.startsWith("IG")));

  if (isInstagramMessaging) {
    return ["instagram"];
  }

  if (payload.object === "page" && payload.entry?.[0]?.messaging?.length) {
    return ["messenger", "facebook"];
  }

  if (payload.object === "page") return ["facebook", "messenger"];
  return [getChannelType(payload)];
}

function extractMessageText(payload: MetaWebhookPayload) {
  const entry = payload.entry?.[0];
  const changeValue = entry?.changes?.[0]?.value as
    | {
        messages?: unknown[];
        text?: string;
        message?: string | { text?: string };
        comment_id?: string;
      }
    | undefined;
  const whatsappMessage = changeValue?.messages?.[0] as { text?: { body?: string }; button?: { text?: string } } | undefined;
  const messagingEvent = getMessagingEvent(payload);
  const changeMessageText =
    typeof changeValue?.message === "string" ? changeValue.message : changeValue?.message?.text;

  return (
    whatsappMessage?.text?.body ||
    whatsappMessage?.button?.text ||
    messagingEvent?.message?.text ||
    messagingEvent?.postback?.title ||
    changeValue?.text ||
    changeMessageText ||
    "Provider webhook event received."
  );
}

function extractProviderMessageId(payload: MetaWebhookPayload) {
  const entry = payload.entry?.[0];
  const changeValue = entry?.changes?.[0]?.value as
    | { message?: { mid?: string; id?: string }; messages?: unknown[] }
    | undefined;
  const whatsappMessage = changeValue?.messages?.[0] as { id?: string } | undefined;
  const messagingEvent = getMessagingEvent(payload);

  return whatsappMessage?.id || messagingEvent?.message?.mid || changeValue?.message?.mid || changeValue?.message?.id || null;
}

function extractProviderSenderId(payload: MetaWebhookPayload) {
  const entry = payload.entry?.[0];
  const changeValue = entry?.changes?.[0]?.value as
    | { sender?: { id?: string }; messages?: unknown[]; from?: { id?: string } }
    | undefined;
  const whatsappMessage = changeValue?.messages?.[0] as { from?: string } | undefined;
  const messagingEvent = getMessagingEvent(payload);

  return whatsappMessage?.from || messagingEvent?.sender?.id || changeValue?.from?.id || changeValue?.sender?.id || null;
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
      "Provider recipient mapping skipped.",
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
      .select("id, business_id, type, handle, access_token_encrypted")
      .in("type", channelTypeCandidates)
      .in("handle", providerAccountCandidates)
      .order("connected_at", { ascending: false })
      .returns<Array<{ id: string; business_id: string; type: string; handle: string | null; access_token_encrypted: string | null }>>();

    if (channelError) {
      throw new Error(channelError.message);
    }

    type ChannelRecord = { id: string; business_id: string; type: string; handle: string | null; access_token_encrypted: string | null };

    let channel: ChannelRecord | null = null;
    for (const typeCandidate of channelTypeCandidates) {
      const match = channels?.find((item) => item.type === typeCandidate);
      if (match) {
        channel = match;
        break;
      }
    }
    if (!channel) {
      channel = channels?.[0] ?? null;
    }

    if (!channel) {
      const { data: fallbackChannels } = await supabase
        .from("channels")
        .select("id, business_id, type, handle, access_token_encrypted")
        .in("type", channelTypeCandidates)
        .order("connected_at", { ascending: false, nullsFirst: false })
        .returns<Array<{ id: string; business_id: string; type: string; handle: string | null; access_token_encrypted: string | null }>>();

      for (const typeCandidate of channelTypeCandidates) {
        const match = fallbackChannels?.find((item) => item.type === typeCandidate);
        if (match) {
          channel = match;
          break;
        }
      }
      if (!channel) {
        channel = fallbackChannels?.[0] ?? null;
      }

      if (channel && providerAccountCandidates[0]) {
        await supabase
          .from("channels")
          .update({
            handle: providerAccountCandidates[0],
            status: channel.access_token_encrypted ? "connected" : "ready_to_connect",
            updated_at: new Date().toISOString(),
          })
          .eq("id", channel.id);
      }
    }

    if (!channel) {
      await updateWebhookProcessingStatus(
        eventId,
        "unmapped",
        `No channel matched webhook. Tried types ${channelTypeCandidates.join(", ")} and provider IDs ${providerAccountCandidates.join(", ")}.`,
      );
      return { processed: false, reason: "channel_mapping_not_found" };
    }

    const providerSenderId = extractProviderSenderId(payload);
    const commentDetails = extractCommentDetails(payload);
    const incomingText = commentDetails.commentText || extractMessageText(payload);
    const isCommentEvent = detectEventType(payload).includes("comments") || detectEventType(payload).includes("feed") || commentDetails.isComment || Boolean(commentDetails.commentId);

    const nextAction = isCommentEvent
      ? channel.type === "facebook"
        ? "Respond via Facebook Messenger DM"
        : "Respond via Instagram DM"
      : "Review mapped provider event in inbox";

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        business_id: channel.business_id,
        channel_id: channel.id,
        name: commentDetails.commenterName || (channel.type === "facebook" ? "Facebook Visitor" : "Instagram Visitor"),
        source: channel.type,
        status: "qualified",
        score: 80,
        interest: incomingText.slice(0, 100),
        next_action: nextAction,
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

    const providerMessageId = extractProviderMessageId(payload);
    await updateConversationProviderMapping(conversation.id, providerSenderId, eventId);

    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_type: "customer",
      message_text: incomingText,
      ai_generated: false,
      provider_message_id: providerMessageId,
      delivery_status: "received",
    });

    // --- AUTOMATION MATCHING & EXECUTION ---
    const { data: automations } = await supabase
      .from("automations")
      .select("id, name, trigger_type, config_json")
      .eq("business_id", channel.business_id)
      .eq("status", "active");

    const matchedAutomation = automations?.find((automation) => {
      const config = (automation.config_json ?? {}) as {
        keyword?: string;
        post_id?: string;
        channel_type?: string;
      };

      const isMetaPageChannel = (type?: string) => type === "facebook" || type === "messenger";
      if (
        config.channel_type &&
        config.channel_type !== "all" &&
        config.channel_type !== channel.type &&
        !(isMetaPageChannel(config.channel_type) && isMetaPageChannel(channel.type))
      ) {
        return false;
      }

      if (isCommentEvent) {
        if (!["comment_received", "comment_to_dm", "keyword_or_message"].includes(automation.trigger_type)) {
          return false;
        }
      } else {
        if (!["message_received", "keyword_or_message", "ai_chat_started"].includes(automation.trigger_type)) {
          return false;
        }
      }

      if (config.post_id && commentDetails.postId && config.post_id !== commentDetails.postId) {
        return false;
      }

      if (config.keyword && config.keyword !== "*") {
        return incomingText.toLowerCase().includes(config.keyword.toLowerCase());
      }

      return true;
    });

    let automationResult: { executed: boolean; automationName?: string; dispatchStatus?: string } = { executed: false };

    if (matchedAutomation) {
      const config = (matchedAutomation.config_json ?? {}) as {
        automated_dm?: string;
        response_message?: string;
        dm_text?: string;
      };

      const replyText =
        config.automated_dm ||
        config.response_message ||
        config.dm_text ||
        "Thanks for your comment! We've sent you a direct message.";

      const outboundInput: ProviderOutboundInput = {
        channelType: channel.type,
        providerAccountId: channel.handle,
        recipientId: providerSenderId,
        commentId: commentDetails.commentId,
        messageText: replyText,
      };

      const outboundPlan = buildProviderOutboundPlan(outboundInput);
      let dispatchResult: ProviderDispatchResult = {
        attempted: false,
        sent: false,
        status: "disabled",
        providerMessageId: null,
        response: null,
        error: channel.access_token_encrypted ? "Live provider dispatch disabled via env" : "Channel access token missing",
      };

      if (channel.access_token_encrypted && outboundPlan.ready) {
        dispatchResult = await dispatchMetaOutboundMessage({
          outboundPlan,
          encryptedAccessToken: channel.access_token_encrypted,
        });
      }

      await supabase.from("provider_outbound_messages").insert({
        business_id: channel.business_id,
        conversation_id: conversation.id,
        channel_id: channel.id,
        provider: "meta",
        channel_type: channel.type,
        recipient_id: providerSenderId || commentDetails.commentId,
        endpoint: outboundPlan.endpoint,
        payload: outboundPlan.payload ?? {},
        status: dispatchResult.status,
        provider_response: dispatchResult.response ?? {},
        error_message: dispatchResult.error,
        sent_at: dispatchResult.sent ? new Date().toISOString() : null,
      });

      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_type: "ai",
        message_text: replyText,
        ai_generated: true,
        provider_message_id: dispatchResult.providerMessageId,
        delivery_status: dispatchResult.status,
      });

      automationResult = {
        executed: true,
        automationName: matchedAutomation.name,
        dispatchStatus: dispatchResult.status,
      };
    }

    if (eventId) {
      await updateWebhookProcessingStatus(
        eventId,
        matchedAutomation ? "automation_executed" : "processed",
        matchedAutomation
          ? `Automation "${matchedAutomation.name}" executed. Outbound dispatch status: ${automationResult.dispatchStatus}.`
          : providerSenderId
            ? `Inbox conversation created and recipient id ${providerSenderId} mapped.`
            : "Inbox conversation created.",
        true,
      );
    }

    return {
      processed: true,
      reason: "conversation_created",
      recipientMapped: Boolean(providerSenderId),
      automationResult,
    };
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
