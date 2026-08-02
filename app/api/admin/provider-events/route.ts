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

  return supabase;
}

function isMissingTable(message: string) {
  return message.includes("provider_webhook_events") || message.includes("relation") || message.includes("schema cache");
}

function isMissingOutboundTable(message: string) {
  return message.includes("provider_outbound_messages") || message.includes("relation") || message.includes("schema cache");
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const supabase = await requireAdmin(token);
    const { data, error } = await supabase
      .from("provider_webhook_events")
      .select("id, provider, event_type, provider_account_id, signature_verified, processing_status, processing_note, processed_at, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      if (isMissingTable(error.message)) {
        return NextResponse.json({ events: [], setupRequired: true });
      }
      throw new Error(error.message);
    }

    const { data: outboundAttempts, error: outboundError } = await supabase
      .from("provider_outbound_messages")
      .select("id, provider, channel_type, recipient_id, endpoint, status, error_message, payload, created_at, businesses(name, email), conversations(id)")
      .order("created_at", { ascending: false })
      .limit(30);

    if (outboundError && !isMissingOutboundTable(outboundError.message)) {
      throw new Error(outboundError.message);
    }

    const { data: channels } = await supabase
      .from("channels")
      .select("id, business_id, type, display_name, handle, status, webhook_status, access_token_encrypted, businesses(name, email)")
      .order("updated_at", { ascending: false })
      .limit(50);

    const channelIds = (channels ?? []).map((channel) => channel.id);
    const providerHandles = (channels ?? []).map((channel) => channel.handle).filter(Boolean);
    const { data: conversations } = channelIds.length
      ? await supabase
          .from("conversations")
          .select("channel_id, provider_recipient_id")
          .in("channel_id", channelIds)
      : { data: [] };
    const { data: processedWebhookEvents } = providerHandles.length
      ? await supabase
          .from("provider_webhook_events")
          .select("provider_account_id, processing_status")
          .in("provider_account_id", providerHandles)
          .eq("processing_status", "processed")
      : { data: [] };

    const handleCounts = new Map<string, number>();
    for (const channel of channels ?? []) {
      if (!channel.handle) continue;
      const key = `${channel.type}:${channel.handle}`;
      handleCounts.set(key, (handleCounts.get(key) ?? 0) + 1);
    }

    const channelReadiness = (channels ?? []).map((channel) => {
      const duplicateProviderHandleCount = channel.handle ? handleCounts.get(`${channel.type}:${channel.handle}`) ?? 0 : 0;
      const providerIdSaved = Boolean(channel.handle);
      const webhookTested = Boolean(processedWebhookEvents?.some((event) => event.provider_account_id === channel.handle));
      const recipientMapped = Boolean(
        conversations?.some(
          (conversation) => conversation.channel_id === channel.id && Boolean(conversation.provider_recipient_id),
        ),
      );
      const tokenConfigured = Boolean(channel.access_token_encrypted);

      return {
        id: channel.id,
        type: channel.type,
        displayName: channel.display_name,
        handle: channel.handle,
        status: channel.status,
        webhookStatus: channel.webhook_status,
        business: channel.businesses,
        duplicateProviderHandleCount,
        duplicateProviderHandle: duplicateProviderHandleCount > 1,
        readiness: {
          providerIdSaved,
          webhookTested,
          recipientMapped,
          tokenConfigured,
          liveReady: tokenConfigured && channel.status === "connected" && channel.webhook_status === "live" && recipientMapped,
        },
      };
    });

    return NextResponse.json({
      events: data ?? [],
      setupRequired: false,
      outboundAttempts: outboundError ? [] : outboundAttempts ?? [],
      outboundSetupRequired: Boolean(outboundError),
      channelReadiness,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load provider events." },
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

    const supabase = await requireAdmin(token);
    const payload = (await request.json()) as {
      action?: string;
      type?: string;
      handle?: string;
      keepChannelId?: string;
    };

    if (payload.action !== "clear_duplicate_provider_handles" || !payload.type || !payload.handle || !payload.keepChannelId) {
      return NextResponse.json({ error: "Invalid cleanup request." }, { status: 400 });
    }

    const { data: duplicateChannels, error: duplicateError } = await supabase
      .from("channels")
      .select("id, business_id, type, handle, display_name, access_token_encrypted, created_at")
      .eq("type", payload.type)
      .eq("handle", payload.handle)
      .neq("id", payload.keepChannelId);

    if (duplicateError) {
      throw new Error(duplicateError.message);
    }

    const duplicateIds = (duplicateChannels ?? []).map((channel) => channel.id);

    if (!duplicateIds.length) {
      return NextResponse.json({ ok: true, cleared: 0 });
    }

    const { error: updateError } = await supabase
      .from("channels")
      .update({
        handle: null,
        webhook_status: "api_pending",
        updated_at: new Date().toISOString(),
      })
      .in("id", duplicateIds);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await supabase.from("admin_audit_logs").insert({
      admin_email: "provider-events-cleanup",
      action: "duplicate_provider_handles_cleared",
      target_type: "channel",
      target_id: payload.keepChannelId,
      metadata: {
        type: payload.type,
        handle: payload.handle,
        keepChannelId: payload.keepChannelId,
        clearedChannelIds: duplicateIds,
      },
    });

    return NextResponse.json({ ok: true, cleared: duplicateIds.length, clearedChannelIds: duplicateIds });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not clear duplicate provider handles." },
      { status: 500 },
    );
  }
}
