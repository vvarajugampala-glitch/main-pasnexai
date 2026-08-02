import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createMetaOAuthState } from "../state";

const validChannelTypes = new Set(["instagram", "whatsapp", "facebook", "messenger"]);
const defaultScopesByChannel: Record<string, string[]> = {
  instagram: [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_metadata",
    "business_management",
    "instagram_basic",
    "instagram_manage_messages",
    "instagram_manage_comments",
  ],
  facebook: ["pages_show_list", "pages_read_engagement", "pages_manage_metadata", "pages_messaging"],
  messenger: ["pages_show_list", "pages_read_engagement", "pages_manage_metadata", "pages_messaging"],
  whatsapp: ["whatsapp_business_management", "whatsapp_business_messaging"],
};

type Payload = {
  type?: string;
};

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function getRedirectUri() {
  return process.env.META_OAUTH_REDIRECT_URL || `${getSiteUrl()}/api/provider/meta/oauth/callback`;
}

function getChannelScopes(channelType: string) {
  const channelEnvName = `META_${channelType.toUpperCase()}_OAUTH_SCOPES`;
  const configuredScopes = process.env[channelEnvName] || process.env.META_OAUTH_SCOPES;

  if (configuredScopes) {
    return configuredScopes
      .split(",")
      .map((scope) => scope.trim())
      .filter(Boolean)
      .join(",");
  }

  return (defaultScopesByChannel[channelType] ?? defaultScopesByChannel.instagram).join(",");
}

function getChannelScopeList(channelType: string) {
  return getChannelScopes(channelType)
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    if (!process.env.META_APP_ID) {
      return NextResponse.json({ error: "META_APP_ID is not configured yet." }, { status: 409 });
    }

    const payload = (await request.json()) as Payload;
    const channelType = payload.type?.toLowerCase() || "instagram";

    if (!validChannelTypes.has(channelType)) {
      return NextResponse.json({ error: "This channel does not use Meta OAuth." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.business_id) {
      return NextResponse.json({ error: "Business profile not found." }, { status: 404 });
    }

    const requestedScopes = getChannelScopeList(channelType);
    const state = createMetaOAuthState({
      businessId: profile.business_id,
      channelType,
      userId: user.id,
      createdAt: Date.now(),
      requestedScopes,
      usedConfigId: Boolean(process.env.META_OAUTH_CONFIG_ID),
    });

    const oauthUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
    oauthUrl.searchParams.set("client_id", process.env.META_APP_ID);
    oauthUrl.searchParams.set("redirect_uri", getRedirectUri());
    oauthUrl.searchParams.set("state", state);
    oauthUrl.searchParams.set("response_type", "code");

    if (process.env.META_OAUTH_CONFIG_ID) {
      oauthUrl.searchParams.set("config_id", process.env.META_OAUTH_CONFIG_ID);
    } else {
      oauthUrl.searchParams.set("scope", requestedScopes.join(","));
    }

    return NextResponse.json({
      oauthUrl: oauthUrl.toString(),
      redirectUri: getRedirectUri(),
      requestedScopes,
      usedConfigId: Boolean(process.env.META_OAUTH_CONFIG_ID),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start Meta OAuth." },
      { status: 500 },
    );
  }
}
