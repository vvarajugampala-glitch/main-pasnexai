"use client";

import { useEffect, useState } from "react";
import {
  HiOutlineBolt,
  HiOutlineChatBubbleLeftRight,
  HiOutlineGlobeAlt,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { SiFacebook, SiInstagram, SiMessenger, SiTelegram, SiWhatsapp } from "react-icons/si";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type DashboardStats = {
  messages: number;
  activeAutomations: number;
  leads: number;
  connectedChannels: number;
  primaryChannel?: {
    type: string;
    display_name: string | null;
  } | null;
  trends?: {
    messages: number[];
    activeAutomations: number[];
    leads: number[];
    connectedChannels: number[];
  };
};

const channelIconMap = {
  instagram: SiInstagram,
  whatsapp: SiWhatsapp,
  facebook: SiFacebook,
  messenger: SiMessenger,
  telegram: SiTelegram,
};

const channelIconClassMap = {
  instagram: "bg-gradient-to-br from-yellow-300 via-pink-500 to-violet-600 text-white",
  whatsapp: "bg-[#25D366] text-white",
  facebook: "bg-[#1877F2] text-white",
  messenger: "bg-[#00B2FF] text-white",
  telegram: "bg-[#26A5E4] text-white",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function buildSparklinePoints(values: number[] = []) {
  const series = values.length ? values : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...series, 1);
  const width = 168;
  const height = 32;
  const step = width / Math.max(series.length - 1, 1);

  return series
    .map((value, index) => {
      const x = Math.round(index * step);
      const y = Math.round(height - 5 - (value / max) * 22);
      return `${x},${y}`;
    })
    .join(" ");
}

export function DashboardStatsGrid() {
  const [stats, setStats] = useState<DashboardStats>({
    messages: 0,
    activeAutomations: 0,
    leads: 0,
    connectedChannels: 0,
    trends: {
      messages: [],
      activeAutomations: [],
      leads: [],
      connectedChannels: [],
    },
  });

  useEffect(() => {
    async function loadStats() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) return;

      const data = (await response.json()) as DashboardStats;
      setStats(data);
    }

    void loadStats();
  }, []);

  const items = [
    {
      label: "Messages",
      value: formatNumber(stats.messages),
      change: stats.messages ? "Live from inbox" : "No messages yet",
      trend: stats.trends?.messages,
      Icon: HiOutlineChatBubbleLeftRight,
      color: "blue",
    },
    {
      label: "Active Automations",
      value: formatNumber(stats.activeAutomations),
      change: stats.activeAutomations ? "Ready to run" : "Create first workflow",
      trend: stats.trends?.activeAutomations,
      Icon: HiOutlineBolt,
      color: "emerald",
    },
    {
      label: "New Leads",
      value: formatNumber(stats.leads),
      change: stats.leads ? "Captured leads" : "No leads yet",
      trend: stats.trends?.leads,
      Icon: HiOutlineUserGroup,
      color: "amber",
    },
    {
      label: "Prepared Channels",
      value: formatNumber(stats.connectedChannels),
      change: stats.primaryChannel?.display_name ?? (stats.connectedChannels ? "API setup pending" : "Prepare a channel"),
      trend: stats.trends?.connectedChannels,
      Icon: channelIconMap[stats.primaryChannel?.type as keyof typeof channelIconMap] ?? HiOutlineGlobeAlt,
      iconClass: channelIconClassMap[stats.primaryChannel?.type as keyof typeof channelIconClassMap],
      color: "violet",
    },
  ];

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ label, value, change, trend, Icon, iconClass, color }) => {
        const sparklinePoints = buildSparklinePoints(trend);

        return (
          <article key={label} className="group rounded-lg border border-white/10 bg-[#07101d]/90 p-4 shadow-[0_16px_45px_rgba(0,0,0,.2)] transition hover:-translate-y-1 hover:border-blue-300/45 hover:bg-[#0a1424] hover:shadow-[0_22px_60px_rgba(37,99,235,.16)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className="mt-1.5 text-2xl font-black">{value}</p>
                <p className={`mt-1 text-xs font-bold ${color === "emerald" ? "text-emerald-300" : color === "amber" ? "text-amber-300" : color === "violet" ? "text-violet-300" : "text-blue-300"}`}>{change}</p>
              </div>
              <div className={`rounded-xl p-3 ${iconClass ?? (color === "emerald" ? "bg-emerald-400/15 text-emerald-300" : color === "amber" ? "bg-amber-400/15 text-amber-300" : color === "violet" ? "bg-violet-400/15 text-violet-300" : "bg-blue-400/15 text-blue-300")}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 h-8">
              <svg viewBox="0 0 168 32" className="h-full w-full" preserveAspectRatio="none">
                <polyline points={`${sparklinePoints} 168,32 0,32`} fill={color === "emerald" ? "rgba(52,211,153,.14)" : color === "amber" ? "rgba(251,191,36,.14)" : color === "violet" ? "rgba(167,139,250,.14)" : "rgba(96,165,250,.14)"} />
                <polyline points={sparklinePoints} fill="none" stroke={color === "emerald" ? "#34d399" : color === "amber" ? "#fbbf24" : color === "violet" ? "#a78bfa" : "#60a5fa"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </article>
        );
      })}
    </div>
  );
}
