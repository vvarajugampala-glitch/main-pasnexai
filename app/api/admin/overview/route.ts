import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const platformAdminEmails = new Set(["pasnexai@gmail.com"]);
const validBusinessStatuses = new Set(["pending_approval", "approved", "rejected", "suspended"]);
const validPlans = new Set(["starter", "pro", "business", "enterprise"]);

type VisitorEvent = {
  path: string;
  event_type: string;
  created_at: string;
  visitor_id?: string | null;
  metadata?: Record<string, string | number | boolean | null> | null;
};

type ApiSetup = {
  business_id: string;
  provider: string;
  status: string;
};

type AdminNote = {
  business_id: string;
  note: string;
  created_at: string;
};

type SupportTicket = {
  business_id: string;
  status: string;
};

function getCount(result: { count: number | null; error?: { message: string } | null }) {
  return result.error ? 0 : result.count ?? 0;
}

async function getPlatformAdmin(token: string) {
  const supabase = createSupabaseAdminClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user?.email) {
    throw new Error("Invalid admin session.");
  }

  if (!platformAdminEmails.has(user.email.toLowerCase())) {
    return { supabase, user, allowed: false };
  }

  return { supabase, user, allowed: true };
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { supabase, user, allowed } = await getPlatformAdmin(token);

    if (!allowed) {
      return NextResponse.json({ error: "Platform admin access required." }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const visitorQueries = await Promise.all([
      supabase.from("visitor_events").select("id", { count: "exact", head: true }),
      supabase.from("visitor_events").select("id", { count: "exact", head: true }).gte("created_at", todayIso),
      supabase.from("visitor_events").select("id", { count: "exact", head: true }).eq("event_type", "register_click"),
      supabase.from("visitor_events").select("id", { count: "exact", head: true }).eq("event_type", "pricing_click"),
      supabase.from("visitor_events").select("id", { count: "exact", head: true }).eq("event_type", "demo_click"),
      supabase.from("visitor_events").select("path, event_type, created_at, visitor_id, metadata").order("created_at", { ascending: false }).limit(1000),
    ]);

    const [
      { data: businesses },
      { data: profiles },
      { count: totalBusinesses },
      { count: todayRegistrations },
      { count: totalUsers },
      { count: todayLogins },
      { count: active24h },
      { count: active7d },
      { count: active30d },
      { count: onboardingCompleted },
      { count: channelCount },
      { count: automationCount },
      { count: leadCount },
      { count: conversationCount },
      { data: invoices },
      { data: tickets },
      { data: auditLogs },
      { data: apiSetups },
      { data: adminNotes },
      { data: ticketSummary },
      { data: auditSummary },
    ] = await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, email, phone, country, status, plan, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("profiles")
        .select("id, business_id, full_name, email, role, status, onboarding_completed, last_login_at, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("businesses").select("id", { count: "exact", head: true }),
      supabase.from("businesses").select("id", { count: "exact", head: true }).gte("created_at", todayIso),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("last_login_at", todayIso),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("last_login_at", last24Hours),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("last_login_at", last7Days),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("last_login_at", last30Days),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("onboarding_completed", true),
      supabase.from("channels").select("id", { count: "exact", head: true }),
      supabase.from("automations").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("conversations").select("id", { count: "exact", head: true }),
      supabase
        .from("invoices")
        .select("id, business_id, plan, amount, currency, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("support_tickets")
        .select("id, business_id, subject, category, priority, status, created_at, businesses(name)")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("admin_audit_logs")
        .select("id, admin_email, action, target_type, target_id, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("admin_api_setups")
        .select("business_id, provider, status")
        .order("updated_at", { ascending: false })
        .limit(200),
      supabase
        .from("admin_client_notes")
        .select("business_id, note, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("support_tickets")
        .select("business_id, status")
        .in("status", ["open", "in_progress"])
        .limit(200),
      supabase
        .from("admin_audit_logs")
        .select("target_id, action, created_at")
        .eq("target_type", "business")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const visitorEvents = (visitorQueries[5].error ? [] : visitorQueries[5].data ?? []) as VisitorEvent[];
    const topPageCounts = new Map<string, number>();
    const topCtaCounts = new Map<string, number>();
    const uniqueVisitorIds = new Set<string>();
    const todayUniqueVisitorIds = new Set<string>();

    for (const event of visitorEvents) {
      topPageCounts.set(event.path, (topPageCounts.get(event.path) ?? 0) + 1);
      if (event.event_type.endsWith("_click")) {
        const cta = typeof event.metadata?.cta === "string" ? event.metadata.cta : event.event_type.replace("_click", "");
        topCtaCounts.set(cta, (topCtaCounts.get(cta) ?? 0) + 1);
      }
      if (event.visitor_id) {
        uniqueVisitorIds.add(event.visitor_id);
        if (event.created_at >= todayIso) {
          todayUniqueVisitorIds.add(event.visitor_id);
        }
      }
    }

    const topPages = Array.from(topPageCounts.entries())
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
    const topCtas = Array.from(topCtaCounts.entries())
      .map(([label, clicks]) => ({ label, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    const approvedBusinesses = businesses?.filter((business) => business.status === "approved").length ?? 0;
    const pendingBusinesses = businesses?.filter((business) => business.status === "pending_approval").length ?? 0;
    const revenue = invoices?.reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0) ?? 0;
    const apiSetupRows = (apiSetups ?? []) as ApiSetup[];
    const noteRows = (adminNotes ?? []) as AdminNote[];
    const openTicketRows = (ticketSummary ?? []) as SupportTicket[];
    const clientHealth = new Map<
      string,
      {
        apiLive: number;
        apiBlocked: number;
        apiPending: number;
        noteCount: number;
        latestNote: string | null;
        openTickets: number;
        latestAction: string | null;
      }
    >();

    for (const business of businesses ?? []) {
      clientHealth.set(business.id, {
        apiLive: 0,
        apiBlocked: 0,
        apiPending: 0,
        noteCount: 0,
        latestNote: null,
        openTickets: 0,
        latestAction: null,
      });
    }

    for (const setup of apiSetupRows) {
      const summary = clientHealth.get(setup.business_id);
      if (!summary) continue;
      if (setup.status === "live") summary.apiLive += 1;
      else if (setup.status === "blocked") summary.apiBlocked += 1;
      else summary.apiPending += 1;
    }

    for (const note of noteRows) {
      const summary = clientHealth.get(note.business_id);
      if (!summary) continue;
      summary.noteCount += 1;
      summary.latestNote ??= note.note;
    }

    for (const ticket of openTicketRows) {
      const summary = clientHealth.get(ticket.business_id);
      if (!summary) continue;
      summary.openTickets += 1;
    }

    for (const log of auditSummary ?? []) {
      const summary = clientHealth.get(log.target_id);
      if (!summary || summary.latestAction) continue;
      summary.latestAction = log.action;
    }

    return NextResponse.json({
      admin: {
        email: user.email,
      },
      stats: {
        businesses: totalBusinesses ?? businesses?.length ?? 0,
        approvedBusinesses,
        pendingBusinesses,
        todayRegistrations: todayRegistrations ?? 0,
        totalUsers: totalUsers ?? 0,
        todayLogins: todayLogins ?? 0,
        active24h: active24h ?? 0,
        active7d: active7d ?? 0,
        active30d: active30d ?? 0,
        onboardingCompleted: onboardingCompleted ?? 0,
        uniqueVisitors: uniqueVisitorIds.size,
        todayUniqueVisitors: todayUniqueVisitorIds.size,
        totalPageViews: getCount(visitorQueries[0]),
        todayPageViews: getCount(visitorQueries[1]),
        registerClicks: getCount(visitorQueries[2]),
        pricingClicks: getCount(visitorQueries[3]),
        demoClicks: getCount(visitorQueries[4]),
        channels: channelCount ?? 0,
        automations: automationCount ?? 0,
        leads: leadCount ?? 0,
        conversations: conversationCount ?? 0,
        revenue,
      },
      businesses: (businesses ?? []).map((business) => ({
        ...business,
        health: clientHealth.get(business.id) ?? {
          apiLive: 0,
          apiBlocked: 0,
          apiPending: 0,
          noteCount: 0,
          latestNote: null,
          openTickets: 0,
          latestAction: null,
        },
      })),
      profiles: profiles ?? [],
      invoices: invoices ?? [],
      tickets: tickets ?? [],
      auditLogs: auditLogs ?? [],
      topPages,
      topCtas,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load admin overview." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { supabase, user, allowed } = await getPlatformAdmin(token);

    if (!allowed) {
      return NextResponse.json({ error: "Platform admin access required." }, { status: 403 });
    }

    const payload = (await request.json()) as {
      businessId?: string;
      status?: string;
      plan?: string;
    };

    if (!payload.businessId) {
      return NextResponse.json({ error: "Business id is required." }, { status: 400 });
    }

    const update: { status?: string; plan?: string; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };

    if (payload.status) {
      if (!validBusinessStatuses.has(payload.status)) {
        return NextResponse.json({ error: "Invalid business status." }, { status: 400 });
      }
      update.status = payload.status;
    }

    if (payload.plan) {
      if (!validPlans.has(payload.plan)) {
        return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
      }
      update.plan = payload.plan;
    }

    const { data: currentBusiness } = await supabase
      .from("businesses")
      .select("id, name, email, status, plan")
      .eq("id", payload.businessId)
      .maybeSingle();

    const { error: businessError } = await supabase
      .from("businesses")
      .update(update)
      .eq("id", payload.businessId);

    if (businessError) {
      throw new Error(businessError.message);
    }

    if (payload.status) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ status: payload.status, updated_at: update.updated_at })
        .eq("business_id", payload.businessId);

      if (profileError) {
        throw new Error(profileError.message);
      }
    }

    await supabase.from("admin_audit_logs").insert({
      admin_email: user.email,
      action: payload.status && payload.plan ? "client_status_plan_update" : payload.status ? "client_status_update" : "client_plan_update",
      target_type: "business",
      target_id: payload.businessId,
      metadata: {
        business_name: currentBusiness?.name ?? null,
        business_email: currentBusiness?.email ?? null,
        old_status: currentBusiness?.status ?? null,
        new_status: payload.status ?? currentBusiness?.status ?? null,
        old_plan: currentBusiness?.plan ?? null,
        new_plan: payload.plan ?? currentBusiness?.plan ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update client." },
      { status: 500 },
    );
  }
}
