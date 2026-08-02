import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

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
      return NextResponse.json({ business: null, invoices: [] });
    }

    const [{ data: business }, { data: invoices }] = await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, plan, status, created_at")
        .eq("id", profile.business_id)
        .maybeSingle(),
      supabase
        .from("invoices")
        .select("id, plan, amount, currency, status, billing_period, invoice_url, created_at")
        .eq("business_id", profile.business_id)
        .order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({ business, invoices: invoices ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load billing." },
      { status: 500 },
    );
  }
}
