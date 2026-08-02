import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type TrackPayload = {
  path?: string;
  eventType?: string;
  visitorId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

const allowedEvents = new Set(["page_view", "cta_click", "register_click", "pricing_click", "demo_click"]);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TrackPayload;
    const path = payload.path?.trim() || "/";
    const eventType = allowedEvents.has(payload.eventType ?? "") ? payload.eventType! : "page_view";
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase.from("visitor_events").insert({
      path,
      event_type: eventType,
      visitor_id: payload.visitorId?.slice(0, 120) ?? null,
      referrer: request.headers.get("referer"),
      user_agent: request.headers.get("user-agent"),
      metadata: payload.metadata ?? {},
    });

    if (error) {
      return NextResponse.json({ ok: true, stored: false });
    }

    return NextResponse.json({ ok: true, stored: true });
  } catch {
    return NextResponse.json({ ok: true, stored: false });
  }
}
