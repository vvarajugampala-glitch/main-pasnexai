import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SettingsPayload = {
  businessName?: string;
  website?: string;
  supportEmail?: string;
  supportPhone?: string;
  country?: string;
  timezone?: string;
  ownerName?: string;
};

async function getContext(token: string) {
  const supabase = createSupabaseAdminClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    throw new Error("Invalid session.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, business_id, full_name, email, role, status, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.business_id) {
    throw new Error("Business profile not found.");
  }

  return { supabase, user, profile, businessId: profile.business_id };
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { supabase, user, profile, businessId } = await getContext(token);
    const [{ data: business }, { data: channels }] = await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, website, email, phone, country, timezone, status, plan")
        .eq("id", businessId)
        .maybeSingle(),
      supabase
        .from("channels")
        .select("id, type, display_name, status, webhook_status")
        .eq("business_id", businessId)
        .order("created_at", { ascending: true }),
    ]);

    return NextResponse.json({
      profile,
      business,
      channels: channels ?? [],
      security: {
        emailConfirmed: Boolean(user.email_confirmed_at),
        googleLinked: user.app_metadata?.provider === "google" || Object.keys(user.app_metadata?.providers ?? {}).includes("google"),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load settings." },
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

    const payload = (await request.json()) as SettingsPayload;
    const { supabase, profile, businessId } = await getContext(token);
    const now = new Date().toISOString();

    const { error: businessError } = await supabase
      .from("businesses")
      .update({
        name: payload.businessName?.trim() || "Pasnex.ai Workspace",
        website: payload.website?.trim() || null,
        email: payload.supportEmail?.trim() || profile.email,
        phone: payload.supportPhone?.trim() || null,
        country: payload.country?.trim() || "India",
        timezone: payload.timezone?.trim() || "Asia/Kolkata",
        updated_at: now,
      })
      .eq("id", businessId);

    if (businessError) {
      throw new Error(businessError.message);
    }

    if (payload.ownerName?.trim()) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: payload.ownerName.trim(), updated_at: now })
        .eq("id", profile.id);

      if (profileError) {
        throw new Error(profileError.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save settings." },
      { status: 500 },
    );
  }
}
