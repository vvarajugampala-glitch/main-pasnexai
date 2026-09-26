import { decryptProviderToken } from "@/lib/provider-token-crypto";

export type ProviderChannelType = "instagram" | "whatsapp" | "facebook" | "messenger" | "telegram" | string;

export type ProviderOutboundInput = {
  channelType: ProviderChannelType;
  providerAccountId?: string | null;
  recipientId?: string | null;
  commentId?: string | null;
  messageText: string;
};

export type ProviderOutboundPlan = {
  provider: "meta" | "telegram" | "unknown";
  channelType: ProviderChannelType;
  endpoint: string | null;
  payload: Record<string, unknown> | null;
  ready: boolean;
  blocker?: string;
};

export type ProviderDispatchResult = {
  attempted: boolean;
  sent: boolean;
  status: "disabled" | "sent" | "failed";
  providerMessageId: string | null;
  response: Record<string, unknown> | null;
  error: string | null;
};

function getGraphApiBaseUrl() {
  const apiVersion = process.env.META_GRAPH_API_VERSION || "v21.0";
  return `https://graph.facebook.com/${apiVersion}`;
}

function getMetaEndpoint(channelType: ProviderChannelType, providerAccountId?: string | null) {
  if (!providerAccountId) return null;

  if (channelType === "whatsapp") {
    return `/${providerAccountId}/messages`;
  }

  if (channelType === "instagram") {
    return `/me/messages`;
  }

  if (channelType === "facebook" || channelType === "messenger") {
    return `/me/messages`;
  }

  return null;
}

function getMetaPayload(input: ProviderOutboundInput) {
  if (input.channelType === "whatsapp") {
    if (!input.recipientId) return null;
    return {
      messaging_product: "whatsapp",
      to: input.recipientId,
      type: "text",
      text: { body: input.messageText },
    };
  }

  if (input.channelType === "instagram") {
    if (input.commentId) {
      return {
        recipient: { comment_id: input.commentId },
        message: { text: input.messageText },
      };
    }
    if (input.recipientId) {
      return {
        recipient: { id: input.recipientId },
        message: { text: input.messageText },
      };
    }
    return null;
  }

  if (input.channelType === "facebook" || input.channelType === "messenger") {
    if (input.commentId) {
      return {
        recipient: { comment_id: input.commentId },
        message: { text: input.messageText },
      };
    }
    if (input.recipientId) {
      return {
        recipient: { id: input.recipientId },
        message: { text: input.messageText },
      };
    }
    return null;
  }

  return null;
}

export function buildProviderOutboundPlan(input: ProviderOutboundInput): ProviderOutboundPlan {
  if (input.channelType === "telegram") {
    if (!input.recipientId) {
      return {
        provider: "telegram",
        channelType: input.channelType,
        endpoint: "/sendMessage",
        payload: null,
        ready: false,
        blocker: "Telegram chat id (recipient id) is missing.",
      };
    }

    return {
      provider: "telegram",
      channelType: input.channelType,
      endpoint: "/sendMessage",
      payload: {
        chat_id: input.recipientId,
        text: input.messageText,
      },
      ready: true,
    };
  }

  const endpoint = getMetaEndpoint(input.channelType, input.providerAccountId);
  const payload = getMetaPayload(input);

  if (!endpoint) {
    return {
      provider: input.channelType === "instagram" || input.channelType === "whatsapp" || input.channelType === "facebook" || input.channelType === "messenger" ? "meta" : "unknown",
      channelType: input.channelType,
      endpoint: null,
      payload,
      ready: false,
      blocker: "Provider account id is missing. Add the channel handle/page id in admin channel setup.",
    };
  }

  if (!payload) {
    return {
      provider: "meta",
      channelType: input.channelType,
      endpoint,
      payload: null,
      ready: false,
      blocker: "Recipient id or comment id is missing. Incoming webhook mapping must store commenter id or comment id before outbound replies can be sent.",
    };
  }

  return {
    provider: "meta",
    channelType: input.channelType,
    endpoint,
    payload,
    ready: true,
  };
}

export async function dispatchMetaOutboundMessage(input: {
  outboundPlan: ProviderOutboundPlan;
  encryptedAccessToken: string;
}): Promise<ProviderDispatchResult> {
  if (process.env.PROVIDER_LIVE_DISPATCH_ENABLED !== "true") {
    return {
      attempted: false,
      sent: false,
      status: "disabled",
      providerMessageId: null,
      response: null,
      error: "Live provider dispatch is disabled. Set PROVIDER_LIVE_DISPATCH_ENABLED=true after provider approval.",
    };
  }

  if (input.outboundPlan.provider !== "meta" || !input.outboundPlan.endpoint || !input.outboundPlan.payload) {
    return {
      attempted: false,
      sent: false,
      status: "failed",
      providerMessageId: null,
      response: null,
      error: input.outboundPlan.blocker ?? "Meta outbound payload is not ready.",
    };
  }

  try {
    const accessToken = decryptProviderToken(input.encryptedAccessToken);
    const response = await fetch(`${getGraphApiBaseUrl()}${input.outboundPlan.endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input.outboundPlan.payload),
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      return {
        attempted: true,
        sent: false,
        status: "failed",
        providerMessageId: null,
        response: data,
        error:
          typeof data.error === "object" && data.error && "message" in data.error
            ? String((data.error as { message: unknown }).message)
            : `Meta Graph API returned ${response.status}.`,
      };
    }

    return {
      attempted: true,
      sent: true,
      status: "sent",
      providerMessageId: typeof data.message_id === "string" ? data.message_id : typeof data.id === "string" ? data.id : null,
      response: data,
      error: null,
    };
  } catch (error) {
    return {
      attempted: true,
      sent: false,
      status: "failed",
      providerMessageId: null,
      response: null,
      error: error instanceof Error ? error.message : "Could not send provider message.",
    };
  }
}

export async function dispatchTelegramOutboundMessage(input: {
  outboundPlan: ProviderOutboundPlan;
  encryptedAccessToken: string;
}): Promise<ProviderDispatchResult> {
  if (process.env.PROVIDER_LIVE_DISPATCH_ENABLED !== "true") {
    return {
      attempted: false,
      sent: false,
      status: "disabled",
      providerMessageId: null,
      response: null,
      error: "Live provider dispatch is disabled. Set PROVIDER_LIVE_DISPATCH_ENABLED=true after provider approval.",
    };
  }

  if (input.outboundPlan.provider !== "telegram" || !input.outboundPlan.payload) {
    return {
      attempted: false,
      sent: false,
      status: "failed",
      providerMessageId: null,
      response: null,
      error: input.outboundPlan.blocker ?? "Telegram outbound payload is not ready.",
    };
  }

  try {
    const botToken = decryptProviderToken(input.encryptedAccessToken);
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input.outboundPlan.payload),
    });

    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      result?: { message_id?: number };
      description?: string;
    };

    if (!response.ok || !data.ok) {
      return {
        attempted: true,
        sent: false,
        status: "failed",
        providerMessageId: null,
        response: data as Record<string, unknown>,
        error: data.description ?? `Telegram API returned ${response.status}.`,
      };
    }

    return {
      attempted: true,
      sent: true,
      status: "sent",
      providerMessageId: data.result?.message_id ? String(data.result.message_id) : null,
      response: data as Record<string, unknown>,
      error: null,
    };
  } catch (error) {
    return {
      attempted: true,
      sent: false,
      status: "failed",
      providerMessageId: null,
      response: null,
      error: error instanceof Error ? error.message : "Telegram outbound dispatch failed.",
    };
  }
}

