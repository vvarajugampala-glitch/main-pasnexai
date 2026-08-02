"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  HiOutlineChartBar,
  HiOutlineCog6Tooth,
  HiOutlineCreditCard,
  HiOutlineGlobeAlt,
  HiOutlineInbox,
  HiOutlineMagnifyingGlass,
  HiOutlineQuestionMarkCircle,
  HiOutlineSquares2X2,
  HiOutlineUserGroup,
} from "react-icons/hi2";

const searchItems = [
  { label: "Overview", text: "Dashboard summary and workspace health", href: "/dashboard", Icon: HiOutlineChartBar },
  { label: "Automations", text: "Create workflows, templates, triggers, and actions", href: "/dashboard/automations", Icon: HiOutlineSquares2X2 },
  { label: "Channels", text: "Prepare Instagram, WhatsApp, Facebook, Messenger, Telegram", href: "/dashboard/channels", Icon: HiOutlineGlobeAlt },
  { label: "Inbox", text: "Customer conversations and AI replies", href: "/dashboard/inbox", Icon: HiOutlineInbox },
  { label: "Contacts", text: "Leads, scores, status, and next actions", href: "/dashboard/contacts", Icon: HiOutlineUserGroup },
  { label: "Team", text: "Owners, admins, agents, viewers, invites", href: "/dashboard/team", Icon: HiOutlineUserGroup },
  { label: "Analytics", text: "Growth, channel performance, conversion insights", href: "/dashboard/analytics", Icon: HiOutlineChartBar },
  { label: "Billing", text: "Plan, invoices, usage, renewal, upgrades", href: "/dashboard/billing", Icon: HiOutlineCreditCard },
  { label: "Settings", text: "Business profile, security, support, preferences", href: "/dashboard/settings", Icon: HiOutlineCog6Tooth },
  { label: "Support", text: "Help center, contact support, FAQ, launch guidance", href: "/dashboard/support", Icon: HiOutlineQuestionMarkCircle },
];

export function DashboardSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return searchItems.slice(0, 5);

    return searchItems
      .filter((item) => `${item.label} ${item.text}`.toLowerCase().includes(normalized))
      .slice(0, 6);
  }, [query]);

  return (
    <div className="relative w-full max-w-md">
      <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
      <input
        value={query}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setFocused(true)}
        className="w-full rounded-lg border border-white/10 bg-[#07101d] py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400"
        placeholder="Search pages, channels, leads..."
      />

      {focused && (
        <div className="absolute left-0 right-0 top-12 z-40 rounded-lg border border-white/10 bg-[#07101d] p-2 shadow-[0_24px_80px_rgba(0,0,0,.45)]">
          {results.map(({ label, text, href, Icon }) => (
            <Link key={label} href={href} className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-white/[0.06]">
              <Icon className="h-5 w-5 shrink-0 text-blue-300" />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-white">{label}</span>
                <span className="block truncate text-xs text-slate-500">{text}</span>
              </span>
            </Link>
          ))}
          {results.length === 0 && (
            <p className="rounded-lg p-3 text-sm text-slate-500">No matching workspace area found.</p>
          )}
        </div>
      )}
    </div>
  );
}
