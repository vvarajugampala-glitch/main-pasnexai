import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const validRoles = ["admin", "agent", "viewer"] as const;

async function getContext(token: string) {
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
    .select("business_id, role")
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

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { supabase, profile } = await getContext(token);
    const { data: members, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, status, onboarding_completed, last_login_at, created_at")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      members: members ?? [],
      currentRole: profile.role,
      invitesEnabled: false,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load team." },
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

    const { profile } = await getContext(token);

    if (!["owner", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Only owners and admins can prepare invites." }, { status: 403 });
    }

    const payload = (await request.json()) as { email?: string; role?: string };
    const email = payload.email?.trim().toLowerCase();
    const role = validRoles.find((item) => item === payload.role) ?? "agent";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      invite: {
        email,
        role,
        status: "prepared",
      },
      message: "Invite prepared. Email invitation delivery will be enabled in the production email phase.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not prepare invite." },
      { status: 500 },
    );
  }
}
