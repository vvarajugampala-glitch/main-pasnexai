"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HiOutlineBell,
  HiOutlineBolt,
  HiOutlineChatBubbleLeftRight,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Activity = {
  id: string;
  type: "automation" | "lead" | "conversation" | "channel";
  title: string;
  detail: string;
  created_at: string;
  href: string;
};

type ActivityResponse = {
  activities?: Activity[];
  unread?: number;
  inboxUnread?: number;
};

const activityIcons = {
  automation: HiOutlineBolt,
  lead: HiOutlineUserGroup,
  conversation: HiOutlineChatBubbleLeftRight,
  channel: HiOutlineGlobeAlt,
};

function formatRelativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.round(diff / 60000));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

async function fetchActivity() {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) return { activities: [], unread: 0, inboxUnread: 0 };

  const response = await fetch("/api/dashboard/activity", {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!response.ok) return { activities: [], unread: 0, inboxUnread: 0 };
  return (await response.json()) as ActivityResponse;
}

export function DashboardActivityButtons() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [unread, setUnread] = useState(0);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [openPanel, setOpenPanel] = useState<"activity" | "inbox" | null>(null);

  useEffect(() => {
    let mounted = true;

    fetchActivity().then((data) => {
      if (!mounted) return;
      setActivities(data.activities ?? []);
      setUnread(data.unread ?? 0);
      setInboxUnread(data.inboxUnread ?? 0);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const inboxItems = activities.filter((activity) => activity.type === "conversation");

  return (
    <div className="relative flex items-center gap-3">
      <button onClick={() => setOpenPanel(openPanel === "activity" ? null : "activity")} className="relative rounded-lg border border-white/10 bg-[#07101d] p-2.5 text-slate-300 transition hover:text-white">
        <HiOutlineBell className="h-5 w-5" />
        {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{Math.min(unread, 9)}</span>}
      </button>
      <button onClick={() => setOpenPanel(openPanel === "inbox" ? null : "inbox")} className="relative rounded-lg border border-white/10 bg-[#07101d] p-2.5 text-slate-300 transition hover:text-white">
        <HiOutlineEnvelope className="h-5 w-5" />
        {inboxUnread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{Math.min(inboxUnread, 9)}</span>}
      </button>

      {openPanel && (
        <div className="absolute right-0 top-12 z-40 w-[min(360px,calc(100vw-2rem))] rounded-lg border border-white/10 bg-[#07101d] p-4 shadow-[0_24px_80px_rgba(0,0,0,.45)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black">{openPanel === "activity" ? "Notifications" : "Inbox Updates"}</h2>
            <Link href={openPanel === "activity" ? "/dashboard" : "/dashboard/inbox"} className="text-xs font-bold text-blue-300">
              Open
            </Link>
          </div>
          <div className="mt-4 grid max-h-80 gap-3 overflow-y-auto pr-1">
            {(openPanel === "activity" ? activities : inboxItems).slice(0, 6).map((activity) => {
              const Icon = activityIcons[activity.type];
              return (
                <Link key={activity.id} href={activity.href} className="flex gap-3 rounded-lg bg-white/[0.035] p-3 transition hover:bg-white/[0.06]">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
                  <span>
                    <span className="block text-sm font-bold text-slate-100">{activity.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{activity.detail} - {formatRelativeTime(activity.created_at)}</span>
                  </span>
                </Link>
              );
            })}
            {(openPanel === "activity" ? activities : inboxItems).length === 0 && (
              <p className="rounded-lg bg-white/[0.035] p-3 text-sm text-slate-500">No updates yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardRecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    let mounted = true;

    fetchActivity().then((data) => {
      if (!mounted) return;
      setActivities(data.activities ?? []);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="rounded-lg border border-white/10 bg-[#07101d]/90 p-4 shadow-[0_18px_60px_rgba(0,0,0,.18)]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">Recent Activity</h2>
        <Link href="/dashboard/analytics" className="text-xs font-bold text-blue-300">View insights</Link>
      </div>
      <div className="mt-4 grid gap-3">
        {activities.slice(0, 5).map((activity) => {
          const Icon = activityIcons[activity.type];
          return (
            <Link key={activity.id} href={activity.href} className="flex items-center gap-3 rounded-lg bg-white/[0.035] p-3 transition hover:bg-white/[0.06]">
              <Icon className="h-5 w-5 text-blue-300" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-200">{activity.title}</p>
                <p className="text-xs text-slate-500">{activity.detail} - {formatRelativeTime(activity.created_at)}</p>
              </div>
            </Link>
          );
        })}
        {activities.length === 0 && (
          <p className="rounded-lg bg-white/[0.035] p-3 text-sm text-slate-500">
            Activity will appear here as channels, leads, automations, and conversations are prepared.
          </p>
        )}
      </div>
    </section>
  );
}
