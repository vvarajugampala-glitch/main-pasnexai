import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { encryptProviderToken } from "@/lib/provider-token-crypto";
import { parseMetaOAuthState } from "../state";

type MetaTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
};

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

type ResolvedMetaChannelAccount = {
  providerAccountId: string | null;
  displayName: string | null;
  accessToken: string;
  note: string;
  debug: {
    pageCount: number;
    pagesWithInstagram: number;
    detectedPageId: string | null;
    detectedPageName: string | null;
    requestedScopes: string[];
    grantedScopes: string[];
    declinedScopes: string[];
    usedConfigId: boolean;
    accountsResponse: unknown;
    permissionsError: string | null;
  };
};

function getGraphApiBaseUrl() {
  const apiVersion = process.env.META_GRAPH_API_VERSION || "v21.0";
  return `https://graph.facebook.com/${apiVersion}`;
}

function redirectToChannels(request: Request, status: string, message: string) {
  const url = new URL("/dashboard/channels", request.url);
  url.searchParams.set("provider", "meta");
  url.searchParams.set("status", status);
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
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

async function fetchMetaGrantedScopes(userAccessToken: string) {
  const permissionsUrl = new URL(`${getGraphApiBaseUrl()}/me/permissions`);
  permissionsUrl.searchParams.set("access_token", userAccessToken);

  const response = await fetch(permissionsUrl);
  const result = (await response.json().catch(() => ({}))) as MetaPermissionsResponse;

  if (!response.ok) {
    return {
      grantedScopes: [] as string[],
      declinedScopes: [] as string[],
      permissionsError: result.error?.message ?? `Meta permissions endpoint returned ${response.status}.`,
    };
  }

  const permissions = result.data ?? [];

  return {
    grantedScopes: permissions
      .filter((permission) => permission.status === "granted" && permission.permission)
      .map((permission) => permission.permission as string),
    declinedScopes: permissions
      .filter((permission) => permission.status && permission.status !== "granted" && permission.permission)
      .map((permission) => permission.permission as string),
    permissionsError: null,
  };
}

type MetaWhatsAppPhoneNumber = {
  id?: string;
  display_phone_number?: string;
  verified_name?: string;
};

type MetaWABA = {
  id?: string;
  name?: string;
  phone_numbers?: {
    data?: MetaWhatsAppPhoneNumber[];
  };
};

type MetaWABAResponse = {
  data?: MetaWABA[];
  error?: {
    message?: string;
  };
};

async function resolveWhatsAppChannelAccount(
  userAccessToken: string,
  requestedScopes: string[],
  usedConfigId: boolean,
  permissionDebug: { grantedScopes: string[]; declinedScopes: string[]; permissionsError: string | null },
): Promise<ResolvedMetaChannelAccount> {
  try {
    let wabaList: MetaWABA[] = [];

    const clientWabaUrl = new URL(`${getGraphApiBaseUrl()}/me/client_whatsapp_business_accounts`);
    clientWabaUrl.searchParams.set("fields", "id,name,phone_numbers{id,display_phone_number,verified_name}");
    clientWabaUrl.searchParams.set("access_token", userAccessToken);

    const clientResponse = await fetch(clientWabaUrl);
    const clientResult = (await clientResponse.json().catch(() => ({}))) as MetaWABAResponse;

    if (clientResponse.ok && clientResult.data?.length) {
      wabaList = clientResult.data;
    } else {
      const wabaUrl = new URL(`${getGraphApiBaseUrl()}/me/whatsapp_business_accounts`);
      wabaUrl.searchParams.set("fields", "id,name,phone_numbers{id,display_phone_number,verified_name}");
      wabaUrl.searchParams.set("access_token", userAccessToken);

      const wabaResponse = await fetch(wabaUrl);
      const wabaResult = (await wabaResponse.json().catch(() => ({}))) as MetaWABAResponse;

      if (wabaResponse.ok && wabaResult.data?.length) {
        wabaList = wabaResult.data;
      }
    }

    let detectedPhoneNumber: MetaWhatsAppPhoneNumber | null = null;
    let detectedWabaId: string | null = null;

    for (const waba of wabaList) {
      if (waba.phone_numbers?.data?.length) {
        detectedWabaId = waba.id ?? null;
        detectedPhoneNumber = waba.phone_numbers.data[0];
        break;
      }

      if (waba.id) {
        const phoneUrl = new URL(`${getGraphApiBaseUrl()}/${waba.id}/phone_numbers`);
        phoneUrl.searchParams.set("fields", "id,display_phone_number,verified_name");
        phoneUrl.searchParams.set("access_token", userAccessToken);

        const phoneResponse = await fetch(phoneUrl);
        const phoneResult = (await phoneResponse.json().catch(() => ({}))) as { data?: MetaWhatsAppPhoneNumber[] };

        if (phoneResponse.ok && phoneResult.data?.length) {
          detectedWabaId = waba.id;
          detectedPhoneNumber = phoneResult.data[0];
          break;
        }
      }
    }

    const providerAccountId = detectedPhoneNumber?.id ?? null;
    const displayName =
      detectedPhoneNumber?.display_phone_number ||
      detectedPhoneNumber?.verified_name ||
      (detectedWabaId ? `WABA ${detectedWabaId}` : "WhatsApp");
    const note = providerAccountId
      ? "WhatsApp Business account and Phone Number ID resolved automatically."
      : wabaList.length
        ? "WhatsApp OAuth token stored, but no connected WhatsApp Phone Number ID was returned. Check WhatsApp Cloud API phone configuration."
        : "WhatsApp OAuth token stored, but no WABA accounts were returned. Check WhatsApp Cloud API permissions.";

    return {
      providerAccountId,
      displayName,
      accessToken: userAccessToken,
      note,
      debug: {
        pageCount: 0,
        pagesWithInstagram: 0,
        detectedPageId: detectedWabaId,
        detectedPageName: displayName,
        requestedScopes,
        grantedScopes: permissionDebug.grantedScopes,
        declinedScopes: permissionDebug.declinedScopes,
        usedConfigId,
        accountsResponse: { wabaCount: wabaList.length, detectedPhoneNumber },
        permissionsError: permissionDebug.permissionsError,
      },
    };
  } catch (error) {
    return {
      providerAccountId: null,
      displayName: "WhatsApp",
      accessToken: userAccessToken,
      note: `WhatsApp OAuth token stored, but WABA resolution failed: ${error instanceof Error ? error.message : "Unknown error"}.`,
      debug: {
        pageCount: 0,
        pagesWithInstagram: 0,
        detectedPageId: null,
        detectedPageName: null,
        requestedScopes,
        grantedScopes: permissionDebug.grantedScopes,
        declinedScopes: permissionDebug.declinedScopes,
        usedConfigId,
        accountsResponse: null,
        permissionsError: permissionDebug.permissionsError,
      },
    };
  }
}

async function resolveMetaChannelAccount(
  channelType: string,
  userAccessToken: string,
  requestedScopes: string[],
  usedConfigId: boolean,
): Promise<ResolvedMetaChannelAccount> {
  const permissionDebug = await fetchMetaGrantedScopes(userAccessToken);

  if (channelType === "whatsapp") {
    return resolveWhatsAppChannelAccount(userAccessToken, requestedScopes, usedConfigId, permissionDebug);
  }

  const accountsUrl = new URL(`${getGraphApiBaseUrl()}/me/accounts`);
  accountsUrl.searchParams.set("fields", "id,name,access_token,instagram_business_account{id,username,name}");
  accountsUrl.searchParams.set("access_token", userAccessToken);

  const accountsResponse = await fetch(accountsUrl);
  const accountsResult = (await accountsResponse.json()) as MetaAccountsResponse;

  if (!accountsResponse.ok) {
    throw new Error(accountsResult.error?.message ?? "Could not fetch Meta connected accounts.");
  }

  const pages = accountsResult.data ?? [];
  const pagesWithInstagram = pages.filter((page) => page.instagram_business_account?.id);
  const accountsResponseForLogs = sanitizeAccountsResponse(accountsResult);

  if (pages.length === 0) {
    console.warn("Meta /me/accounts returned zero Pages", {
      channelType,
      requestedScopes,
      usedConfigId,
      grantedScopes: permissionDebug.grantedScopes,
      declinedScopes: permissionDebug.declinedScopes,
      permissionsError: permissionDebug.permissionsError,
      accountsResponse: accountsResponseForLogs,
    });
  }

  if (channelType === "instagram") {
    const pageWithInstagram = pagesWithInstagram[0];
    const instagramAccount = pageWithInstagram?.instagram_business_account;

    return {
      providerAccountId: instagramAccount?.id ?? null,
      displayName: instagramAccount?.username ? `@${instagramAccount.username}` : instagramAccount?.name ?? "Instagram",
      accessToken: pageWithInstagram?.access_token || userAccessToken,
      note: instagramAccount?.id
        ? "Instagram business account detected and provider ID stored automatically."
        : pages.length
          ? "Meta token stored, but connected Pages did not include an Instagram business account. Check Page-Instagram link and granted permissions."
          : "Meta token stored, but no Facebook Pages were returned. Check pages_show_list permission and Page admin access.",
      debug: {
        pageCount: pages.length,
        pagesWithInstagram: pagesWithInstagram.length,
        detectedPageId: pageWithInstagram?.id ?? null,
        detectedPageName: pageWithInstagram?.name ?? null,
        requestedScopes,
        grantedScopes: permissionDebug.grantedScopes,
        declinedScopes: permissionDebug.declinedScopes,
        usedConfigId,
        accountsResponse: accountsResponseForLogs,
        permissionsError: permissionDebug.permissionsError,
      },
    };
  }

  const firstPage = pages[0];
  return {
    providerAccountId: firstPage?.id ?? null,
    displayName: firstPage?.name ?? (channelType === "messenger" ? "Messenger" : "Facebook"),
    accessToken: firstPage?.access_token || userAccessToken,
    note: firstPage?.id
      ? "Facebook Page account detected and provider ID stored automatically."
      : "Meta token stored, but no Facebook Page was returned. Add a Page to the Meta account and retry.",
    debug: {
      pageCount: pages.length,
      pagesWithInstagram: pagesWithInstagram.length,
      detectedPageId: firstPage?.id ?? null,
      detectedPageName: firstPage?.name ?? null,
      requestedScopes,
      grantedScopes: permissionDebug.grantedScopes,
      declinedScopes: permissionDebug.declinedScopes,
      usedConfigId,
      accountsResponse: accountsResponseForLogs,
      permissionsError: permissionDebug.permissionsError,
    },
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error_description") || url.searchParams.get("error");

    if (error) {
      return redirectToChannels(request, "error", error);
    }

    if (!code || !state) {
      return redirectToChannels(request, "error", "Meta did not return an OAuth code.");
    }

    const payload = parseMetaOAuthState(state);
    const supabase = createSupabaseAdminClient();
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
    const redirectUri = process.env.META_OAUTH_REDIRECT_URL || `${siteUrl}/api/provider/meta/oauth/callback`;
    let encryptedAccessToken: string | null = null;
    let tokenStatus = "token_exchange_pending";
    let providerAccountId: string | null = null;
    let providerDisplayName: string | null = null;
    let providerAccountNote = "Meta OAuth code received.";
    let providerDebug: ResolvedMetaChannelAccount["debug"] | null = null;

    if (process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.PROVIDER_TOKEN_ENCRYPTION_KEY) {
      const tokenUrl = new URL(`${getGraphApiBaseUrl()}/oauth/access_token`);
      tokenUrl.searchParams.set("client_id", process.env.META_APP_ID);
      tokenUrl.searchParams.set("client_secret", process.env.META_APP_SECRET);
      tokenUrl.searchParams.set("redirect_uri", redirectUri);
      tokenUrl.searchParams.set("code", code);

      const tokenResponse = await fetch(tokenUrl);
      const tokenResult = (await tokenResponse.json()) as MetaTokenResponse;

      if (!tokenResponse.ok || !tokenResult.access_token) {
        throw new Error(tokenResult.error?.message ?? "Meta token exchange failed.");
      }

      const resolvedAccount = await resolveMetaChannelAccount(
        payload.channelType,
        tokenResult.access_token,
        payload.requestedScopes ?? [],
        Boolean(payload.usedConfigId),
      );
      encryptedAccessToken = encryptProviderToken(resolvedAccount.accessToken);
      providerAccountId = resolvedAccount.providerAccountId;
      providerDisplayName = resolvedAccount.displayName;
      providerAccountNote = resolvedAccount.note;
      providerDebug = resolvedAccount.debug;
      tokenStatus = "token_stored_provider_review_pending";
    }

    const { data: existingChannels, error: existingChannelsError } = await supabase
      .from("channels")
      .select("id, handle, display_name, connected_at, access_token_encrypted, created_at")
      .eq("business_id", payload.businessId)
      .eq("type", payload.channelType)
      .order("created_at", { ascending: true });

    if (existingChannelsError) {
      throw new Error(existingChannelsError.message);
    }

    const existingChannel =
      (providerAccountId
        ? existingChannels?.find((channel) => channel.handle === providerAccountId)
        : null) ??
      existingChannels?.find((channel) => channel.access_token_encrypted) ??
      existingChannels?.[0] ??
      null;

    const channelUpdate = {
      business_id: payload.businessId,
      type: payload.channelType,
      display_name: providerDisplayName ?? existingChannel?.display_name ?? payload.channelType,
      handle: providerAccountId ?? existingChannel?.handle ?? null,
      status: encryptedAccessToken && (providerAccountId ?? existingChannel?.handle) ? "connected" : "ready_to_connect",
      access_token_encrypted: encryptedAccessToken,
      webhook_status: tokenStatus,
      connected_at:
        encryptedAccessToken && (providerAccountId ?? existingChannel?.handle)
          ? existingChannel?.connected_at ?? new Date().toISOString()
          : existingChannel?.connected_at ?? null,
      updated_at: new Date().toISOString(),
    };

    if (existingChannel) {
      const { error: updateError } = await supabase.from("channels").update(channelUpdate).eq("id", existingChannel.id);
      if (updateError) throw new Error(updateError.message);

      const duplicateChannelIds = (existingChannels ?? [])
        .filter((channel) => channel.id !== existingChannel.id)
        .map((channel) => channel.id);

      if (duplicateChannelIds.length) {
        await supabase
          .from("conversations")
          .update({ channel_id: existingChannel.id })
          .eq("business_id", payload.businessId)
          .in("channel_id", duplicateChannelIds);
        await supabase
          .from("leads")
          .update({ channel_id: existingChannel.id })
          .eq("business_id", payload.businessId)
          .in("channel_id", duplicateChannelIds);
      }
    } else {
      const { error: insertError } = await supabase.from("channels").insert(channelUpdate);
      if (insertError) throw new Error(insertError.message);
    }

    await supabase.from("admin_audit_logs").insert({
      admin_email: "provider-oauth",
      action: "provider_oauth_code_received",
      target_type: "business",
      target_id: payload.businessId,
      metadata: {
        provider: "meta",
        channel: payload.channelType,
        user_id: payload.userId,
        token_status: tokenStatus,
        provider_account_id: providerAccountId,
        preserved_provider_account_id: providerAccountId ? null : existingChannel?.handle ?? null,
        provider_note: providerAccountNote,
        provider_debug: providerDebug,
      },
    });

    return redirectToChannels(
      request,
      "received",
      encryptedAccessToken
        ? `${providerAccountNote} Provider approval and webhook live status are the next steps.`
        : "Meta OAuth code received. Add Meta credentials and provider token encryption key to enable secure token exchange.",
    );
  } catch (error) {
    return redirectToChannels(
      request,
      "error",
      error instanceof Error ? error.message : "Could not complete Meta OAuth callback.",
    );
  }
}
