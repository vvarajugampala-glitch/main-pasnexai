import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const platformAdminEmails = new Set(["pasnexai@gmail.com"]);
const validProviders = new Set(["instagram", "whatsapp", "facebook", "messenger", "telegram"]);
const validStatuses = new Set(["pending", "docs_received", "submitted", "approved", "live", "blocked"]);

async function requireAdmin(token: string) {
  const supabase = createSupabaseAdminClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user?.email || !platformAdminEmails.has(user.email.toLowerCase())) {
    throw new Error("Platform admin access required.");
  }

  return { supabase, adminEmail: user.email };
}

function isMissingTable(message: string) {
  return message.includes("admin_api_setups") || message.includes("relation") || message.includes("schema cache");
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { id } = await params;
    const { supabase } = await requireAdmin(token);
    const { data, error } = await supabase
      .from("admin_api_setups")
      .select("id, provider, status, next_step, updated_by, updated_at")
      .eq("business_id", id)
      .order("provider", { ascending: true });

    if (error) {
      if (isMissingTable(error.message)) {
        return NextResponse.json({ setups: [], setupRequired: true });
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ setups: data ?? [], setupRequired: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load API setup tracker." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { id } = await params;
    const payload = (await request.json()) as { provider?: string; status?: string; nextStep?: string };

    if (!payload.provider || !validProviders.has(payload.provider)) {
      return NextResponse.json({ error: "Valid provider is required." }, { status: 400 });
    }

    if (!payload.status || !validStatuses.has(payload.status)) {
      return NextResponse.json({ error: "Valid setup status is required." }, { status: 400 });
    }

    const { supabase, adminEmail } = await requireAdmin(token);
    const { error } = await supabase.from("admin_api_setups").upsert(
      {
        business_id: id,
        provider: payload.provider,
        status: payload.status,
        next_step: payload.nextStep?.trim() || null,
        updated_by: adminEmail,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id,provider" },
    );

    if (error) {
      if (isMissingTable(error.message)) {
        return NextResponse.json({ error: "API setup tracker table is not created yet." }, { status: 409 });
      }
      throw new Error(error.message);
    }

    await supabase.from("admin_audit_logs").insert({
      admin_email: adminEmail,
      action: "client_api_setup_updated",
      target_type: "business",
      target_id: id,
      metadata: {
        provider: payload.provider,
        status: payload.status,
        next_step: payload.nextStep?.trim() || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update API setup tracker." },
      { status: 500 },
    );
  }
}
