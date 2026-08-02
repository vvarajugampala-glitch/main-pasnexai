"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getVisitorId() {
  const key = "pasnex_visitor_id";
  const existing = window.localStorage.getItem(key);

  if (existing) return existing;

  const nextId = crypto.randomUUID();
  window.localStorage.setItem(key, nextId);
  return nextId;
}

export function VisitorTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;

    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        eventType: "page_view",
        visitorId: getVisitorId(),
      }),
      keepalive: true,
    });
  }, [pathname, searchParams]);

  return null;
}
