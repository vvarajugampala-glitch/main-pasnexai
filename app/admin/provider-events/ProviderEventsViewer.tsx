"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HiOutlineArrowLeft, HiOutlineBolt, HiOutlineShieldCheck } from "react-icons/hi2";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProviderEvent = {
  id: string;
  provider: string;
  event_type: string;
  provider_account_id: string | null;
  signature_verified: boolean;
  processing_status: string;
  processing_note: string | null;
  processed_at: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

type ProviderOutboundAttempt = {
  id: string;
  provider: string;
  channel_type: string;
  recipient_id: string | null;
  endpoint: string | null;
  status: string;
  error_message: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  businesses?: { name: string | null; email: string | null } | { name: string | null; email: string | null }[] | null;
};

type ChannelReadiness = {
  id: string;
  type: string;
  displayName: string;
  handle: string | null;
  status: string;
  webhookStatus: string | null;
  business?: { name: string | null; email: string | null } | { name: string | null; email: string | null }[] | null;
  duplicateProviderHandle?: boolean;
  duplicateProviderHandleCount?: number;
  readiness: {
    providerIdSaved: boolean;
    webhookTested: boolean;
    recipientMapped: boolean;
    tokenConfigured: boolean;
    liveReady: boolean;
  };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusClass(status: string) {
  if (status === "ready_to_send") return "bg-blue-400/10 text-blue-200";
  if (status === "processed") return "bg-blue-400/10 text-blue-200";
  if (status === "setup_pending" || status === "approval_pending" || status === "recipient_mapping_pending") return "bg-amber-300/10 text-amber-100";
  if (status === "unmapped") return "bg-amber-300/10 text-amber-100";
  if (status === "failed") return "bg-red-400/10 text-red-100";
  return "bg-white/[0.05] text-slate-300";
}

export function ProviderEventsViewer() {
  const [events, setEvents] = useState<ProviderEvent[]>([]);
  const [outboundAttempts, setOutboundAttempts] = useState<ProviderOutboundAttempt[]>([]);
  const [channelReadiness, setChannelReadiness] = useState<ChannelReadiness[]>([]);
  const [setupRequired, setSetupRequired] = useState(false);
  const [outboundSetupRequired, setOutboundSetupRequired] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [testType, setTestType] = useState("instagram");
  const [testProviderAccountId, setTestProviderAccountId] = useState("");
  const [testMessage, setTestMessage] = useState("Hi, I want automation details.");
  const [testStatus, setTestStatus] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [cleanupStatus, setCleanupStatus] = useState("");
  const [cleanupChannelId, setCleanupChannelId] = useState("");
  const [openPayloadId, setOpenPayloadId] = useState("");
  const [readinessSearch, setReadinessSearch] = useState("");
  const [readinessChannelFilter, setReadinessChannelFilter] = useState("all");
  const [readinessStatusFilter, setReadinessStatusFilter] = useState("pending");

  const filteredChannelReadiness = channelReadiness
    .filter((channel) => {
      const business = Array.isArray(channel.business) ? channel.business[0] : channel.business;
      const search = readinessSearch.trim().toLowerCase();
      const haystack = [
        channel.type,
        channel.displayName,
        channel.handle,
        business?.name,
        business?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (search && !haystack.includes(search)) return false;
      if (readinessChannelFilter !== "all" && channel.type !== readinessChannelFilter) return false;

      if (readinessStatusFilter === "live") return channel.readiness.liveReady;
      if (readinessStatusFilter === "token_pending") return !channel.readiness.tokenConfigured;
      if (readinessStatusFilter === "webhook_pending") return !channel.readiness.webhookTested;
      if (readinessStatusFilter === "recipient_pending") return !channel.readiness.recipientMapped;
      if (readinessStatusFilter === "provider_id_pending") return !channel.readiness.providerIdSaved;
      if (readinessStatusFilter === "pending") return !channel.readiness.liveReady;

      return true;
    })
    .sort((a, b) => Number(a.readiness.liveReady) - Number(b.readiness.liveReady));
  const journeyStatus = {
    providerIdSaved: channelReadiness.some((channel) => channel.readiness.providerIdSaved),
    webhookTested: channelReadiness.some((channel) => channel.readiness.webhookTested),
    recipientMapped: channelReadiness.some((channel) => channel.readiness.recipientMapped),
    tokenConfigured: channelReadiness.some((channel) => channel.readiness.tokenConfigured),
    liveReady: channelReadiness.some((channel) => channel.readiness.liveReady),
    replyAttempted: outboundAttempts.length > 0,
    payloadPrepared: outboundAttempts.some((attempt) => Boolean(attempt.endpoint)),
  };
  const productionGateChecks = [
    ["Token", journeyStatus.tokenConfigured, "Provider token is stored."],
    ["Webhook", journeyStatus.webhookTested, "At least one processed webhook is confirmed."],
    ["Recipient", journeyStatus.recipientMapped, "Incoming sender id is mapped for replies."],
    ["Payload", journeyStatus.payloadPrepared, "Outbound payload has been prepared from inbox reply."],
    ["Live dispatch", journeyStatus.liveReady, "Production sending remains locked until final approval."],
  ] as const;
  const preLiveGatePassed = productionGateChecks.filter(([label]) => label !== "Live dispatch").every(([, complete]) => complete);
  const latestRealWebhook = events.find((event) => event.event_type !== "meta.test" && !String(event.payload?.source ?? "").includes("admin_test"));
  const latestWebhookAgeMinutes = latestRealWebhook
    ? Math.max(0, Math.round((Date.now() - new Date(latestRealWebhook.created_at).getTime()) / 60000))
    : null;

  const sendTestEvent = async () => {
    setIsSendingTest(true);
    setTestStatus("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Admin login required.");
      }

      const response = await fetch("/api/admin/provider-events/test", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: testType,
          providerAccountId: testProviderAccountId,
          message: testMessage,
        }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not send test webhook.");
      }

      setTestStatus("Test webhook sent. Refreshing events...");
      setRefreshKey((value) => value + 1);
    } catch (eventError) {
      setTestStatus(eventError instanceof Error ? eventError.message : "Could not send test webhook.");
    } finally {
      setIsSendingTest(false);
    }
  };

  const clearDuplicateProviderHandles = async (channel: ChannelReadiness) => {
    if (!channel.handle) return;

    setCleanupChannelId(channel.id);
    setCleanupStatus("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Admin login required.");
      }

      const response = await fetch("/api/admin/provider-events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "clear_duplicate_provider_handles",
          type: channel.type,
          handle: channel.handle,
          keepChannelId: channel.id,
        }),
      });
      const result = (await response.json()) as { ok?: boolean; cleared?: number; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not clear duplicate provider IDs.");
      }

      setCleanupStatus(`Cleared ${result.cleared ?? 0} duplicate provider ID(s).`);
      setRefreshKey((value) => value + 1);
    } catch (cleanupError) {
      setCleanupStatus(cleanupError instanceof Error ? cleanupError.message : "Could not clear duplicate provider IDs.");
    } finally {
      setCleanupChannelId("");
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadInitialEvents = async () => {
      setIsLoading(true);
      setError("");

      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Admin login required.");
        }

        const response = await fetch("/api/admin/provider-events", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const result = (await response.json()) as {
          events?: ProviderEvent[];
          outboundAttempts?: ProviderOutboundAttempt[];
          channelReadiness?: ChannelReadiness[];
          setupRequired?: boolean;
          outboundSetupRequired?: boolean;
          error?: string;
        };

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            window.location.href = "/admin/login?error=admin_access_required";
            return;
          }

          throw new Error(result.error ?? "Could not load provider events.");
        }

        if (!mounted) return;
        setEvents(result.events ?? []);
        setOutboundAttempts(result.outboundAttempts ?? []);
        setChannelReadiness(result.channelReadiness ?? []);
        setSetupRequired(Boolean(result.setupRequired));
        setOutboundSetupRequired(Boolean(result.outboundSetupRequired));
      } catch (eventError) {
        if (!mounted) return;
        setError(eventError instanceof Error ? eventError.message : "Could not load provider events.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadInitialEvents();

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 transition hover:text-white">
              <HiOutlineArrowLeft className="h-5 w-5" />
              Back to Admin
            </Link>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Provider Events</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Webhook event monitor</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              Confirm real Meta, Instagram, Messenger, and WhatsApp webhooks are reaching Pasnex.ai during provider testing.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-bold shadow-[0_0_28px_rgba(37,99,235,.3)]"
            >
              Refresh Events
            </button>
            <Link
              href="/dashboard/inbox"
              className="rounded-lg border border-blue-300/20 bg-blue-400/10 px-5 py-3 text-center text-sm font-bold text-blue-100 transition hover:bg-blue-400/15"
            >
              Open Inbox
            </Link>
          </div>
        </header>

        {isLoading && <p className="mt-5 text-sm text-slate-500">Loading provider events...</p>}
        {error && <p className="mt-5 rounded-lg border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</p>}
        {setupRequired && (
          <div className="mt-5 rounded-lg border border-amber-300/15 bg-amber-300/10 p-4 text-sm leading-7 text-amber-50">
            Run <span className="font-bold">docs/supabase-provider-webhook-events.sql</span> in Supabase SQL editor, then refresh this page.
          </div>
        )}
        {outboundSetupRequired && (
          <div className="mt-5 rounded-lg border border-amber-300/15 bg-amber-300/10 p-4 text-sm leading-7 text-amber-50">
            Run <span className="font-bold">docs/supabase-provider-outbound.sql</span> in Supabase SQL editor to store outbound reply attempts.
          </div>
        )}

        <section className={`mt-6 rounded-lg border p-5 ${preLiveGatePassed ? "border-blue-300/20 bg-blue-400/10" : "border-amber-300/15 bg-amber-300/10"}`}>
          <HiOutlineShieldCheck className={`h-7 w-7 ${preLiveGatePassed ? "text-blue-300" : "text-amber-200"}`} />
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-blue-300">Production Send Gate</p>
              <h2 className="mt-2 text-2xl font-black">{journeyStatus.liveReady ? "Live dispatch ready" : preLiveGatePassed ? "Pre-live provider checks passed" : "Live dispatch locked"}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
                Real provider sending stays disabled until production approval is complete and <span className="font-bold">PROVIDER_LIVE_DISPATCH_ENABLED=true</span> is set deliberately.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#030712]/70 px-4 py-3 text-center">
              <p className="text-2xl font-black">
                {productionGateChecks.filter(([, complete]) => complete).length}/{productionGateChecks.length}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Gate checks</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {productionGateChecks.map(([label, complete, detail]) => (
              <article key={label} className="rounded-lg border border-white/10 bg-[#030712]/70 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                <p className={`mt-2 text-sm font-black ${complete ? "text-blue-200" : "text-amber-100"}`}>
                  {complete ? (label === "Live dispatch" ? "Ready" : "Complete") : label === "Live dispatch" ? "Disabled" : "Pending"}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-blue-300/15 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-cyan-500/10 p-5">
          <HiOutlineShieldCheck className="h-7 w-7 text-blue-300" />
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-blue-300">Provider Test Journey</p>
              <h2 className="mt-2 text-2xl font-black">Validate one full automation loop</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
                Use this path before real Meta approval: save provider ID, receive a webhook, map recipient, reply from inbox, and confirm the outbound payload attempt.
              </p>
            </div>
            <Link
              href="/admin#client-businesses"
              className="rounded-lg border border-blue-300/20 bg-blue-400/10 px-4 py-2.5 text-center text-sm font-bold text-blue-100 transition hover:bg-blue-400/15"
            >
              View Clients
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {[
              ["1", "Provider ID", "Save channel test ID", journeyStatus.providerIdSaved],
              ["2", "Webhook", "Send provider test", journeyStatus.webhookTested],
              ["3", "Recipient", "Map sender id", journeyStatus.recipientMapped],
              ["4", "Inbox Reply", "Send a reply", journeyStatus.replyAttempted],
              ["5", "Payload", "Confirm outbound attempt", journeyStatus.payloadPrepared],
            ].map(([step, title, detail, complete]) => (
              <article key={String(title)} className="rounded-lg border border-white/10 bg-[#07101d]/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-black">{step}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${complete ? "bg-blue-400/10 text-blue-200" : "bg-amber-300/10 text-amber-100"}`}>
                    {complete ? "Complete" : "Pending"}
                  </span>
                </div>
                <h3 className="mt-4 font-black">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Total events", events.length],
            ["Signature verified", events.filter((event) => event.signature_verified).length],
            ["Unmapped", events.filter((event) => event.processing_status === "unmapped").length],
          ].map(([label, value]) => (
            <article key={String(label)} className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
              <HiOutlineBolt className="h-7 w-7 text-blue-300" />
              <p className="mt-4 text-3xl font-black">{value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-400">{label}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-lg border border-blue-300/20 bg-blue-400/10 p-5">
          <HiOutlineShieldCheck className="h-7 w-7 text-blue-200" />
          <h2 className="mt-4 text-xl font-black">Real webhook delivery check</h2>
          {latestRealWebhook ? (
            <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-300 md:grid-cols-3">
              <p className="rounded-lg bg-[#030712]/60 p-3">
                Last real event<br />
                <span className="font-black text-white">{formatDate(latestRealWebhook.created_at)}</span>
              </p>
              <p className="rounded-lg bg-[#030712]/60 p-3">
                Provider ID<br />
                <span className="font-black text-white">{latestRealWebhook.provider_account_id ?? "Not found"}</span>
              </p>
              <p className="rounded-lg bg-[#030712]/60 p-3">
                Status<br />
                <span className="font-black text-white">{latestRealWebhook.processing_status.replaceAll("_", " ")}</span>
              </p>
              <p className="md:col-span-3">
                If a new Instagram DM is sent now and this timestamp does not change after Refresh Events, Meta did not deliver a webhook to Pasnex. Then check Meta app mode, tester role, webhook subscription, and Instagram messaging permissions.
                {latestWebhookAgeMinutes !== null ? ` Last delivery was about ${latestWebhookAgeMinutes} minutes ago.` : ""}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-300">
              No real provider webhook has been received yet. Internal tests can still work because they bypass Meta delivery.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <HiOutlineShieldCheck className="h-7 w-7 text-blue-300" />
          <h2 className="mt-4 text-xl font-black">Channel provider readiness</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Separate prepared channels from real live-send readiness across provider ID, webhook test, recipient mapping, token, and approval status.
          </p>
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_220px]">
            <input
              value={readinessSearch}
              onChange={(event) => setReadinessSearch(event.target.value)}
              placeholder="Search client, email, provider ID..."
              className="h-11 rounded-lg border border-white/10 bg-[#030712] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
            />
            <select
              value={readinessChannelFilter}
              onChange={(event) => setReadinessChannelFilter(event.target.value)}
              className="h-11 rounded-lg border border-white/10 bg-[#030712] px-3 text-sm font-bold text-slate-100 outline-none"
            >
              <option value="all">All channels</option>
              <option value="instagram">Instagram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="facebook">Facebook</option>
              <option value="messenger">Messenger</option>
              <option value="telegram">Telegram</option>
            </select>
            <select
              value={readinessStatusFilter}
              onChange={(event) => setReadinessStatusFilter(event.target.value)}
              className="h-11 rounded-lg border border-white/10 bg-[#030712] px-3 text-sm font-bold text-slate-100 outline-none"
            >
              <option value="pending">Needs attention</option>
              <option value="all">All statuses</option>
              <option value="provider_id_pending">Provider ID pending</option>
              <option value="webhook_pending">Webhook pending</option>
              <option value="recipient_pending">Recipient pending</option>
              <option value="token_pending">Token pending</option>
              <option value="live">Live ready</option>
            </select>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Needs attention", channelReadiness.filter((channel) => !channel.readiness.liveReady).length],
              ["Webhook pending", channelReadiness.filter((channel) => !channel.readiness.webhookTested).length],
              ["Token pending", channelReadiness.filter((channel) => !channel.readiness.tokenConfigured).length],
              ["Live ready", channelReadiness.filter((channel) => channel.readiness.liveReady).length],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border border-white/10 bg-[#030712]/70 p-3">
                <p className="text-2xl font-black">{value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 xl:grid-cols-2">
            {filteredChannelReadiness.map((channel) => {
              const business = Array.isArray(channel.business) ? channel.business[0] : channel.business;
              const checks = [
                ["Provider ID", channel.readiness.providerIdSaved],
                ["Webhook", channel.readiness.webhookTested],
                ["Recipient", channel.readiness.recipientMapped],
                ["Token", channel.readiness.tokenConfigured],
                ["Live send", channel.readiness.liveReady],
              ] as const;

              return (
                <article key={channel.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-black capitalize">{channel.type} - {channel.displayName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {business?.name ?? "Workspace"} {business?.email ? `- ${business.email}` : ""}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">Provider ID: {channel.handle ?? "Not saved"}</p>
                      {channel.duplicateProviderHandle && (
                        <p className="mt-2 rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100">
                          Same provider ID is used by {channel.duplicateProviderHandleCount} workspaces. Webhook tests can appear under multiple clients until duplicate test channels are cleaned.
                        </p>
                      )}
                      {channel.duplicateProviderHandle && (
                        <button
                          type="button"
                          onClick={() => void clearDuplicateProviderHandles(channel)}
                          disabled={cleanupChannelId === channel.id}
                          className="mt-2 rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {cleanupChannelId === channel.id ? "Cleaning..." : "Keep this channel, clear duplicates"}
                        </button>
                      )}
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${channel.readiness.liveReady ? "bg-blue-400/10 text-blue-200" : "bg-amber-300/10 text-amber-100"}`}>
                      {channel.readiness.liveReady ? "live ready" : "setup pending"}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-5">
                    {checks.map(([label, complete]) => (
                      <div key={label} className="rounded-lg border border-white/10 bg-[#030712]/70 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                        <p className={`mt-2 text-xs font-black ${complete ? "text-blue-200" : "text-amber-100"}`}>
                          {complete ? (label === "Live send" ? "Ready" : "Complete") : "Pending"}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
            {!isLoading && channelReadiness.length === 0 && (
              <p className="rounded-lg bg-white/[0.035] p-4 text-sm text-slate-500">
                No prepared channels yet. Client channel setup will appear here after onboarding.
              </p>
            )}
            {!isLoading && channelReadiness.length > 0 && filteredChannelReadiness.length === 0 && (
              <p className="rounded-lg bg-white/[0.035] p-4 text-sm text-slate-500">
                No channels match this filter.
              </p>
            )}
          </div>
        </section>

        {cleanupStatus && (
          <div className="mt-4 rounded-lg border border-blue-400/20 bg-blue-400/10 p-3 text-sm font-semibold text-blue-100">
            {cleanupStatus}
          </div>
        )}

        <section className="mt-6 rounded-lg border border-violet-300/20 bg-violet-400/10 p-5">
          <HiOutlineBolt className="h-7 w-7 text-violet-200" />
          <h2 className="mt-4 text-xl font-black">Send test webhook</h2>
          <p className="mt-2 text-sm leading-6 text-violet-50/80">
            Simulate a Meta provider event to test raw storage and inbox mapping before real provider approval.
          </p>
          <div className="mt-5 grid gap-3 lg:grid-cols-[180px_1fr_1.2fr_auto]">
            <select
              value={testType}
              onChange={(event) => setTestType(event.target.value)}
              className="h-11 rounded-lg border border-white/10 bg-[#030712] px-3 text-sm font-bold text-slate-100 outline-none"
            >
              <option value="instagram">Instagram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="messenger">Messenger</option>
              <option value="facebook">Facebook</option>
            </select>
            <input
              value={testProviderAccountId}
              onChange={(event) => setTestProviderAccountId(event.target.value)}
              placeholder="Provider account ID / entry.id"
              className="h-11 rounded-lg border border-white/10 bg-[#030712] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
            />
            <input
              value={testMessage}
              onChange={(event) => setTestMessage(event.target.value)}
              placeholder="Customer message text"
              className="h-11 rounded-lg border border-white/10 bg-[#030712] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
            />
            <button
              type="button"
              onClick={() => void sendTestEvent()}
              disabled={isSendingTest || !testProviderAccountId.trim()}
              className="h-11 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSendingTest ? "Sending..." : "Send Test"}
            </button>
          </div>
          {testStatus && <p className="mt-3 rounded-lg border border-white/10 bg-[#030712]/70 p-3 text-sm text-violet-50">{testStatus}</p>}
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <HiOutlineBolt className="h-7 w-7 text-blue-300" />
          <h2 className="mt-4 text-xl font-black">Outbound reply attempts</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Track every inbox reply that Pasnex.ai prepared for provider delivery, including setup blockers before real API approval.
          </p>
          <div className="mt-5 grid gap-3">
            {outboundAttempts.map((attempt) => {
              const business = Array.isArray(attempt.businesses) ? attempt.businesses[0] : attempt.businesses;

              return (
                <article key={attempt.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-black capitalize">{attempt.channel_type} - {attempt.status.replaceAll("_", " ")}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {business?.name ?? "Workspace"} {business?.email ? `- ${business.email}` : ""} - {formatDate(attempt.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(attempt.status)}`}>
                        {attempt.status.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-100">
                        {attempt.recipient_id ?? "recipient pending"}
                      </span>
                    </div>
                  </div>
                  {attempt.error_message && (
                    <p className="mt-3 rounded-lg border border-amber-300/10 bg-amber-300/10 p-3 text-xs leading-5 text-amber-50">
                      {attempt.error_message}
                    </p>
                  )}
                  <div className="mt-3 rounded-lg border border-white/10 bg-[#030712]/70 p-3 text-xs leading-5 text-slate-300">
                    <span className="font-bold text-slate-100">Endpoint:</span> {attempt.endpoint ?? "Not ready"}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenPayloadId((current) => (current === attempt.id ? "" : attempt.id))}
                    className="mt-3 rounded-lg border border-blue-300/20 bg-blue-400/10 px-4 py-2 text-xs font-bold text-blue-100 transition hover:bg-blue-400/15"
                  >
                    {openPayloadId === attempt.id ? "Hide Payload" : "Show Payload"}
                  </button>
                  {openPayloadId === attempt.id && (
                    <pre className="mt-3 max-h-56 overflow-auto rounded-lg border border-white/10 bg-[#030712] p-3 text-xs leading-5 text-slate-300">
                      {JSON.stringify(attempt.payload, null, 2)}
                    </pre>
                  )}
                </article>
              );
            })}
            {!isLoading && !outboundSetupRequired && outboundAttempts.length === 0 && (
              <p className="rounded-lg bg-white/[0.035] p-4 text-sm text-slate-500">
                No outbound reply attempts yet. Send a reply from the inbox to create the first outbound log.
              </p>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <HiOutlineShieldCheck className="h-7 w-7 text-blue-300" />
          <h2 className="mt-4 text-xl font-black">Latest webhook payloads</h2>
          <div className="mt-5 grid gap-3">
            {events.map((event) => (
              <article key={event.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black capitalize">{event.provider} - {event.event_type}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {event.provider_account_id ?? "No provider account id"} - {formatDate(event.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${event.signature_verified ? "bg-blue-400/10 text-blue-200" : "bg-amber-300/10 text-amber-100"}`}>
                      {event.signature_verified ? "signature verified" : "signature not configured"}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(event.processing_status)}`}>
                      {event.processing_status.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>
                {event.processing_note && (
                  <p className="mt-3 rounded-lg border border-white/10 bg-[#030712]/70 p-3 text-xs leading-5 text-slate-300">
                    {event.processing_note}
                  </p>
                )}
                <pre className="mt-4 max-h-56 overflow-auto rounded-lg border border-white/10 bg-[#030712] p-3 text-xs leading-5 text-slate-300">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </article>
            ))}
            {!isLoading && !setupRequired && events.length === 0 && (
              <p className="rounded-lg bg-white/[0.035] p-4 text-sm text-slate-500">
                No provider webhook events yet. After Meta sends a test event, it will appear here.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
