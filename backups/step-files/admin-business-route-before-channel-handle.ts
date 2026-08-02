import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const platformAdminEmails = new Set(["pasnexai@gmail.com"]);

async function requireAdmin(token: string) {
  const supabase = createSupabaseAdminClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user?.email || !platformAdminEmails.has(user.email.toLowerCase())) {
    throw new Error("Platform admin access required.");
  }

  return supabase;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await requireAdmin(token);

    const [
      { data: business },
      { data: profiles },
      { data: channels },
      { data: automations },
      { count: leadsCount },
      { count: conversationsCount },
      { data: invoices },
      { data: tickets },
      { data: auditLogs },
    ] = await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, website, email, phone, country, timezone, status, plan, created_at, updated_at")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, full_name, email, role, status, onboarding_completed, last_login_at, created_at")
        .eq("business_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("channels")
        .select("id, type, display_name, handle, status, webhook_status, connected_at, created_at")
        .eq("business_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("automations")
        .select("id, name, trigger_type, status, created_at, channels(type, display_name)")
        .eq("business_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("business_id", id),
      supabase.from("conversations").select("id", { count: "exact", head: true }).eq("business_id", id),
      supabase
        .from("invoices")
        .select("id, plan, amount, currency, status, billing_period, created_at")
        .eq("business_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("support_tickets")
        .select("id, subject, category, priority, status, message, created_at, updated_at")
        .eq("business_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("admin_audit_logs")
        .select("id, admin_email, action, target_type, target_id, metadata, created_at")
        .eq("target_id", id)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    if (!business) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }

    return NextResponse.json({
      business,
      profiles: profiles ?? [],
      channels: channels ?? [],
      automations: automations ?? [],
      invoices: invoices ?? [],
      tickets: tickets ?? [],
      auditLogs: auditLogs ?? [],
      stats: {
        leads: leadsCount ?? 0,
        conversations: conversationsCount ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load client." },
      { status: 500 },
    );
  }
}
