import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ChannelRow = {
  id: string;
  type: string;
  display_name: string;
  handle: string | null;
  status: string;
  webhook_status: string | null;
  connected_at: string | null;
  access_token_encrypted: string | null;
};

async function getBusinessContext(token: string) {
  const supabase = createSupabaseAdminClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    throw new Error("Invalid session.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.business_id) {
    throw new Error("Business profile not found.");
  }

  return { supabase, businessId: profile.business_id };
}

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { supabase, businessId } = await getBusinessContext(token);

    const { data: channels, error: channelsError } = await supabase
      .from("channels")
      .select("id, type, display_name, handle, status, webhook_status, connected_at, access_token_encrypted")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true })
      .returns<ChannelRow[]>();

    if (channelsError) {
      throw new Error(channelsError.message);
    }

    const channelIds = (channels ?? []).map((channel) => channel.id);
    const providerHandles = (channels ?? []).map((channel) => channel.handle).filter(Boolean);

    const { data: conversations } = channelIds.length
      ? await supabase
          .from("conversations")
          .select("channel_id, provider_recipient_id")
          .eq("business_id", businessId)
          .in("channel_id", channelIds)
      : { data: [] };

    const { data: processedEvents } = providerHandles.length
      ? await supabase
          .from("provider_webhook_events")
          .select("provider_account_id, processing_status")
          .in("provider_account_id", providerHandles)
          .eq("processing_status", "processed")
      : { data: [] };

    const channelsWithReadiness = (channels ?? []).map((channel) => {
      const providerIdSaved = Boolean(channel.handle);
      const webhookTested = Boolean(processedEvents?.some((event) => event.provider_account_id === channel.handle));
      const recipientMapped = Boolean(
        conversations?.some(
          (conversation) =>
            conversation.channel_id === channel.id && Boolean(conversation.provider_recipient_id),
        ),
      );
      const tokenConfigured = Boolean(channel.access_token_encrypted);
      const liveReady = tokenConfigured && channel.status === "connected" && channel.webhook_status === "live" && recipientMapped;

      return {
        id: channel.id,
        type: channel.type,
        display_name: channel.display_name,
        handle: channel.handle,
        status: channel.status,
        webhook_status: channel.webhook_status,
        connected_at: channel.connected_at,
        readiness: {
          providerIdSaved,
          webhookTested,
          recipientMapped,
          tokenConfigured,
          liveReady,
        },
      };
    });

    return NextResponse.json({ channels: channelsWithReadiness });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load channels." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const payload = (await request.json()) as { channelId?: string; handle?: string };
    const channelId = payload.channelId?.trim();
    const handle = payload.handle?.trim();

    if (!channelId) {
      return NextResponse.json({ error: "Channel is required." }, { status: 400 });
    }

    if (!handle) {
      return NextResponse.json({ error: "Provider test ID is required." }, { status: 400 });
    }

    const { supabase, businessId } = await getBusinessContext(token);
    const { error } = await supabase
      .from("channels")
      .update({
        handle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", channelId)
      .eq("business_id", businessId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true, handle });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save provider test ID." },
      { status: 500 },
    );
  }
}
