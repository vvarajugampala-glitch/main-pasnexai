"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type DashboardStats = {
  messages?: number;
  conversations?: number;
};

export function DashboardInboxBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadCount() {
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
      if (mounted) {
        setCount(data.conversations ?? 0);
      }
    }

    void loadCount();

    return () => {
      mounted = false;
    };
  }, []);

  if (count <= 0) return null;

  return (
    <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] text-white">
      {Math.min(count, 99)}
    </span>
  );
}
