"use client";

import { useEffect, useMemo, useState } from "react";
import { HiCheckBadge, HiOutlineClock, HiOutlineGlobeAlt, HiOutlineShieldCheck } from "react-icons/hi2";
import { SiFacebook, SiInstagram, SiMessenger, SiTelegram, SiWhatsapp } from "react-icons/si";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Channel = {
  id: string;
  type: string;
  display_name: string;
  handle: string | null;
  status: string;
  webhook_status: string | null;
  readiness?: {
    providerIdSaved: boolean;
    webhookTested: boolean;
    recipientMapped: boolean;
    tokenConfigured: boolean;
    liveReady: boolean;
  };
};

type MetaDebugReport = {
  token?: {
    type?: string | null;
    debug?: {
      skipped?: boolean;
      status?: number;
      response?: {
        data?: {
          is_valid?: boolean;
          type?: string;
          app_id?: string;
          user_id?: string;
          expires_at?: number;
          scopes?: string[];
          granular_scopes?: {
            scope?: string;
            target_ids?: string[];
          }[];
        };
        error?: {
          message?: string;
          type?: string;
          code?: number;
        };
      };
      reason?: string;
    };
  };
  providerNodeProbe?: {
    skipped?: boolean;
    status?: number;
    providerId?: string;
    response?: {
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
      };
    };
    reason?: string;
  };
  pageTokenProbe?: {
    status?: number;
    response?: {
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
      };
    };
  } | null;
  oauth?: {
    requestedScopes?: string[];
    grantedScopes?: string[];
    permissionsEndpointGrantedScopes?: string[];
    tokenScopes?: string[];
    missingRequestedScopes?: string[];
  };
  graph?: {
    pageCount?: number;
    pagesWithInstagramCount?: number;
    rawPageCount?: number;
    rawPagesWithInstagramCount?: number;
    accountsStatus?: number;
    pageTokenDetected?: boolean;
    rawAccountsResponseSanitized?: unknown;
  };
  error?: string;
};

const channelOrder = ["instagram", "whatsapp", "facebook", "messenger", "telegram"];
const metaOAuthChannels = new Set(["instagram", "whatsapp", "facebook", "messenger"]);
const metaDebugCacheKey = "pasnex-meta-debug-reports";

const meta = {
  instagram: {
    name: "Instagram Business",
    label: "Comments, DMs, story replies",
    Icon: SiInstagram,
    style: "from-yellow-300 via-pink-500 to-violet-600",
  },
  whatsapp: {
    name: "WhatsApp Business",
    label: "Lead qualification and support",
    Icon: SiWhatsapp,
    style: "from-[#25D366] via-emerald-500 to-green-600",
  },
  facebook: {
    name: "Facebook Page",
    label: "Page comments and lead capture",
    Icon: SiFacebook,
    style: "from-[#1877F2] via-blue-600 to-blue-500",
  },
  messenger: {
    name: "Messenger",
    label: "Inbox replies and handoff",
    Icon: SiMessenger,
    style: "from-[#00B2FF] via-blue-500 to-violet-600",
  },
  telegram: {
    name: "Telegram",
    label: "Community and broadcast flows",
    Icon: SiTelegram,
    style: "from-[#26A5E4] via-sky-500 to-blue-600",
  },
};

function getMeta(type: string) {
  return meta[type as keyof typeof meta] ?? {
    name: "Customer Channel",
    label: "Conversation automation",
    Icon: HiOutlineGlobeAlt,
    style: "from-violet-600 via-blue-600 to-cyan-500",
  };
}

function getProviderIdState(channels: Channel[]) {
  return Object.fromEntries(channels.map((channel) => [channel.id, channel.handle ?? ""]));
}

function getReadinessItems(channel: Channel) {
  return [
    ["Provider ID", Boolean(channel.readiness?.providerIdSaved)],
    ["Webhook test", Boolean(channel.readiness?.webhookTested)],
    ["Recipient mapped", Boolean(channel.readiness?.recipientMapped)],
    ["Token", Boolean(channel.readiness?.tokenConfigured)],
    ["Live send", Boolean(channel.readiness?.liveReady)],
  ] as const;
}

function getWebhookStatusLabel(status?: string | null) {
  if (!status || status === "api_pending" || status === "pending") return "API pending";

  const labels: Record<string, string> = {
    live: "Live",
    token_stored_provider_review_pending: "Token stored",
    token_exchange_pending: "Token pending",
    not_started: "Not started",
  };

  return labels[status] ?? status.replaceAll("_", " ");
}

function getProviderApprovalItems(channel?: Channel, debug?: MetaDebugReport) {
  const pageCount = debug?.graph?.pageCount;
  const instagramLinkedCount = debug?.graph?.pagesWithInstagramCount;

  return [
    {
      label: "Provider ID saved",
      complete: Boolean(channel?.readiness?.providerIdSaved),
      pendingLabel: "Provider ID pending",
    },
    {
      label: "Meta token connected",
      complete: Boolean(channel?.readiness?.tokenConfigured),
      pendingLabel: "Token pending",
    },
    {
      label: "Facebook Page found",
      complete: typeof pageCount === "number" && pageCount > 0,
      pendingLabel: typeof pageCount === "number" ? "No Page returned" : "Check pending",
    },
    {
      label: "Instagram business linked",
      complete: typeof instagramLinkedCount === "number" && instagramLinkedCount > 0,
      pendingLabel: typeof instagramLinkedCount === "number" ? "IG link missing" : "Check pending",
    },
    {
      label: "Webhook verified",
      complete: Boolean(channel?.readiness?.webhookTested),
      pendingLabel: "Webhook pending",
    },
    {
      label: "Recipient mapped",
      complete: Boolean(channel?.readiness?.recipientMapped),
      pendingLabel: "Recipient pending",
    },
    {
      label: "Live send enabled",
      complete: Boolean(channel?.readiness?.liveReady),
      pendingLabel: "Keep disabled",
    },
  ];
}

export function ChannelsLiveGrid() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyType, setBusyType] = useState("");
  const [providerIds, setProviderIds] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [debugReports, setDebugReports] = useState<Record<string, MetaDebugReport>>({});

  const loadChannels = async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return [];

    const response = await fetch("/api/dashboard/channel-summary", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as { channels?: Channel[] };
    return data.channels ?? [];
  };

  const restoreCachedDebugReports = () => {
    try {
      const cached = window.localStorage.getItem(metaDebugCacheKey);
      if (!cached) return;

      const parsed = JSON.parse(cached) as { reports?: Record<string, MetaDebugReport>; savedAt?: number };
      const cacheAge = Date.now() - (parsed.savedAt ?? 0);
      const cacheMaxAge = 1000 * 60 * 60 * 6;

      if (cacheAge > cacheMaxAge || !parsed.reports) {
        window.localStorage.removeItem(metaDebugCacheKey);
        return;
      }

      setDebugReports(parsed.reports);
    } catch {
      window.localStorage.removeItem(metaDebugCacheKey);
    }
  };

  const cacheDebugReports = (reports: Record<string, MetaDebugReport>) => {
    window.localStorage.setItem(
      metaDebugCacheKey,
      JSON.stringify({
        savedAt: Date.now(),
        reports,
      }),
    );
  };

  useEffect(() => {
    let mounted = true;

    const initialNotice = new URLSearchParams(window.location.search).get("message") ?? "";
    if (initialNotice) {
      queueMicrotask(() => {
        if (mounted) setNotice(initialNotice);
      });
    }
    queueMicrotask(() => {
      if (mounted) restoreCachedDebugReports();
    });

    loadChannels().then((nextChannels) => {
      if (!mounted) return;
      setChannels(nextChannels);
      setProviderIds(getProviderIdState(nextChannels));
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const displayChannels = useMemo(
    () =>
      channelOrder.map((type) => {
        const existing = channels.find((channel) => channel.type === type);
        return existing ?? { id: `template-${type}`, type, display_name: getMeta(type).name, handle: null, status: "not_prepared", webhook_status: "not_started" };
      }),
    [channels],
  );

  const preparedCount = channels.filter((channel) => channel.status === "connected" || channel.status === "ready_to_connect").length;
  const instagramChannel = displayChannels.find((channel) => channel.type === "instagram");
  const instagramDebugReport = instagramChannel ? debugReports[instagramChannel.id] : undefined;
  const providerApprovalItems = getProviderApprovalItems(instagramChannel, instagramDebugReport);
  const providerApprovalCompleteCount = providerApprovalItems.filter((item) => item.complete).length;
  const preLiveProviderItems = providerApprovalItems.filter((item) => item.label !== "Live send enabled");
  const preLiveChecksPassed = preLiveProviderItems.every((item) => item.complete);
  const liveSendEnabled = providerApprovalItems.find((item) => item.label === "Live send enabled")?.complete ?? false;

  const prepareChannel = async (type: string) => {
    setBusyType(type);
    setNotice("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please login again to prepare this channel.");
      }

      const channelMeta = getMeta(type);
      const response = await fetch("/api/onboarding/connect-channel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, displayName: channelMeta.name }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not prepare channel.");
      }

      const nextChannels = await loadChannels();
      setChannels(nextChannels);
      setProviderIds(getProviderIdState(nextChannels));
      setNotice(`${channelMeta.name} setup prepared. API approval is still pending.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not prepare channel.");
    } finally {
      setBusyType("");
    }
  };

  const startMetaOAuth = async (type: string) => {
    setBusyType(`oauth-${type}`);
    setNotice("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please login again to start provider OAuth.");
      }

      const response = await fetch("/api/provider/meta/oauth/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      });
      const result = (await response.json()) as { oauthUrl?: string; error?: string };

      if (!response.ok || !result.oauthUrl) {
        throw new Error(result.error ?? "Could not start Meta OAuth.");
      }

      window.location.href = result.oauthUrl;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not start Meta OAuth.");
      setBusyType("");
    }
  };

  const saveProviderId = async (channel: Channel) => {
    setBusyType(`provider-${channel.id}`);
    setNotice("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please login again to save provider test ID.");
      }

      const response = await fetch("/api/dashboard/channel-summary", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId: channel.id,
          handle: providerIds[channel.id],
        }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string; handle?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not save provider test ID.");
      }

      const nextChannels = await loadChannels();
      setChannels(nextChannels);
      setProviderIds(getProviderIdState(nextChannels));
      setNotice(`${getMeta(channel.type).name} provider test ID saved. Use the same value in Provider Events.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save provider test ID.");
    } finally {
      setBusyType("");
    }
  };

  const debugMetaAccounts = async (channel: Channel) => {
    setBusyType(`debug-${channel.id}`);
    setNotice("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please login again to debug Meta accounts.");
      }

      const response = await fetch(`/api/provider/meta/debug/accounts?type=${encodeURIComponent(channel.type)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = (await response.json()) as MetaDebugReport;

      if (!response.ok) {
        throw new Error(result.error ?? "Could not debug Meta accounts.");
      }

      setDebugReports((current) => {
        const nextReports = { ...current, [channel.id]: result };
        cacheDebugReports(nextReports);
        return nextReports;
      });
      const pageCount = result.graph?.pageCount ?? 0;
      const missingScopes = result.oauth?.missingRequestedScopes ?? [];
      setNotice(
        pageCount
          ? `Meta returned ${pageCount} Page(s). Instagram-linked Pages: ${result.graph?.pagesWithInstagramCount ?? 0}.`
          : `Meta returned 0 Pages. Missing/not granted scopes: ${missingScopes.length ? missingScopes.join(", ") : "none reported"}.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not debug Meta accounts.");
    } finally {
      setBusyType("");
    }
  };

  const subscribeMetaWebhooks = async (channel: Channel) => {
    setBusyType(`subscribe-${channel.id}`);
    setNotice("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please login again to subscribe Meta webhooks.");
      }

      const response = await fetch("/api/provider/meta/subscribe", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: channel.type }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        pageName?: string | null;
        pageId?: string | null;
        instagramBusinessId?: string | null;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not subscribe Meta webhooks.");
      }

      const nextChannels = await loadChannels();
      setChannels(nextChannels);
      setProviderIds(getProviderIdState(nextChannels));
      setNotice(
        `Meta webhook subscription refreshed for ${result.pageName ?? "Page"} (${result.pageId ?? "page id unavailable"}). Send a real Instagram DM and refresh Provider Events.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not subscribe Meta webhooks.");
    } finally {
      setBusyType("");
    }
  };

  const repairInstagramMappings = async () => {
    setBusyType("repair-instagram");
    setNotice("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please login again to repair channel mappings.");
      }

      const response = await fetch("/api/dashboard/channels/repair", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        tokenChannelId?: string;
        tokenChannelHandle?: string | null;
        adoptedTokenFromChannelId?: string | null;
        repairedChannelIds?: string[];
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not repair channel mappings.");
      }

      const nextChannels = await loadChannels();
      setChannels(nextChannels);
      setProviderIds(getProviderIdState(nextChannels));
      setNotice(
        result.adoptedTokenFromChannelId
          ? `Instagram token copied into this workspace for local testing. Token channel: ${result.tokenChannelHandle ?? result.tokenChannelId}. Relinked ${result.repairedChannelIds?.length ?? 0} old channel(s).`
          : `Instagram mappings repaired. Token channel: ${result.tokenChannelHandle ?? result.tokenChannelId}. Relinked ${result.repairedChannelIds?.length ?? 0} old channel(s).`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not repair channel mappings.");
    } finally {
      setBusyType("");
    }
  };

  return (
    <section className="mt-6">
      <div className="grid gap-4 rounded-lg border border-blue-300/15 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-cyan-500/10 p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-blue-300">Channel Command Center</p>
          <h2 className="mt-2 text-2xl font-black">Prepare every social entry point from one place</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
            {preparedCount} of {channelOrder.length} channels are prepared in this workspace. Provider API/OAuth approval will be handled in the integration phase.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-[#07101d]/80 p-3">
            <p className="text-2xl font-black">{preparedCount}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Prepared</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#07101d]/80 p-3">
            <p className="text-2xl font-black">{channelOrder.length - preparedCount}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Available</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#07101d]/80 p-3">
            <p className="text-2xl font-black">API</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Pending</p>
          </div>
        </div>
      </div>

      {notice && <div className="mt-4 rounded-lg border border-blue-400/20 bg-blue-400/10 p-3 text-sm font-semibold text-blue-100">{notice}</div>}

      <div className="mt-4 rounded-lg border border-white/10 bg-[#07101d]/90 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300">Provider Approval Checklist</p>
            <h3 className="mt-2 text-xl font-black">Instagram live readiness</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Keep live dispatch off until every item is complete. Debug proof is restored after refresh for 6 hours; run Debug Meta Pages anytime for fresh verification.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 text-center">
            <p className="text-2xl font-black">{providerApprovalCompleteCount}/{providerApprovalItems.length}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Ready</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {providerApprovalItems.map((item) => (
            <div key={item.label} className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-sm ${item.complete ? "border-blue-300/20 bg-blue-400/10" : "border-amber-300/15 bg-amber-300/10"}`}>
              <div>
                <p className="font-bold text-slate-100">{item.label}</p>
                <p className={`mt-1 text-xs font-semibold ${item.complete ? "text-blue-200" : "text-amber-200"}`}>
                  {item.complete ? "Complete" : item.pendingLabel}
                </p>
              </div>
              {item.complete ? <HiCheckBadge className="h-5 w-5 shrink-0 text-blue-300" /> : <HiOutlineClock className="h-5 w-5 shrink-0 text-amber-300" />}
            </div>
          ))}
        </div>
        <div className={`mt-4 rounded-lg border p-4 text-sm leading-6 ${preLiveChecksPassed ? "border-blue-300/20 bg-blue-400/10 text-blue-100" : "border-amber-300/15 bg-amber-300/10 text-amber-100"}`}>
          <p className="font-black">
            {liveSendEnabled
              ? "Live dispatch is enabled."
              : preLiveChecksPassed
                ? "Pre-live checks passed. Keep live dispatch disabled until final controlled send test."
                : "Pre-live checks are still incomplete."}
          </p>
          <p className="mt-1 text-xs">
            {preLiveChecksPassed
              ? "Next step: run one inbox reply test, confirm provider outbound attempt in admin, then decide when to enable production live dispatch."
              : "Run Debug Meta Pages and complete the pending checklist items before enabling any real provider send."}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void repairInstagramMappings()}
        disabled={busyType === "repair-instagram"}
        className="mt-4 rounded-lg border border-violet-300/25 bg-violet-400/10 px-4 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-400/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busyType === "repair-instagram" ? "Repairing..." : "Repair Instagram Inbox Mapping"}
      </button>
      {isLoading && <p className="mt-5 text-sm text-slate-500">Loading channels...</p>}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {displayChannels.map((channel) => {
        const channelMeta = getMeta(channel.type);
        const Icon = channelMeta.Icon;
        const prepared = channel.status === "connected" || channel.status === "ready_to_connect";
        const active = channel.status === "ready_to_connect";

        return (
          <article key={channel.id} className={`group rounded-lg border bg-[#07101d]/90 p-4 shadow-[0_16px_45px_rgba(0,0,0,.2)] transition hover:-translate-y-1 hover:border-blue-300/45 hover:bg-[#0a1424] hover:shadow-[0_22px_60px_rgba(37,99,235,.18)] ${prepared ? "border-blue-300/30" : "border-white/10"}`}>
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${channelMeta.style} shadow-[0_0_24px_rgba(37,99,235,.22)]`}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${prepared ? "bg-blue-400/10 text-blue-200" : "bg-amber-400/10 text-amber-200"}`}>
                {prepared ? "Prepared" : "Available"}
              </span>
            </div>
            <h2 className="mt-4 min-h-12 text-lg font-black leading-6">{channelMeta.name}</h2>
            <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{channelMeta.label}</p>
            <div className="mt-4 grid gap-2 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-xs">
              <div className="flex items-center justify-between gap-3 text-slate-300">
                <span>Status</span>
                <span className="font-bold text-white">{prepared ? "Setup prepared" : "Not started"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-slate-300">
                <span>Webhook</span>
                <span className="max-w-[8rem] truncate text-right font-bold text-white" title={prepared ? channel.webhook_status ?? "api_pending" : "api_pending"}>
                  {prepared ? getWebhookStatusLabel(channel.webhook_status) : "API pending"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-slate-300">
                <span>{active ? "Workspace" : "API approval"}</span>
                {active ? <HiCheckBadge className="h-5 w-5 text-blue-300" /> : <HiOutlineClock className="h-5 w-5 text-amber-300" />}
              </div>
            </div>
            <button onClick={() => prepareChannel(channel.type)} disabled={busyType === channel.type || busyType === `oauth-${channel.type}`} className="mt-4 w-full rounded-lg border border-white/10 bg-white/[0.04] py-2.5 text-xs font-bold transition group-hover:border-blue-300/50 group-hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60">
              {busyType === channel.type ? "Preparing..." : prepared ? "Refresh Setup" : "Prepare Setup"}
            </button>
            {prepared && !channel.id.startsWith("template-") && (
              <div className="mt-3 rounded-lg border border-blue-300/15 bg-blue-400/10 p-2.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200" htmlFor={`provider-id-${channel.id}`}>
                  Provider test ID
                </label>
                <input
                  id={`provider-id-${channel.id}`}
                  value={providerIds[channel.id] ?? ""}
                  onChange={(event) => setProviderIds((current) => ({ ...current, [channel.id]: event.target.value }))}
                  placeholder={`${channel.type}-test-id`}
                  className="mt-1.5 h-9 w-full rounded-lg border border-white/10 bg-[#030712] px-2.5 text-xs text-white outline-none transition focus:border-blue-300/50"
                />
                <button
                  type="button"
                  onClick={() => void saveProviderId(channel)}
                  disabled={busyType === `provider-${channel.id}` || !providerIds[channel.id]?.trim()}
                  className="mt-2 w-full rounded-lg border border-blue-300/25 bg-blue-400/10 py-1.5 text-xs font-bold text-blue-100 transition hover:bg-blue-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busyType === `provider-${channel.id}` ? "Saving..." : "Save Provider ID"}
                </button>
              </div>
            )}
            {prepared && !channel.id.startsWith("template-") && (
              <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.035] p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Setup checklist</p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {getReadinessItems(channel).map(([label, complete]) => (
                    <div key={label} className="rounded-md border border-white/10 bg-[#030712]/60 px-2 py-1.5 text-[10px]">
                      <span className="block truncate text-slate-400">{label}</span>
                      <span className={`mt-1 block font-bold ${complete ? "text-blue-200" : "text-amber-100"}`}>
                        {complete ? (label === "Live send" ? "Ready" : "Complete") : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {prepared && metaOAuthChannels.has(channel.type) && (
              <button
                onClick={() => void startMetaOAuth(channel.type)}
                disabled={busyType === `oauth-${channel.type}`}
                className="mt-3 w-full rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 py-2.5 text-xs font-bold text-white shadow-[0_0_24px_rgba(37,99,235,.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyType === `oauth-${channel.type}` ? "Opening Meta..." : "Start Meta OAuth"}
              </button>
            )}
            {prepared && channel.type === "instagram" && !channel.id.startsWith("template-") && (
              <button
                type="button"
                onClick={() => void debugMetaAccounts(channel)}
                disabled={busyType === `debug-${channel.id}`}
                className="mt-2 w-full rounded-lg border border-violet-300/25 bg-violet-400/10 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-400/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyType === `debug-${channel.id}` ? "Checking Meta..." : "Debug Meta Pages"}
              </button>
            )}
            {prepared && channel.type === "instagram" && !channel.id.startsWith("template-") && (
              <button
                type="button"
                onClick={() => void subscribeMetaWebhooks(channel)}
                disabled={busyType === `subscribe-${channel.id}`}
                className="mt-2 w-full rounded-lg border border-blue-300/25 bg-blue-400/10 py-2 text-xs font-bold text-blue-100 transition hover:bg-blue-400/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyType === `subscribe-${channel.id}` ? "Subscribing..." : "Subscribe Webhook"}
              </button>
            )}
            {debugReports[channel.id] && (
              <div className="mt-3 rounded-lg border border-violet-300/15 bg-violet-400/10 p-2.5 text-[10px] leading-5 text-violet-50">
                <p className="font-bold">Pages: {debugReports[channel.id].graph?.pageCount ?? 0}</p>
                <p>IG linked: {debugReports[channel.id].graph?.pagesWithInstagramCount ?? 0}</p>
                <p>Token valid: {debugReports[channel.id].token?.debug?.response?.data?.is_valid === true ? "yes" : debugReports[channel.id].token?.debug?.response?.data?.is_valid === false ? "no" : "unknown"}</p>
                <p>Token type: {debugReports[channel.id].token?.type ?? debugReports[channel.id].token?.debug?.response?.data?.type ?? "unknown"}</p>
                <p>
                  Provider node:{" "}
                  {debugReports[channel.id].pageTokenProbe?.response?.name ??
                    debugReports[channel.id].providerNodeProbe?.response?.name ??
                    debugReports[channel.id].pageTokenProbe?.response?.error?.message ??
                    debugReports[channel.id].providerNodeProbe?.response?.error?.message ??
                    debugReports[channel.id].providerNodeProbe?.reason ??
                    "unknown"}
                </p>
                <p>Granted: {debugReports[channel.id].oauth?.grantedScopes?.join(", ") || "none"}</p>
                <p>Missing: {debugReports[channel.id].oauth?.missingRequestedScopes?.join(", ") || "none"}</p>
                {debugReports[channel.id].graph?.pageTokenDetected && (
                  <div className="mt-2 rounded-md border border-blue-300/20 bg-blue-400/10 p-2 text-blue-100">
                    Page token detected. `/me/accounts` is not valid for Page tokens, so Pasnex is checking the selected Page through `/me`.
                  </div>
                )}
                <details className="mt-2 rounded-md border border-white/10 bg-[#030712]/70 p-2">
                  <summary className="cursor-pointer font-bold">Raw /me/accounts response</summary>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[10px] text-slate-200">
                    {JSON.stringify(debugReports[channel.id].graph?.rawAccountsResponseSanitized ?? null, null, 2)}
                  </pre>
                </details>
                <details className="mt-2 rounded-md border border-white/10 bg-[#030712]/70 p-2">
                  <summary className="cursor-pointer font-bold">Current token info</summary>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[10px] text-slate-200">
                    {JSON.stringify(debugReports[channel.id].token?.debug ?? null, null, 2)}
                  </pre>
                </details>
                <details className="mt-2 rounded-md border border-white/10 bg-[#030712]/70 p-2">
                  <summary className="cursor-pointer font-bold">Provider/Page probe</summary>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[10px] text-slate-200">
                    {JSON.stringify(
                      {
                        providerNodeProbe: debugReports[channel.id].providerNodeProbe ?? null,
                        pageTokenProbe: debugReports[channel.id].pageTokenProbe ?? null,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </details>
                {((debugReports[channel.id].graph?.pageCount ?? 0) === 0 || Boolean(debugReports[channel.id].oauth?.missingRequestedScopes?.length)) && (
                  <div className="mt-2 rounded-md border border-amber-300/20 bg-amber-300/10 p-2 text-amber-100">
                    <p className="font-bold">Action needed</p>
                    <p>In Meta, add/grant the missing permissions and make sure the Facebook Page has a linked Instagram Business account. Then run Meta OAuth again.</p>
                  </div>
                )}
              </div>
            )}
          </article>
        );
      })}
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-300/15 bg-amber-300/10 p-4 text-sm leading-7 text-amber-50">
        <HiOutlineShieldCheck className="mt-1 h-5 w-5 shrink-0 text-amber-200" />
        <p>
          These cards prepare database, workflows, and onboarding state. Real message sending/receiving starts only after official platform API approval and token setup.
        </p>
      </div>
    </section>
  );
}
