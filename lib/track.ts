const recentEvents = new Map<string, number>();

export function trackEvent(eventType: string, metadata?: Record<string, string | number | boolean | null>) {
  if (typeof window === "undefined") return;

  const visitorId = window.localStorage.getItem("pasnex_visitor_id") ?? undefined;
  const cta = metadata?.cta ?? metadata?.source ?? "";
  const eventKey = `${eventType}:${cta}`;
  const now = Date.now();
  const lastEventTime = recentEvents.get(eventKey) ?? 0;

  if (now - lastEventTime < 1500) return;
  recentEvents.set(eventKey, now);

  void fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: `${window.location.pathname}${window.location.search}`,
      eventType,
      visitorId,
      metadata,
    }),
    keepalive: true,
  });
}

export function trackCta(cta: string, source: string, eventType = "cta_click") {
  trackEvent(eventType, { cta, source });
}
