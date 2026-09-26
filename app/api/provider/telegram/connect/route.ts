import crypto from "crypto";
import { NextResponse } from "next/server";
import { encryptProviderToken } from "@/lib/provider-token-crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type TelegramGetMeResponse = {
  ok: boolean;
  result?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
  description?: string;
};

type TelegramSetWebhookResponse = {
  ok: boolean;
  result?: boolean;
  description?: string;
};

export function getTelegramWebhookSecret() {
  const secretKey = process.env.PROVIDER_TOKEN_ENCRYPTION_KEY || "pasnex-telegram-secret-fallback-key-32chars";
  return crypto.createHmac("sha256", secretKey).update("pasnex-telegram-webhook-secret").digest("hex").slice(0, 32);
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://main-pasnexai.vercel.app").replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { bot_token?: string };
    const botToken = body.bot_token?.trim();

    if (!botToken) {
      return NextResponse.json({ error: "Telegram Bot Token is required." }, { status: 400 });
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

    // 1. Validate Bot Token via Telegram getMe
    const getMeUrl = `https://api.telegram.org/bot${botToken}/getMe`;
    const getMeResponse = await fetch(getMeUrl);
    const getMeResult = (await getMeResponse.json().catch(() => ({}))) as TelegramGetMeResponse;

    if (!getMeResponse.ok || !getMeResult.ok || !getMeResult.result) {
      return NextResponse.json(
        { error: getMeResult.description || "Invalid Telegram Bot Token. Check token from @BotFather." },
        { status: 400 },
      );
    }

    const botInfo = getMeResult.result;
    const botId = String(botInfo.id);
    const botUsername = botInfo.username ?? null;
    const displayName = botUsername ? `@${botUsername}` : botInfo.first_name || "Telegram Bot";

    // 2. Register Webhook via Telegram setWebhook
    const webhookSecret = getTelegramWebhookSecret();
    const webhookUrl = `${getSiteUrl()}/api/provider/telegram/webhook`;
    const setWebhookUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;

    const setWebhookResponse = await fetch(setWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: webhookSecret,
        allowed_updates: ["message"],
      }),
    });

    const setWebhookResult = (await setWebhookResponse.json().catch(() => ({}))) as TelegramSetWebhookResponse;
    const webhookSuccess = Boolean(setWebhookResponse.ok && setWebhookResult.ok);

    // 3. Encrypt and store/update channel in Supabase
    const encryptedAccessToken = encryptProviderToken(botToken);
    const channelHandle = botUsername || botId;

    const { data: existingChannels } = await supabase
      .from("channels")
      .select("id, handle, connected_at")
      .eq("business_id", profile.business_id)
      .eq("type", "telegram")
      .order("created_at", { ascending: true });

    const existingChannel =
      existingChannels?.find((c) => c.handle === channelHandle) ?? existingChannels?.[0] ?? null;

    const channelData = {
      business_id: profile.business_id,
      type: "telegram",
      display_name: displayName,
      handle: channelHandle,
      status: "connected",
      access_token_encrypted: encryptedAccessToken,
      webhook_status: webhookSuccess ? "live" : "webhook_registration_failed",
      connected_at: existingChannel?.connected_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let channelId = existingChannel?.id;

    if (existingChannel) {
      const { error: updateError } = await supabase
        .from("channels")
        .update(channelData)
        .eq("id", existingChannel.id);

      if (updateError) throw new Error(updateError.message);
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("channels")
        .insert(channelData)
        .select("id")
        .single();

      if (insertError) throw new Error(insertError.message);
      channelId = inserted.id;
    }

    // Log connect event
    await supabase.from("admin_audit_logs").insert({
      admin_email: "telegram-connect",
      action: "provider_telegram_bot_connected",
      target_type: "business",
      target_id: profile.business_id,
      metadata: {
        provider: "telegram",
        bot_id: botId,
        bot_username: botUsername,
        webhook_url: webhookUrl,
        webhook_success: webhookSuccess,
        webhook_note: setWebhookResult.description ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      botId,
      botUsername,
      displayName,
      webhookRegistered: webhookSuccess,
      channelId,
      message: webhookSuccess
        ? `Telegram Bot ${displayName} connected and webhook set successfully.`
        : `Telegram Bot ${displayName} connected, but webhook registration returned: ${setWebhookResult.description || "unknown error"}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not connect Telegram Bot." },
      { status: 500 },
    );
  }
}
