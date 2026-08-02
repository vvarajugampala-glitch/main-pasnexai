import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const platformAdminEmails = new Set(["pasnexai@gmail.com"]);
const validStatuses = new Set(["open", "in_progress", "resolved", "closed"]);

async function requireAdmin(token: string) {
  const supabase = createSupabaseAdminClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user?.email || !platformAdminEmails.has(user.email.toLowerCase())) {
    throw new Error("Platform admin access required.");
  }

  return { supabase, user };
}

export async function PATCH(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Missing session." }, { status: 401 });

    const payload = (await request.json()) as { ticketId?: string; status?: string };

    if (!payload.ticketId) {
      return NextResponse.json({ error: "Ticket id is required." }, { status: 400 });
    }

    if (!payload.status || !validStatuses.has(payload.status)) {
      return NextResponse.json({ error: "Invalid ticket status." }, { status: 400 });
    }

    const { supabase, user } = await requireAdmin(token);
    const { error } = await supabase
      .from("support_tickets")
      .update({ status: payload.status, updated_at: new Date().toISOString() })
      .eq("id", payload.ticketId);

    if (error) throw new Error(error.message);

    await supabase.from("admin_audit_logs").insert({
      admin_email: user.email,
      action: "ticket_status_update",
      target_type: "support_ticket",
      target_id: payload.ticketId,
      metadata: {
        status: payload.status,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update ticket." },
      { status: 500 },
    );
  }
}
