import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { supabase, businessId } = await getBusinessContext(token);
    const { data: channels, error } = await supabase
      .from("channels")
      .select("id, type, handle, access_token_encrypted, created_at")
      .eq("business_id", businessId)
      .eq("type", "instagram")
      .order("created_at", { ascending: true })
      .returns<
        {
          id: string;
          type: string;
          handle: string | null;
          access_token_encrypted: string | null;
          created_at: string;
        }[]
      >();

    if (error) {
      throw new Error(error.message);
    }

    let tokenChannel = channels?.find((channel) => channel.access_token_encrypted) ?? null;
    let adoptedTokenFromChannelId: string | null = null;

    if (!tokenChannel) {
      const { data: latestTokenChannel } = await supabase
        .from("channels")
        .select("id, type, handle, access_token_encrypted, webhook_status, connected_at, created_at")
        .eq("type", "instagram")
        .not("access_token_encrypted", "is", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle<{
          id: string;
          type: string;
          handle: string | null;
          access_token_encrypted: string | null;
          webhook_status: string | null;
          connected_at: string | null;
          created_at: string;
        }>();

      const targetChannel = channels?.[0] ?? null;

      if (!latestTokenChannel?.access_token_encrypted || !targetChannel) {
        return NextResponse.json({
          ok: false,
          error: "No Instagram channel with stored token found for this workspace.",
          channelCount: channels?.length ?? 0,
        }, { status: 409 });
      }

      adoptedTokenFromChannelId = latestTokenChannel.id;

      const { error: adoptError } = await supabase
        .from("channels")
        .update({
          handle: latestTokenChannel.handle,
          status: "connected",
          access_token_encrypted: latestTokenChannel.access_token_encrypted,
          webhook_status: latestTokenChannel.webhook_status ?? "token_stored_provider_review_pending",
          connected_at: latestTokenChannel.connected_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetChannel.id)
        .eq("business_id", businessId);

      if (adoptError) {
        throw new Error(adoptError.message);
      }

      tokenChannel = {
        ...targetChannel,
        handle: latestTokenChannel.handle,
        access_token_encrypted: latestTokenChannel.access_token_encrypted,
      };
    }

    const duplicateChannelIds = (channels ?? [])
      .filter((channel) => channel.id !== tokenChannel.id)
      .map((channel) => channel.id);

    if (duplicateChannelIds.length) {
      await supabase
        .from("conversations")
        .update({ channel_id: tokenChannel.id })
        .eq("business_id", businessId)
        .in("channel_id", duplicateChannelIds);
      await supabase
        .from("leads")
        .update({ channel_id: tokenChannel.id })
        .eq("business_id", businessId)
        .in("channel_id", duplicateChannelIds);
    }

    return NextResponse.json({
      ok: true,
      tokenChannelId: tokenChannel.id,
      tokenChannelHandle: tokenChannel.handle,
      adoptedTokenFromChannelId,
      repairedChannelIds: duplicateChannelIds,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not repair channel mappings." },
      { status: 500 },
    );
  }
}
