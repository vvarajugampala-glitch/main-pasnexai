import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ActivityItem = {
  id: string;
  type: "automation" | "lead" | "conversation" | "channel";
  title: string;
  detail: string;
  created_at: string;
  href: string;
};

function getLeadName(lead: { name: string } | { name: string }[] | null) {
  if (Array.isArray(lead)) return lead[0]?.name;
  return lead?.name;
}

async function getBusinessId(token: string) {
  const supabase = createSupabaseAdminClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    throw new Error("Invalid session.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.business_id) {
    throw new Error("Business profile not found.");
  }

  return { supabase, businessId: profile.business_id };
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { supabase, businessId } = await getBusinessId(token);
    const [{ data: automations }, { data: leads }, { data: conversations }, { data: channels }] = await Promise.all([
      supabase
        .from("automations")
        .select("id, name, status, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("leads")
        .select("id, name, source, status, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("conversations")
        .select("id, status, last_message_at, created_at, leads(name)")
        .eq("business_id", businessId)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(5),
      supabase
        .from("channels")
        .select("id, type, status, webhook_status, updated_at, created_at")
        .eq("business_id", businessId)
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

    const items: ActivityItem[] = [
      ...(automations ?? []).map((automation) => ({
        id: `automation-${automation.id}`,
        type: "automation" as const,
        title: `${automation.name} automation prepared`,
        detail: `Status: ${automation.status}`,
        created_at: automation.created_at,
        href: "/dashboard/automations",
      })),
      ...(leads ?? []).map((lead) => ({
        id: `lead-${lead.id}`,
        type: "lead" as const,
        title: `${lead.name} captured as lead`,
        detail: `${lead.source ?? "workspace"} - ${lead.status}`,
        created_at: lead.created_at,
        href: "/dashboard/contacts",
      })),
      ...(conversations ?? []).map((conversation) => ({
        id: `conversation-${conversation.id}`,
        type: "conversation" as const,
        title: `${getLeadName(conversation.leads) ?? "Customer"} conversation updated`,
        detail: `Conversation ${conversation.status}`,
        created_at: conversation.last_message_at ?? conversation.created_at,
        href: "/dashboard/inbox",
      })),
      ...(channels ?? []).map((channel) => ({
        id: `channel-${channel.id}`,
        type: "channel" as const,
        title: `${channel.type} setup prepared`,
        detail: channel.webhook_status ?? channel.status,
        created_at: channel.updated_at ?? channel.created_at,
        href: "/dashboard/channels",
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      activities: items.slice(0, 10),
      unread: items.length,
      inboxUnread: conversations?.length ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load activity." },
      { status: 500 },
    );
  }
}
