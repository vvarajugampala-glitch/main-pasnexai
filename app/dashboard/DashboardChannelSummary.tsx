"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HiOutlineGlobeAlt } from "react-icons/hi2";
import { SiFacebook, SiInstagram, SiMessenger, SiTelegram, SiWhatsapp } from "react-icons/si";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Channel = {
  id: string;
  type: string;
  display_name: string;
  handle: string | null;
  status: string;
  webhook_status: string | null;
  connected_at: string | null;
};

const channelMeta = {
  instagram: { label: "Instagram", Icon: SiInstagram, bg: "bg-gradient-to-br from-yellow-300 via-pink-500 to-violet-600" },
  whatsapp: { label: "WhatsApp", Icon: SiWhatsapp, bg: "bg-[#25D366]" },
  facebook: { label: "Facebook", Icon: SiFacebook, bg: "bg-[#1877F2]" },
  messenger: { label: "Messenger", Icon: SiMessenger, bg: "bg-[#00B2FF]" },
  telegram: { label: "Telegram", Icon: SiTelegram, bg: "bg-[#26A5E4]" },
};

function getMeta(type: string) {
  return channelMeta[type as keyof typeof channelMeta] ?? {
    label: "Channel",
    Icon: HiOutlineGlobeAlt,
    bg: "bg-gradient-to-br from-violet-600 to-blue-600",
  };
}

export function DashboardChannelStatusCard() {
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    async function loadChannels() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch("/api/dashboard/channel-summary", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) return;

      const data = (await response.json()) as { channels?: Channel[] };
      setChannels(data.channels ?? []);
    }

    void loadChannels();
  }, []);

  const connected = channels.filter((channel) => channel.status === "connected" || channel.status === "ready_to_connect");
  const primary = connected[0] ?? channels[0];
  const primaryMeta = primary ? getMeta(primary.type) : getMeta("channel");
  const PrimaryIcon = primaryMeta.Icon;

  return (
    <article className="group rounded-lg border border-white/10 bg-[#07101d]/90 p-4 shadow-[0_16px_45px_rgba(0,0,0,.2)] transition hover:-translate-y-1 hover:border-blue-300/45 hover:bg-[#0a1424] hover:shadow-[0_22px_60px_rgba(37,99,235,.16)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">Channel Status</p>
          <p className="mt-1.5 text-2xl font-black">{primary ? primaryMeta.label : "No channel prepared"}</p>
          <p className={`mt-1 text-xs font-bold ${primary ? "text-blue-300" : "text-amber-300"}`}>
            {primary ? "Setup prepared" : "Ready to prepare"}
          </p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${primaryMeta.bg}`}>
          <PrimaryIcon className="h-6 w-6 text-white" />
        </span>
      </div>
      <div className="mt-4 flex items-center">
        {(channels.length ? channels : [{ id: "empty", type: "channel" } as Channel]).slice(0, 5).map((channel, index) => {
          const meta = getMeta(channel.type);
          const Icon = meta.Icon;
          return (
            <span key={channel.id} className={`${index ? "-ml-2" : ""} flex h-8 w-8 items-center justify-center rounded-full ${meta.bg} ring-2 ring-[#07101d]`}>
              <Icon className="h-4 w-4 text-white" />
            </span>
          );
        })}
      </div>
    </article>
  );
}

export function DashboardChannelsPanel() {
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    async function loadChannels() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch("/api/dashboard/channel-summary", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) return;

      const data = (await response.json()) as { channels?: Channel[] };
      setChannels(data.channels ?? []);
    }

    void loadChannels();
  }, []);

  const connected = useMemo(() => channels.filter((channel) => channel.status === "connected" || channel.status === "ready_to_connect"), [channels]);
  const primary = connected[0] ?? channels[0];
  const primaryMeta = primary ? getMeta(primary.type) : getMeta("channel");
  const PrimaryIcon = primaryMeta.Icon;

  return (
    <section className="rounded-lg border border-white/10 bg-[#07101d]/90 p-4 shadow-[0_18px_60px_rgba(0,0,0,.18)]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">Channel Setup</h2>
        <Link href="/dashboard/channels" className="text-xs font-bold text-blue-300">View all</Link>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${primaryMeta.bg} shadow-[0_0_24px_rgba(96,165,250,.18)]`}>
          <PrimaryIcon className="h-7 w-7 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{primary ? primaryMeta.label : "No channel prepared"}</p>
          <p className="text-xs text-slate-500">
            {connected.length ? `${connected.length} setup prepared` : "Run onboarding to prepare"}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${primary ? "bg-blue-400/10 text-blue-200" : "bg-amber-400/10 text-amber-200"}`}>
          {primary ? "Prepared" : "Ready"}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        <div className="flex justify-between text-slate-400"><span>API status</span><span className="text-blue-300">{primary?.webhook_status ?? "pending"}</span></div>
        <div className="flex justify-between text-slate-400"><span>Permissions</span><span className="text-amber-300">Needs provider approval</span></div>
        <div className="flex justify-between text-slate-400"><span>Coverage</span><span className="text-blue-300">{primary ? "Ready for setup" : "Not started"}</span></div>
      </div>
    </section>
  );
}
