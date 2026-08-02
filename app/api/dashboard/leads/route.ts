import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
    const { data: leads, error } = await supabase
      .from("leads")
      .select("id, name, phone, email, source, status, score, interest, next_action, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ leads: leads ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load leads." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { supabase, businessId } = await getBusinessId(token);
    const { data: channel } = await supabase
      .from("channels")
      .select("id, type")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const source = channel?.type ?? "instagram";
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        business_id: businessId,
        channel_id: channel?.id ?? null,
        name: "Sample Social Lead",
        phone: "+91 90000 00000",
        email: "lead@example.com",
        source,
        status: "new",
        score: 72,
        interest: "Automation demo",
        next_action: "Qualify",
      })
      .select("id")
      .single();

    if (error || !lead) {
      throw new Error(error?.message ?? "Could not create lead.");
    }

    return NextResponse.json({ ok: true, leadId: lead.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create lead." },
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

    const { supabase, businessId } = await getBusinessId(token);
    const body = (await request.json()) as {
      leadId?: string;
      action?: string;
    };

    if (!body.leadId) {
      return NextResponse.json({ error: "Lead is required." }, { status: 400 });
    }

    const update =
      body.action === "convert"
        ? { status: "converted", score: 100, next_action: "Start onboarding follow-up" }
        : { status: "qualified", score: 88, next_action: "Send demo link" };

    const { error } = await supabase
      .from("leads")
      .update(update)
      .eq("id", body.leadId)
      .eq("business_id", businessId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update lead." },
      { status: 500 },
    );
  }
}
