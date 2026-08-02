import { NextResponse } from "next/server";
import { decryptProviderToken } from "@/lib/provider-token-crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type MetaPageAccount = {
  id?: string;
  name?: string;
  access_token?: string;
  instagram_business_account?: {
    id?: string;
    username?: string;
    name?: string;
  };
};

type MetaAccountsResponse = {
  data?: MetaPageAccount[];
  paging?: Record<string, unknown>;
  error?: {
    message?: string;
  };
};

type MetaPermissionsResponse = {
  data?: {
    permission?: string;
    status?: string;
  }[];
  error?: {
    message?: string;
  };
};

type MetaTokenDebugResponse = {
  data?: {
    app_id?: string;
    type?: string;
    application?: string;
    data_access_expires_at?: number;
    expires_at?: number;
    is_valid?: boolean;
    issued_at?: number;
    scopes?: string[];
    granular_scopes?: {
      scope?: string;
      target_ids?: string[];
    }[];
    user_id?: string;
  };
  error?: {
    message?: string;
    type?: string;
    code?: number;
    fbtrace_id?: string;
  };
};

type MetaNodeProbeResponse = {
  id?: string;
  name?: string;
  instagram_business_account?: {
    id?: string;
    username?: string;
    name?: string;
  };
  error?: {
    message?: string;
    type?: string;
    code?: number;
    fbtrace_id?: string;
  };
};

function getGraphApiBaseUrl() {
  const apiVersion = process.env.META_GRAPH_API_VERSION || "v21.0";
  return `https://graph.facebook.com/${apiVersion}`;
}

function sanitizeAccountsResponse(accountsResult: MetaAccountsResponse) {
  return {
    ...accountsResult,
    data: accountsResult.data?.map((page) => ({
      id: page.id,
      name: page.name,
      has_access_token: Boolean(page.access_token),
      instagram_business_account: page.instagram_business_account ?? null,
    })),
  };
}

function getRequestedScopes(channelType: string) {
  const channelEnvName = `META_${channelType.toUpperCase()}_OAUTH_SCOPES`;
  const configuredScopes = process.env[channelEnvName] || process.env.META_OAUTH_SCOPES || "";

  return configuredScopes
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

async function getTokenDebug(accessToken: string) {
  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
    return {
      skipped: true,
      reason: "META_APP_ID or META_APP_SECRET is not configured.",
    };
  }

  const debugTokenUrl = new URL(`${getGraphApiBaseUrl()}/debug_token`);
  debugTokenUrl.searchParams.set("input_token", accessToken);
  debugTokenUrl.searchParams.set("access_token", `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`);
  const response = await fetch(debugTokenUrl);
  const result = (await response.json().catch(() => ({}))) as MetaTokenDebugResponse;

  return {
    skipped: false,
    status: response.status,
    response: result,
  };
}

async function probeCurrentProviderNode(providerId: string | null, accessToken: string) {
  if (!providerId) {
    return {
      skipped: true,
      reason: "Channel has no provider ID / handle.",
    };
  }

  const probeUrl = new URL(`${getGraphApiBaseUrl()}/${providerId}`);
  probeUrl.searchParams.set("fields", "id,name,instagram_business_account{id,username,name}");
  probeUrl.searchParams.set("access_token", accessToken);
  const response = await fetch(probeUrl);
  const result = (await response.json().catch(() => ({}))) as MetaNodeProbeResponse;

  return {
    skipped: false,
    status: response.status,
    providerId,
    response: result,
  };
}

async function probePageTokenSelf(accessToken: string) {
  const probeUrl = new URL(`${getGraphApiBaseUrl()}/me`);
  probeUrl.searchParams.set("fields", "id,name,instagram_business_account{id,username,name}");
  probeUrl.searchParams.set("access_token", accessToken);
  const response = await fetch(probeUrl);
  const result = (await response.json().catch(() => ({}))) as MetaNodeProbeResponse;

  return {
    status: response.status,
    response: result,
  };
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
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const url = new URL(request.url);
    const channelType = url.searchParams.get("type") || "instagram";
    const { supabase, businessId } = await getBusinessContext(token);
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("id, type, display_name, handle, status, webhook_status, access_token_encrypted")
      .eq("business_id", businessId)
      .eq("type", channelType)
      .maybeSingle<{
        id: string;
        type: string;
        display_name: string;
        handle: string | null;
        status: string;
        webhook_status: string | null;
        access_token_encrypted: string | null;
      }>();

    if (channelError) {
      throw new Error(channelError.message);
    }

    if (!channel?.access_token_encrypted) {
      return NextResponse.json({ error: "Meta token is not stored for this channel." }, { status: 409 });
    }

    const accessToken = decryptProviderToken(channel.access_token_encrypted);
    const permissionsUrl = new URL(`${getGraphApiBaseUrl()}/me/permissions`);
    permissionsUrl.searchParams.set("access_token", accessToken);
    const permissionsResponse = await fetch(permissionsUrl);
    const permissionsResult = (await permissionsResponse.json().catch(() => ({}))) as MetaPermissionsResponse;

    const accountsUrl = new URL(`${getGraphApiBaseUrl()}/me/accounts`);
    accountsUrl.searchParams.set("fields", "id,name,access_token,instagram_business_account{id,username,name}");
    accountsUrl.searchParams.set("access_token", accessToken);
    const accountsResponse = await fetch(accountsUrl);
    const accountsResult = (await accountsResponse.json().catch(() => ({}))) as MetaAccountsResponse;
    const tokenDebug = await getTokenDebug(accessToken);
    const providerNodeProbe = await probeCurrentProviderNode(channel.handle, accessToken);
    const tokenType = tokenDebug.skipped ? null : tokenDebug.response?.data?.type ?? null;
    const pageTokenProbe = tokenType === "PAGE" ? await probePageTokenSelf(accessToken) : null;
    const sanitizedAccountsResponse = sanitizeAccountsResponse(accountsResult);
    const pages = sanitizedAccountsResponse.data ?? [];
    const pagesWithInstagram = pages.filter((page) => Boolean(page.instagram_business_account?.id));
    const pageTokenPageFound = Boolean(pageTokenProbe?.response?.id && !pageTokenProbe.response.error);
    const pageTokenInstagramLinked = Boolean(pageTokenProbe?.response?.instagram_business_account?.id);
    const permissions = permissionsResult.data ?? [];
    const grantedScopes = permissions
      .filter((permission) => permission.status === "granted" && permission.permission)
      .map((permission) => permission.permission as string);
    const tokenScopes = tokenDebug.skipped ? [] : tokenDebug.response?.data?.scopes ?? [];
    const effectiveGrantedScopes = grantedScopes.length ? grantedScopes : tokenScopes;
    const declinedScopes = permissions
      .filter((permission) => permission.status && permission.status !== "granted" && permission.permission)
      .map((permission) => permission.permission as string);
    const requestedScopes = getRequestedScopes(channelType);
    const missingRequestedScopes = requestedScopes.filter((scope) => !effectiveGrantedScopes.includes(scope));

    const debugPayload = {
      ok: true,
      channel: {
        id: channel.id,
        type: channel.type,
        display_name: channel.display_name,
        handle: channel.handle,
        status: channel.status,
        webhook_status: channel.webhook_status,
        tokenStored: true,
      },
      token: {
        stored: true,
        debug: tokenDebug,
        type: tokenType,
      },
      providerNodeProbe,
      pageTokenProbe,
      oauth: {
        usedConfigId: Boolean(process.env.META_OAUTH_CONFIG_ID),
        requestedScopes,
        grantedScopes: effectiveGrantedScopes,
        permissionsEndpointGrantedScopes: grantedScopes,
        tokenScopes,
        declinedScopes,
        missingRequestedScopes,
      },
      graph: {
        apiVersion: process.env.META_GRAPH_API_VERSION || "v21.0",
        permissionsStatus: permissionsResponse.status,
        accountsStatus: accountsResponse.status,
        rawPageCount: pages.length,
        pageCount: pageTokenPageFound ? 1 : pages.length,
        rawPagesWithInstagramCount: pagesWithInstagram.length,
        pagesWithInstagramCount: pageTokenInstagramLinked ? 1 : pagesWithInstagram.length,
        pageTokenDetected: tokenType === "PAGE",
        accountsResponse: sanitizedAccountsResponse,
        rawAccountsResponseSanitized: sanitizedAccountsResponse,
        permissionsResponse: permissionsResult,
      },
    };

    console.info("Meta accounts debug", {
      channelId: channel.id,
      channelType: channel.type,
      handle: channel.handle,
      accountsStatus: accountsResponse.status,
      accountsRawSanitized: sanitizedAccountsResponse,
      permissionsStatus: permissionsResponse.status,
      permissionsRaw: permissionsResult,
      tokenDebug,
      providerNodeProbe,
      pageTokenProbe,
      requestedScopes,
      grantedScopes: effectiveGrantedScopes,
      declinedScopes,
      missingRequestedScopes,
    });

    return NextResponse.json(debugPayload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not debug Meta accounts." },
      { status: 500 },
    );
  }
}
