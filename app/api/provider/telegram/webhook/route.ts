import { NextResponse } from "next/server";
import {
  buildProviderOutboundPlan,
  dispatchTelegramOutboundMessage,
  type ProviderDispatchResult,
  type ProviderOutboundInput,
} from "@/lib/provider-outbound";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTelegramWebhookSecret } from "../connect/route";

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot?: boolean;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      title?: string;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
    date: number;
    text?: string;
  };
};

export async function POST(request: Request) {
  try {
    // 1. Verify Telegram Secret Token Header
    const secretHeader = request.headers.get("x-telegram-bot-api-secret-token");
    const expectedSecret = getTelegramWebhookSecret();

    if (!secretHeader || secretHeader !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized Telegram webhook signature." }, { status: 401 });
    }

    const payload = (await request.json().catch(() => ({}))) as TelegramUpdate;

    const msg = payload.message;
    if (!payload.update_id || !msg || !msg.text) {
      return NextResponse.json({ ok: true, ignored: true, note: "Non-text or unsupported Telegram update ignored." });
    }

    const chatId = String(msg.chat.id);
    const messageId = String(msg.message_id);
    const incomingText = msg.text.trim();
    const senderId = msg.from?.id ? String(msg.from.id) : chatId;

    const senderName = msg.from?.username
      ? `@${msg.from.username}`
      : [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") || "Telegram User";

    const supabase = createSupabaseAdminClient();

    // 2. Store Webhook Event for Audit
    const { data: storedEvent } = await supabase
      .from("provider_webhook_events")
      .insert({
        provider: "telegram",
        event_type: "telegram.message",
        provider_account_id: chatId,
        signature_verified: true,
        processing_status: "received",
        processing_note: "Telegram update received and queued.",
        payload: payload as unknown as Record<string, unknown>,
        raw_body: JSON.stringify(payload),
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    const eventId = storedEvent?.id ?? null;

    // 3. Resolve Telegram Channel
    const { data: channels, error: channelError } = await supabase
      .from("channels")
      .select("id, business_id, type, handle, access_token_encrypted")
      .eq("type", "telegram")
      .not("access_token_encrypted", "is", null)
      .order("connected_at", { ascending: false })
      .returns<Array<{ id: string; business_id: string; type: string; handle: string | null; access_token_encrypted: string | null }>>();

    if (channelError) {
      throw new Error(`Telegram channel lookup failed: ${channelError.message}`);
    }

    const channel = channels?.[0] ?? null;

    if (!channel || !channel.access_token_encrypted) {
      if (eventId) {
        await supabase
          .from("provider_webhook_events")
          .update({
            processing_status: "unmapped",
            processing_note: "No active Telegram channel with encrypted token found.",
          })
          .eq("id", eventId);
      }
      return NextResponse.json({ ok: true, note: "No active Telegram channel configured." });
    }

    // 4. Idempotency Check (Prevent duplicates on retries)
    const { data: existingMsg } = await supabase
      .from("messages")
      .select("id")
      .eq("provider_message_id", messageId)
      .maybeSingle();

    if (existingMsg) {
      if (eventId) {
        await supabase
          .from("provider_webhook_events")
          .update({
            processing_status: "processed",
            processing_note: `Duplicate Telegram message_id ${messageId} ignored.`,
            processed_at: new Date().toISOString(),
          })
          .eq("id", eventId);
      }
      return NextResponse.json({ ok: true, duplicate: true });
    }

    // 5. Create Lead, Conversation, and Message
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        business_id: channel.business_id,
        channel_id: channel.id,
        name: senderName,
        source: "telegram",
        status: "qualified",
        score: 80,
        interest: incomingText.slice(0, 100),
        next_action: "Respond via Telegram Bot",
      })
      .select("id")
      .single<{ id: string }>();

    if (leadError || !lead) {
      throw new Error(`Telegram lead creation failed: ${leadError?.message ?? "unknown error"}`);
    }

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        business_id: channel.business_id,
        channel_id: channel.id,
        lead_id: lead.id,
        status: "open",
        provider_recipient_id: chatId,
        provider_thread_id: chatId,
        provider_last_event_id: eventId,
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single<{ id: string }>();

    if (convError || !conversation) {
      throw new Error(`Telegram conversation creation failed: ${convError?.message ?? "unknown error"}`);
    }

    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_type: "customer",
      message_text: incomingText,
      ai_generated: false,
      provider_message_id: messageId,
      delivery_status: "received",
    });

    // 6. Automation Engine Matching
    const { data: automations } = await supabase
      .from("automations")
      .select("id, name, trigger_type, config_json")
      .eq("business_id", channel.business_id)
      .eq("status", "active");

    const matchedAutomation = automations?.find((automation) => {
      const config = (automation.config_json ?? {}) as {
        keyword?: string;
        channel_type?: string;
      };

      if (config.channel_type && config.channel_type !== "all" && config.channel_type !== "telegram") {
        return false;
      }

      if (!["message_received", "keyword_or_message", "ai_chat_started"].includes(automation.trigger_type)) {
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
        "Thanks for your message! Our team will get back to you shortly.";

      const outboundInput: ProviderOutboundInput = {
        channelType: "telegram",
        providerAccountId: channel.handle,
        recipientId: chatId,
        messageText: replyText,
      };

      const outboundPlan = buildProviderOutboundPlan(outboundInput);
      let dispatchResult: ProviderDispatchResult = {
        attempted: false,
        sent: false,
        status: "disabled",
        providerMessageId: null,
        response: null,
        error: "Channel access token missing",
      };

      if (channel.access_token_encrypted && outboundPlan.ready) {
        dispatchResult = await dispatchTelegramOutboundMessage({
          outboundPlan,
          encryptedAccessToken: channel.access_token_encrypted,
        });
      }

      await supabase.from("provider_outbound_messages").insert({
        business_id: channel.business_id,
        conversation_id: conversation.id,
        channel_id: channel.id,
        provider: "telegram",
        channel_type: "telegram",
        recipient_id: chatId,
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
      await supabase
        .from("provider_webhook_events")
        .update({
          processing_status: matchedAutomation ? "automation_executed" : "processed",
          processing_note: matchedAutomation
            ? `Telegram automation "${matchedAutomation.name}" executed. Outbound status: ${automationResult.dispatchStatus}.`
            : `Telegram conversation created for chat_id ${chatId}.`,
          processed_at: new Date().toISOString(),
        })
        .eq("id", eventId);
    }

    return NextResponse.json({
      ok: true,
      chatId,
      conversationId: conversation.id,
      automationExecuted: automationResult.executed,
    });
  } catch (error) {
    console.warn("Telegram webhook error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: true, error: error instanceof Error ? error.message : "Webhook processing failed" });
  }
}
