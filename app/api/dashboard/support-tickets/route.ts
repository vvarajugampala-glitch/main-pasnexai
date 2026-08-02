import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function getContext(token: string) {
  const supabase = createSupabaseAdminClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error("Invalid session.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, business_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.business_id) {
    throw new Error("Business profile not found.");
  }

  return { supabase, profile };
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Missing session." }, { status: 401 });

    const { supabase, profile } = await getContext(token);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, subject, category, priority, status, message, created_at, updated_at")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) return NextResponse.json({ tickets: [], setupRequired: true });

    return NextResponse.json({ tickets: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load tickets." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Missing session." }, { status: 401 });

    const payload = (await request.json()) as {
      subject?: string;
      category?: string;
      priority?: string;
      message?: string;
    };

    if (!payload.subject?.trim() || !payload.message?.trim()) {
      return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
    }

    const { supabase, profile } = await getContext(token);
    const { error } = await supabase.from("support_tickets").insert({
      business_id: profile.business_id,
      user_id: profile.id,
      subject: payload.subject.trim(),
      category: payload.category ?? "general",
      priority: payload.priority ?? "normal",
      message: payload.message.trim(),
      status: "open",
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create ticket." },
      { status: 500 },
    );
  }
}
