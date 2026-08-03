import { NextResponse } from "next/server";
import { decryptProviderToken } from "@/lib/provider-token-crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ChannelRow = {
  id: string;
  business_id: string;
  type: string;
  handle: string | null;
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

function getGraphApiBaseUrl() {
  const apiVersion = process.env.META_GRAPH_API_VERSION || "v21.0";
  return `https://graph.facebook.com/${apiVersion}`;
}

async function readPageFromToken(accessToken: string) {
  const pageUrl = new URL(`${getGraphApiBaseUrl()}/me`);
  pageUrl.searchParams.set("fields", "id,name,instagram_business_account{id,username}");
  pageUrl.searchParams.set("access_token", accessToken);

  const response = await fetch(pageUrl);
  const result = (await response.json().catch(() => ({}))) as {
    id?: string;
    name?: string;
    instagram_business_account?: { id?: string; username?: string };
    error?: { message?: string };
  };

  if (!response.ok || !result.id) {
    throw new Error(result.error?.message ?? "Could not read Page from stored Meta token.");
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const payload = (await request.json().catch(() => ({}))) as { type?: string };
    const channelType = payload.type ?? "instagram";
    const { supabase, businessId } = await getBusinessContext(token);

    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("id, business_id, type, handle, access_token_encrypted")
      .eq("business_id", businessId)
      .eq("type", channelType)
      .not("access_token_encrypted", "is", null)
      .order("connected_at", { ascending: false })
      .limit(1)
      .maybeSingle<ChannelRow>();

    if (channelError) {
      throw new Error(channelError.message);
    }

    if (!channel?.access_token_encrypted) {
      return NextResponse.json({ error: "Meta token is not stored for this channel." }, { status: 409 });
    }

    const accessToken = decryptProviderToken(channel.access_token_encrypted);
    const page = await readPageFromToken(accessToken);
    const subscribeUrl = new URL(`${getGraphApiBaseUrl()}/${page.id}/subscribed_apps`);
    subscribeUrl.searchParams.set("access_token", accessToken);
    subscribeUrl.searchParams.set(
      "subscribed_fields",
      [
        "messages",
        "messaging_postbacks",
        "messaging_seen",
        "messaging_deliveries",
        "message_echoes",
      ].join(","),
    );

    const subscribeResponse = await fetch(subscribeUrl, { method: "POST" });
    const subscribeResult = (await subscribeResponse.json().catch(() => ({}))) as {
      success?: boolean;
      error?: { message?: string; code?: number };
    };

    if (!subscribeResponse.ok || subscribeResult.error) {
      return NextResponse.json(
        {
          error: subscribeResult.error?.message ?? "Meta webhook subscription failed.",
          pageId: page.id,
          instagramBusinessId: page.instagram_business_account?.id ?? null,
          status: subscribeResponse.status,
        },
        { status: 409 },
      );
    }

    await supabase
      .from("channels")
      .update({
        webhook_status: "webhook_subscribed_provider_review_pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", channel.id)
      .eq("business_id", businessId);

    return NextResponse.json({
      ok: true,
      pageId: page.id,
      pageName: page.name ?? null,
      instagramBusinessId: page.instagram_business_account?.id ?? null,
      result: subscribeResult,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not subscribe Meta webhooks." },
      { status: 500 },
    );
  }
}
