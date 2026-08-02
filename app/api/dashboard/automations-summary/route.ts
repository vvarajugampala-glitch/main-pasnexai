import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
      return NextResponse.json({ automations: [] });
    }

    const { data: automations, error: automationsError } = await supabase
      .from("automations")
      .select("id, name, trigger_type, status, config_json, created_at, channels(type, display_name)")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false })
      .limit(6);

    if (automationsError) {
      throw new Error(automationsError.message);
    }

    return NextResponse.json({ automations: automations ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load automations." },
      { status: 500 },
    );
  }
}
