"use client";

import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowTrendingUp,
  HiOutlineBolt,
  HiOutlineChartBar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineGlobeAlt,
} from "react-icons/hi2";
import { SiFacebook, SiInstagram, SiMessenger, SiTelegram, SiWhatsapp } from "react-icons/si";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Stats = {
  messages: number;
  activeAutomations: number;
  leads: number;
  connectedChannels: number;
};

type GrowthPoint = {
  label: string;
  value: number;
};

type Channel = {
  id: string;
  type: string;
  display_name: string;
  status: string;
  webhook_status: string | null;
};

type Automation = {
  id: string;
  name: string;
  status: string;
  trigger_type: string;
  channels: { type: string; display_name: string } | null;
};

type Lead = {
  id: string;
  name: string;
  source: string | null;
  status: string;
  score: number;
  interest: string | null;
};

const channelMeta = {
  instagram: { name: "Instagram", Icon: SiInstagram, icon: "bg-gradient-to-br from-yellow-300 via-pink-500 to-violet-600 text-white", bar: "bg-gradient-to-r from-pink-500 to-violet-500" },
  whatsapp: { name: "WhatsApp", Icon: SiWhatsapp, icon: "bg-[#25D366] text-white", bar: "bg-[#25D366]" },
  facebook: { name: "Facebook", Icon: SiFacebook, icon: "bg-[#1877F2] text-white", bar: "bg-[#1877F2]" },
  messenger: { name: "Messenger", Icon: SiMessenger, icon: "bg-[#00B2FF] text-white", bar: "bg-[#00B2FF]" },
  telegram: { name: "Telegram", Icon: SiTelegram, icon: "bg-[#26A5E4] text-white", bar: "bg-[#26A5E4]" },
};

function getChannelMeta(type?: string | null) {
  return channelMeta[type as keyof typeof channelMeta] ?? {
    name: "Workspace",
    Icon: HiOutlineGlobeAlt,
    icon: "bg-blue-500/15 text-blue-300",
    bar: "bg-blue-400",
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function buildLinePoints(points: GrowthPoint[]) {
  const max = Math.max(...points.map((point) => point.value), 1);
  return points
    .map((point, index) => {
      const x = points.length === 1 ? 0 : (index / (points.length - 1)) * 560;
      const y = 100 - (point.value / max) * 76;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function AnalyticsLiveWorkspace() {
  const [stats, setStats] = useState<Stats>({ messages: 0, activeAutomations: 0, leads: 0, connectedChannels: 0 });
  const [growth, setGrowth] = useState<GrowthPoint[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadAnalytics() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const headers = { Authorization: `Bearer ${session.access_token}` };
      const [statsResponse, growthResponse, channelsResponse, automationsResponse, leadsResponse] = await Promise.all([
        fetch("/api/dashboard/stats", { headers }),
        fetch("/api/dashboard/growth", { headers }),
        fetch("/api/dashboard/channel-summary", { headers }),
        fetch("/api/dashboard/automations-summary", { headers }),
        fetch("/api/dashboard/leads", { headers }),
      ]);

      if (!mounted) return;

      if (statsResponse.ok) {
        setStats((await statsResponse.json()) as Stats);
      }
      if (growthResponse.ok) {
        const data = (await growthResponse.json()) as { points?: GrowthPoint[] };
        setGrowth(data.points ?? []);
      }
      if (channelsResponse.ok) {
        const data = (await channelsResponse.json()) as { channels?: Channel[] };
        setChannels(data.channels ?? []);
      }
      if (automationsResponse.ok) {
        const data = (await automationsResponse.json()) as { automations?: Automation[] };
        setAutomations(data.automations ?? []);
      }
      if (leadsResponse.ok) {
        const data = (await leadsResponse.json()) as { leads?: Lead[] };
        setLeads(data.leads ?? []);
      }
      setIsLoading(false);
    }

    void loadAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  const qualifiedLeads = leads.filter((lead) => lead.status === "qualified" || lead.status === "converted").length;
  const conversionRate = leads.length ? Math.round((qualifiedLeads / leads.length) * 100) : 0;
  const averageLeadScore = leads.length ? Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length) : 0;
  const linePoints = buildLinePoints(growth.length ? growth : [{ label: "Now", value: 0 }]);

  const channelPerformance = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lead of leads) {
      counts.set(lead.source ?? "workspace", (counts.get(lead.source ?? "workspace") ?? 0) + 1);
    }

    return ["instagram", "whatsapp", "facebook", "messenger", "telegram"].map((type) => {
      const count = counts.get(type) ?? 0;
      const percent = leads.length ? Math.max(8, Math.round((count / leads.length) * 100)) : channels.some((channel) => channel.type === type) ? 18 : 8;
      return { type, count, percent, prepared: channels.some((channel) => channel.type === type) };
    });
  }, [channels, leads]);

  const topAutomations = automations.length
    ? automations
    : [{ id: "empty", name: "Create your first automation", status: "draft", trigger_type: "setup", channels: null }];

  const cards = [
    { label: "Messages", value: formatNumber(stats.messages), change: stats.messages ? "Live data" : "No messages yet", Icon: HiOutlineChatBubbleLeftRight },
    { label: "Lead Conversion", value: `${conversionRate}%`, change: `${qualifiedLeads}/${leads.length} qualified`, Icon: HiOutlineArrowTrendingUp },
    { label: "Active Automations", value: formatNumber(stats.activeAutomations), change: "Ready flows", Icon: HiOutlineBolt },
    { label: "Prepared Channels", value: `${stats.connectedChannels}/5`, change: "API pending", Icon: HiOutlineGlobeAlt },
  ];

  return (
    <>
      {isLoading && <p className="mt-5 text-sm text-slate-500">Loading analytics...</p>}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, change, Icon }) => (
          <article key={label} className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <div className="flex items-center justify-between">
              <Icon className="h-7 w-7 text-blue-300" />
              <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-200">{change}</span>
            </div>
            <p className="mt-5 text-3xl font-black">{value}</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">{label}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Message and lead growth</h2>
            <HiOutlineChartBar className="h-6 w-6 text-blue-300" />
          </div>
          <div className="mt-6 h-64 rounded-lg border border-white/10 bg-[#030712] p-5">
            <div className="relative grid h-full grid-rows-[1fr_auto] gap-3">
              <div className="absolute inset-0 grid grid-rows-4">
                {[0, 1, 2, 3].map((line) => (
                  <span key={line} className="border-t border-white/5" />
                ))}
              </div>
              <svg viewBox="0 0 560 110" className="relative h-full w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="analyticsFillLive" x1="0" x2="0" y1="0" y2="1">
                    <stop stopColor="#38bdf8" stopOpacity="0.32" />
                    <stop offset="1" stopColor="#7c3aed" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="analyticsLineLive" x1="0" x2="1" y1="0" y2="0">
                    <stop stopColor="#22d3ee" />
                    <stop offset="0.5" stopColor="#60a5fa" />
                    <stop offset="1" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <polyline points={`${linePoints} 560,110 0,110`} fill="url(#analyticsFillLive)" />
                <polyline points={linePoints} fill="none" stroke="url(#analyticsLineLive)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                {linePoints.split(" ").map((point) => {
                  const [x, y] = point.split(",");
                  return <circle key={point} cx={x} cy={y} r="5" fill="#60a5fa" stroke="#030712" strokeWidth="3" />;
                })}
              </svg>
              <div className="grid grid-cols-7 text-center text-[10px] text-slate-600">
                {(growth.length ? growth : [{ label: "Now", value: 0 }]).map((point) => (
                  <span key={point.label}>{point.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <h2 className="text-xl font-black">Channel Performance</h2>
          <div className="mt-5 grid gap-4">
            {channelPerformance.map(({ type, count, percent, prepared }) => {
              const meta = getChannelMeta(type);
              const Icon = meta.Icon;
              return (
                <div key={type} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.icon}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block font-bold">{meta.name}</span>
                        <span className="text-xs text-slate-500">{count} leads - {prepared ? "Prepared" : "Available"}</span>
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-300">{percent}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/[0.06]">
                    <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <h2 className="text-xl font-black">Audience Insights</h2>
          <div className="mt-5 grid gap-3">
            {[
              ["Total leads", formatNumber(leads.length)],
              ["Qualified leads", formatNumber(qualifiedLeads)],
              ["Average lead score", `${averageLeadScore}/100`],
              ["Most active channel", channelPerformance.sort((a, b) => b.count - a.count)[0] ? getChannelMeta(channelPerformance.sort((a, b) => b.count - a.count)[0].type).name : "Not enough data"],
              ["Common intent", leads.find((lead) => lead.interest)?.interest ?? "Start capturing conversations"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between rounded-lg bg-white/[0.035] p-4 text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="font-bold text-slate-200">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <h2 className="text-xl font-black">Best performing automations</h2>
          <div className="mt-5 grid gap-3">
            {topAutomations.map((automation, index) => {
              const meta = getChannelMeta(automation.channels?.type);
              const Icon = meta.Icon;
              return (
                <div key={automation.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.icon}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-bold">{automation.name}</span>
                  </div>
                  <span className="text-sm text-slate-400">{automation.status}</span>
                  <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-200">{Math.max(18, 46 - index * 6)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-3">
        {[
          ["Revenue influenced", `INR ${formatNumber(qualifiedLeads * 2499)}`, "Estimated from qualified leads using starter pricing."],
          ["Saved support hours", `${Math.max(0, Math.round(stats.messages * 0.08))}h`, "Estimated repetitive conversation time saved."],
          ["Recommended next move", stats.connectedChannels < 5 ? "Prepare remaining channels" : "Train AI replies", "Keeps the workspace moving toward launch readiness."],
        ].map(([label, value, text]) => (
          <article key={label} className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black">{value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
          </article>
        ))}
      </section>
    </>
  );
}
