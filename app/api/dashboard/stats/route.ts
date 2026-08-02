import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DatedRow = {
  created_at: string;
};

function getLastSevenDayKeys() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
}

function buildTrend(rows: DatedRow[] = [], dayKeys = getLastSevenDayKeys()) {
  const counts = new Map(dayKeys.map((day) => [day, 0]));

  rows.forEach((row) => {
    const day = new Date(row.created_at).toISOString().slice(0, 10);
    if (counts.has(day)) {
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
  });

  return dayKeys.map((day) => counts.get(day) ?? 0);
}

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.business_id) {
      return NextResponse.json({
        messages: 0,
        conversations: 0,
        activeAutomations: 0,
        leads: 0,
        connectedChannels: 0,
      });
    }

    const businessId = profile.business_id;
    const lastSevenDays = new Date();
    lastSevenDays.setHours(0, 0, 0, 0);
    lastSevenDays.setDate(lastSevenDays.getDate() - 6);
    const lastSevenDaysIso = lastSevenDays.toISOString();
    const dayKeys = getLastSevenDayKeys();
    const [
      { count: activeAutomations },
      { count: leads },
      { count: connectedChannels },
      { data: conversations },
      { data: automationTrendRows },
      { data: leadTrendRows },
      { data: channelTrendRows },
      { data: primaryChannel },
    ] = await Promise.all([
      supabase
        .from("automations")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("status", "active"),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId),
      supabase
        .from("channels")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .in("status", ["connected", "ready_to_connect"]),
      supabase
        .from("conversations")
        .select("id, created_at")
        .eq("business_id", businessId),
      supabase
        .from("automations")
        .select("created_at")
        .eq("business_id", businessId)
        .gte("created_at", lastSevenDaysIso),
      supabase
        .from("leads")
        .select("created_at")
        .eq("business_id", businessId)
        .gte("created_at", lastSevenDaysIso),
      supabase
        .from("channels")
        .select("created_at")
        .eq("business_id", businessId)
        .in("status", ["connected", "ready_to_connect"])
        .gte("created_at", lastSevenDaysIso),
      supabase
        .from("channels")
        .select("type, display_name")
        .eq("business_id", businessId)
        .in("status", ["connected", "ready_to_connect"])
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    const conversationIds = conversations?.map((conversation) => conversation.id) ?? [];
    let messages = 0;
    let messageTrendRows: DatedRow[] = [];

    if (conversationIds.length) {
      const [{ count }, { data: messagesByDate }] = await Promise.all([
        supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
          .in("conversation_id", conversationIds),
        supabase
          .from("messages")
          .select("created_at")
          .in("conversation_id", conversationIds)
          .gte("created_at", lastSevenDaysIso),
      ]);
      messages = count ?? 0;
      messageTrendRows = messagesByDate ?? [];
    }

    return NextResponse.json({
      messages,
      conversations: conversations?.length ?? 0,
      activeAutomations: activeAutomations ?? 0,
      leads: leads ?? 0,
      connectedChannels: connectedChannels ?? 0,
      primaryChannel: primaryChannel ?? null,
      trends: {
        messages: buildTrend(messageTrendRows, dayKeys),
        activeAutomations: buildTrend(automationTrendRows ?? [], dayKeys),
        leads: buildTrend(leadTrendRows ?? [], dayKeys),
        connectedChannels: buildTrend(channelTrendRows ?? [], dayKeys),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load dashboard stats." },
      { status: 500 },
    );
  }
}
