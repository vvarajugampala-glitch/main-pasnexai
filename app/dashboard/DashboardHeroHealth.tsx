"use client";

import { useEffect, useState } from "react";
import { HiOutlineCheckCircle } from "react-icons/hi2";
import { SiFacebook, SiInstagram, SiMessenger, SiTelegram, SiWhatsapp } from "react-icons/si";
import { DashboardWelcomeName } from "./DashboardWelcomeName";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type DashboardStats = {
  messages: number;
  conversations: number;
  activeAutomations: number;
  leads: number;
  connectedChannels: number;
};

type Channel = {
  id: string;
  type: string;
  display_name: string;
  status: string;
};

function plural(value: number, label: string) {
  return `${value} ${label}${value === 1 ? "" : "s"}`;
}

function formatChannelName(channel: Channel) {
  return channel.display_name || channel.type.charAt(0).toUpperCase() + channel.type.slice(1);
}

const channelIconMap = {
  instagram: { Icon: SiInstagram, bg: "bg-gradient-to-br from-yellow-300 via-pink-500 to-violet-600" },
  whatsapp: { Icon: SiWhatsapp, bg: "bg-[#25D366]" },
  facebook: { Icon: SiFacebook, bg: "bg-[#1877F2]" },
  messenger: { Icon: SiMessenger, bg: "bg-[#00B2FF]" },
  telegram: { Icon: SiTelegram, bg: "bg-[#26A5E4]" },
};

function getChannelIcon(type: string) {
  return channelIconMap[type as keyof typeof channelIconMap];
}

export function DashboardHeroHealth() {
  const [stats, setStats] = useState<DashboardStats>({
    messages: 0,
    conversations: 0,
    activeAutomations: 0,
    leads: 0,
    connectedChannels: 0,
  });
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    async function loadHeroHealth() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const headers = { Authorization: `Bearer ${session.access_token}` };
      const [statsResponse, channelsResponse] = await Promise.all([
        fetch("/api/dashboard/stats", { headers }),
        fetch("/api/dashboard/channel-summary", { headers }),
      ]);

      if (statsResponse.ok) {
        const statsData = (await statsResponse.json()) as DashboardStats;
        setStats(statsData);
      }

      if (channelsResponse.ok) {
        const channelData = (await channelsResponse.json()) as { channels?: Channel[] };
        setChannels(channelData.channels ?? []);
      }
    }

    void loadHeroHealth();
  }, []);

  const connectedChannels = channels.filter((channel) => channel.status === "connected" || channel.status === "ready_to_connect");
  const hasActivity = stats.activeAutomations > 0 || stats.connectedChannels > 0 || stats.leads > 0 || stats.messages > 0 || stats.conversations > 0;

  return (
    <section className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,.24),transparent_34%),linear-gradient(135deg,#07101d,#0b1020_62%,#111827)] p-5 shadow-[0_22px_70px_rgba(0,0,0,.32)]">
      <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-300">AI workspace health</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            <DashboardWelcomeName />
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
            {hasActivity
              ? `Pasnex.ai has ${plural(stats.activeAutomations, "active automation")} prepared across ${plural(stats.connectedChannels, "channel setup")}, with ${plural(stats.conversations, "conversation")}, ${plural(stats.messages, "message")}, and ${plural(stats.leads, "lead")} tracked in your workspace.`
              : "Your Pasnex.ai workspace is ready. Prepare a channel and create your first automation to start tracking conversations and leads."}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 xl:w-[520px]">
          {[
            ["Automations", String(stats.activeAutomations), "Active"],
            ["Channels", String(stats.connectedChannels), "Prepared"],
            ["Leads", String(stats.leads), "Captured"],
          ].map(([label, value, sub]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-black">{value}</p>
              <p className="mt-1 text-xs font-bold text-blue-300">{sub}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {connectedChannels.length ? (
          connectedChannels.map((channel) => {
            const channelIcon = getChannelIcon(channel.type);
            const Icon = channelIcon?.Icon ?? HiOutlineCheckCircle;

            return (
              <span key={channel.id} className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-bold text-blue-100">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${channelIcon?.bg ?? "bg-blue-500"}`}>
                  <Icon className="h-3.5 w-3.5 text-white" />
                </span>
                {formatChannelName(channel)} setup prepared
              </span>
            );
          })
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-100">
            <HiOutlineCheckCircle className="h-4 w-4" />
            Channel setup pending
          </span>
        )}
      </div>
    </section>
  );
}
