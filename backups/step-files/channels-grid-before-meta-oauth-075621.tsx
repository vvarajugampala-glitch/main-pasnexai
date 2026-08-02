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
};

const channelOrder = ["instagram", "whatsapp", "facebook", "messenger", "telegram"];

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

export function ChannelsLiveGrid() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyType, setBusyType] = useState("");
  const [notice, setNotice] = useState("");

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

  useEffect(() => {
    let mounted = true;
    loadChannels().then((nextChannels) => {
      if (!mounted) return;
      setChannels(nextChannels);
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

      setChannels(await loadChannels());
      setNotice(`${channelMeta.name} setup prepared. API approval is still pending.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not prepare channel.");
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
      {isLoading && <p className="mt-5 text-sm text-slate-500">Loading channels...</p>}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {displayChannels.map((channel) => {
        const channelMeta = getMeta(channel.type);
        const Icon = channelMeta.Icon;
        const prepared = channel.status === "connected" || channel.status === "ready_to_connect";
        const active = channel.status === "ready_to_connect";

        return (
          <article key={channel.id} className={`group rounded-lg border bg-[#07101d]/90 p-5 shadow-[0_16px_45px_rgba(0,0,0,.2)] transition hover:-translate-y-1 hover:border-blue-300/45 hover:bg-[#0a1424] hover:shadow-[0_22px_60px_rgba(37,99,235,.18)] ${prepared ? "border-blue-300/30" : "border-white/10"}`}>
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${channelMeta.style} shadow-[0_0_24px_rgba(37,99,235,.22)]`}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${prepared ? "bg-blue-400/10 text-blue-200" : "bg-amber-400/10 text-amber-200"}`}>
                {prepared ? "Prepared" : "Available"}
              </span>
            </div>
            <h2 className="mt-5 text-xl font-black">{channelMeta.name}</h2>
            <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{channelMeta.label}</p>
            <div className="mt-5 grid gap-2 rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm">
              <div className="flex items-center justify-between text-slate-300">
                <span>Status</span>
                <span className="font-bold text-white">{prepared ? "Setup prepared" : "Not started"}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Webhook</span>
                <span className="font-bold text-white">{prepared ? channel.webhook_status ?? "api_pending" : "api_pending"}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>{active ? "Workspace" : "API approval"}</span>
                {active ? <HiCheckBadge className="h-5 w-5 text-blue-300" /> : <HiOutlineClock className="h-5 w-5 text-amber-300" />}
              </div>
            </div>
            <button onClick={() => prepareChannel(channel.type)} disabled={busyType === channel.type} className="mt-5 w-full rounded-lg border border-white/10 bg-white/[0.04] py-3 text-sm font-bold transition group-hover:border-blue-300/50 group-hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60">
              {busyType === channel.type ? "Preparing..." : prepared ? "Refresh Setup" : "Prepare Setup"}
            </button>
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
