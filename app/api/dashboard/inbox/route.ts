import { NextResponse } from "next/server";
import { buildProviderOutboundPlan, dispatchMetaOutboundMessage, type ProviderDispatchResult } from "@/lib/provider-outbound";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ConversationWithLeadScore = {
  id: string;
  lead_id: string | null;
  provider_recipient_id?: string | null;
  channel_id?: string | null;
  leads?: { score: number | null } | { score: number | null }[] | null;
  channels?:
    | {
        id: string;
        type: string;
        status: string;
        handle: string | null;
        webhook_status: string | null;
        access_token_encrypted: string | null;
      }
    | {
        id: string;
        type: string;
        status: string;
        handle: string | null;
        webhook_status: string | null;
        access_token_encrypted: string | null;
      }[]
    | null;
};

type InboxConversationRow = {
  id: string;
  status: string;
  last_message_at: string | null;
  created_at: string;
  channels:
    | {
        type: string;
        display_name: string | null;
        status: string;
        webhook_status: string | null;
        access_token_encrypted: string | null;
      }
    | {
        type: string;
        display_name: string | null;
        status: string;
        webhook_status: string | null;
        access_token_encrypted: string | null;
      }[]
    | null;
  leads:
    | {
        id: string;
        name: string | null;
        status: string | null;
        score: number | null;
        interest: string | null;
        next_action: string | null;
      }
    | {
        id: string;
        name: string | null;
        status: string | null;
        score: number | null;
        interest: string | null;
        next_action: string | null;
      }[]
    | null;
};

type InboxMessageRow = {
  id: string;
  conversation_id: string;
  sender_type: string;
  message_text: string;
  ai_generated: boolean;
  created_at: string;
};

function getLeadScore(conversation: ConversationWithLeadScore) {
  const lead = Array.isArray(conversation.leads) ? conversation.leads[0] : conversation.leads;
  return Number(lead?.score ?? 0);
}

function getConversationChannel(conversation: ConversationWithLeadScore) {
  return Array.isArray(conversation.channels) ? conversation.channels[0] : conversation.channels;
}

function getProviderSendStatus(conversation: ConversationWithLeadScore, messageText: string) {
  const channel = getConversationChannel(conversation);

  if (!channel) {
    return {
      status: "not_sent",
      note: "Provider send skipped because this conversation is not mapped to a channel.",
    };
  }

  const outboundPlan = buildProviderOutboundPlan({
    channelType: channel.type,
    providerAccountId: channel.handle,
    recipientId: conversation.provider_recipient_id,
    messageText,
  });

  if (!channel.access_token_encrypted) {
    return {
      status: "setup_pending",
      note: `${channel.type} provider token is not ready yet for channel ${channel.id} (${channel.handle ?? "no provider id"}). Reply was saved internally only.`,
      outboundPlan,
    };
  }

  if (channel.status !== "connected" || channel.webhook_status !== "live") {
    return {
      status: "approval_pending",
      note: `${channel.type} token exists, but provider approval/webhook live status is still pending. Reply was saved internally only.`,
      outboundPlan,
    };
  }

  if (!outboundPlan.ready) {
    return {
      status: "recipient_mapping_pending",
      note: outboundPlan.blocker ?? `${channel.type} outbound send is waiting for recipient mapping.`,
      outboundPlan,
    };
  }

  return {
    status: "ready_to_send",
    note: `${channel.type} provider payload is ready. Live API dispatch will be enabled after provider approval checks.`,
    outboundPlan,
  };
}

async function refreshConversationChannelForProviderSend(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  businessId: string,
  conversation: ConversationWithLeadScore,
) {
  const currentChannel = getConversationChannel(conversation);

  if (currentChannel?.access_token_encrypted || !currentChannel) {
    return conversation;
  }

  const tokenChannelQuery = supabase
    .from("channels")
    .select("id, type, status, handle, webhook_status, access_token_encrypted")
    .eq("business_id", businessId)
    .eq("type", currentChannel.type)
    .not("access_token_encrypted", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1);

  let { data: tokenChannel } = currentChannel.handle
    ? await tokenChannelQuery.eq("handle", currentChannel.handle).maybeSingle()
    : await tokenChannelQuery.maybeSingle();

  if (!tokenChannel?.access_token_encrypted && currentChannel.handle) {
    const fallbackResult = await supabase
      .from("channels")
      .select("id, type, status, handle, webhook_status, access_token_encrypted")
      .eq("business_id", businessId)
      .eq("type", currentChannel.type)
      .not("access_token_encrypted", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    tokenChannel = fallbackResult.data;
  }

  if (!tokenChannel?.access_token_encrypted) {
    return conversation;
  }

  if (tokenChannel.id !== conversation.channel_id) {
    await supabase
      .from("conversations")
      .update({ channel_id: tokenChannel.id })
      .eq("id", conversation.id)
      .eq("business_id", businessId);
  }

  return {
    ...conversation,
    channel_id: tokenChannel.id,
    channels: tokenChannel,
  };
}

async function logProviderOutboundAttempt(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  businessId: string,
  conversation: ConversationWithLeadScore,
  messageId: string | null,
  providerStatus: ReturnType<typeof getProviderSendStatus>,
  dispatchResult?: ProviderDispatchResult,
) {
  const channel = getConversationChannel(conversation);
  const outboundPlan = providerStatus.outboundPlan;

  if (!channel || !outboundPlan) return;

  try {
    await supabase.from("provider_outbound_messages").insert({
      business_id: businessId,
      conversation_id: conversation.id,
      channel_id: channel.id,
      message_id: messageId,
      provider: outboundPlan.provider,
      channel_type: channel.type,
      recipient_id: conversation.provider_recipient_id ?? null,
      endpoint: outboundPlan.endpoint,
      payload: outboundPlan.payload ?? {},
      status:
        dispatchResult?.status === "sent"
          ? "sent"
          : dispatchResult?.status === "failed"
            ? "send_failed"
            : providerStatus.status,
      error_message:
        dispatchResult?.error ??
        (providerStatus.status === "ready_to_send" ? null : providerStatus.note),
      provider_response: dispatchResult?.response ?? {},
    });
  } catch (error) {
    console.warn(
      "Provider outbound log skipped. Confirm docs/supabase-provider-outbound.sql has been run.",
      error instanceof Error ? error.message : error,
    );
  }
}

async function getBusinessContext(token: string) {
  const supabase = createSupabaseAdminClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    throw new Error("Invalid session.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("business_id, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Inbox profile lookup failed", {
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code,
      userId: user.id,
      email: user.email,
    });
    throw new Error(profileError.message);
  }

  if (profile?.business_id) {
    return { supabase, businessId: profile.business_id };
  }

  const email = user.email ?? profile?.email ?? null;

  console.error("Inbox business profile not found", {
    userId: user.id,
    email,
    hasProfile: Boolean(profile),
  });

  throw new Error("Business profile not found.");
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { supabase, businessId } = await getBusinessContext(token);
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("id, status, last_message_at, created_at, channels(type, display_name, status, webhook_status, access_token_encrypted), leads(id, name, status, score, interest, next_action)")
      .eq("business_id", businessId)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("Inbox conversations query failed", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        businessId,
      });
      throw new Error(error.message);
    }

    const conversationRows = (conversations ?? []) as InboxConversationRow[];
    const conversationIds = conversationRows.map((conversation) => conversation.id);
    const messagesByConversation = new Map<string, InboxMessageRow[]>();

    if (conversationIds.length > 0) {
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_type, message_text, ai_generated, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Inbox messages query failed", {
          message: messagesError.message,
          details: messagesError.details,
          hint: messagesError.hint,
          code: messagesError.code,
          businessId,
        });
        throw new Error(messagesError.message);
      }

      for (const message of (messages ?? []) as InboxMessageRow[]) {
        const existing = messagesByConversation.get(message.conversation_id) ?? [];
        existing.push(message);
        messagesByConversation.set(message.conversation_id, existing);
      }
    }

    const safeConversations = conversationRows.map((conversation) => {
      const channel = Array.isArray(conversation.channels) ? conversation.channels[0] : conversation.channels;

      return {
        ...conversation,
        messages: messagesByConversation.get(conversation.id) ?? [],
        channels: channel
          ? {
              type: channel.type,
              display_name: channel.display_name,
              status: channel.status,
              webhook_status: channel.webhook_status,
              has_token: Boolean(channel.access_token_encrypted),
            }
          : null,
      };
    });

    return NextResponse.json({ conversations: safeConversations });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load inbox." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { supabase, businessId } = await getBusinessContext(token);
    const { data: channel } = await supabase
      .from("channels")
      .select("id, type")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        business_id: businessId,
        channel_id: channel?.id ?? null,
        name: "Sample Inbox Lead",
        phone: "+91 90000 00001",
        email: "inbox-lead@example.com",
        source: channel?.type ?? "instagram",
        status: "qualified",
        score: 84,
        interest: "AI reply automation",
        next_action: "Send demo link",
      })
      .select("id")
      .single();

    if (leadError || !lead) {
      throw new Error(leadError?.message ?? "Could not create lead.");
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        business_id: businessId,
        channel_id: channel?.id ?? null,
        lead_id: lead.id,
        status: "open",
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (conversationError || !conversation) {
      throw new Error(conversationError?.message ?? "Could not create conversation.");
    }

    const { error: messagesError } = await supabase.from("messages").insert([
      {
        conversation_id: conversation.id,
        sender_type: "customer",
        message_text: "Hi, can Pasnex.ai reply to social messages automatically?",
        ai_generated: false,
      },
      {
        conversation_id: conversation.id,
        sender_type: "ai",
        message_text: "Yes. Pasnex.ai can prepare reply workflows, qualify leads, and route conversations to your team after API approval.",
        ai_generated: true,
      },
    ]);

    if (messagesError) {
      await supabase.from("conversations").delete().eq("id", conversation.id);
      await supabase.from("leads").delete().eq("id", lead.id);
      throw new Error(messagesError.message);
    }

    return NextResponse.json({ ok: true, conversationId: conversation.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create test conversation." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { supabase, businessId } = await getBusinessContext(token);
    const body = (await request.json()) as {
      action?: string;
      conversationId?: string;
      messageText?: string;
    };

    if (!body.conversationId) {
      return NextResponse.json({ error: "Conversation is required." }, { status: 400 });
    }

    let { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id, channel_id, lead_id, provider_recipient_id, leads(score), channels(id, type, status, handle, webhook_status, access_token_encrypted)")
      .eq("id", body.conversationId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (conversationError?.message.includes("provider_recipient_id")) {
      const fallbackResult = await supabase
        .from("conversations")
        .select("id, channel_id, lead_id, leads(score), channels(id, type, status, handle, webhook_status, access_token_encrypted)")
        .eq("id", body.conversationId)
        .eq("business_id", businessId)
        .maybeSingle();

      conversation = fallbackResult.data ? { ...fallbackResult.data, provider_recipient_id: null } : null;
      conversationError = fallbackResult.error;
    }

    if (conversationError || !conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }
    let selectedConversation = conversation as ConversationWithLeadScore;

    if (body.action === "send_message") {
      const messageText = body.messageText?.trim();

      if (!messageText) {
        return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
      }

      selectedConversation = await refreshConversationChannelForProviderSend(supabase, businessId, selectedConversation);

      const now = new Date().toISOString();
      const { data: savedMessage, error: messageError } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_type: "agent",
        message_text: messageText,
        ai_generated: false,
        created_at: now,
      }).select("id").maybeSingle<{ id: string }>();

      if (messageError) {
        throw new Error(messageError.message);
      }

      await supabase.from("conversations").update({ last_message_at: now }).eq("id", conversation.id);
      const providerStatus = getProviderSendStatus(selectedConversation, messageText);
      const channel = getConversationChannel(selectedConversation);
      const dispatchResult =
        providerStatus.status === "ready_to_send" && channel?.access_token_encrypted && providerStatus.outboundPlan
          ? await dispatchMetaOutboundMessage({
              outboundPlan: providerStatus.outboundPlan,
              encryptedAccessToken: channel.access_token_encrypted,
            })
          : undefined;
      const providerNote =
        dispatchResult?.status === "sent"
          ? `${channel?.type ?? "Provider"} reply delivered to the real provider API.`
          : dispatchResult?.status === "failed"
            ? `${channel?.type ?? "Provider"} live send failed: ${dispatchResult.error}`
            : dispatchResult?.status === "disabled"
              ? `${channel?.type ?? "Provider"} payload is ready. Live dispatch is disabled until PROVIDER_LIVE_DISPATCH_ENABLED=true.`
              : providerStatus.note;

      await logProviderOutboundAttempt(
        supabase,
        businessId,
        selectedConversation,
        savedMessage?.id ?? null,
        providerStatus,
        dispatchResult,
      );

      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_type: "system",
        message_text: `Provider send status: ${providerNote}`,
        ai_generated: false,
        created_at: now,
      });

      if (selectedConversation.lead_id) {
        await supabase
          .from("leads")
          .update({
            score: Math.min(getLeadScore(selectedConversation) + 3, 100),
            next_action: "Wait for customer reply",
          })
          .eq("id", selectedConversation.lead_id)
          .eq("business_id", businessId);
      }

      return NextResponse.json({ ok: true, providerStatus: { ...providerStatus, note: providerNote, dispatchResult } });
    }

    if (body.action === "mark_qualified" || body.action === "create_task") {
      if (!selectedConversation.lead_id) {
        return NextResponse.json({ error: "Lead not found for this conversation." }, { status: 404 });
      }

      const update =
        body.action === "mark_qualified"
          ? { status: "qualified", score: 90, next_action: "Send proposal" }
          : {
              score: Math.min(getLeadScore(selectedConversation) + 5, 100),
              next_action: "Follow up with demo and pricing",
            };

      const { error: leadError } = await supabase
        .from("leads")
        .update(update)
        .eq("id", selectedConversation.lead_id)
        .eq("business_id", businessId);

      if (leadError) {
        throw new Error(leadError.message);
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unsupported inbox action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update inbox." },
      { status: 500 },
    );
  }
}
