import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CompleteRegistrationPayload = {
  fullName?: string;
  businessName?: string;
  primaryChannel?: string;
};

const channelMap: Record<string, "instagram" | "whatsapp" | "facebook" | "messenger" | "telegram"> = {
  Instagram: "instagram",
  WhatsApp: "whatsapp",
  "Facebook Messenger": "messenger",
};

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing verified session." }, { status: 401 });
    }

    const payload = (await request.json()) as CompleteRegistrationPayload;
    const fullName = payload.fullName?.trim();
    const businessName = payload.businessName?.trim();
    const primaryChannel = payload.primaryChannel?.trim();

    if (!fullName || !businessName) {
      return NextResponse.json({ error: "Please fill all required fields." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user?.email) {
      return NextResponse.json({ error: "Email verification session is invalid." }, { status: 401 });
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({ ok: true, status: "already_registered" });
    }

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .insert({
        name: businessName,
        email: user.email,
        status: "approved",
        plan: "starter",
      })
      .select("id")
      .single();

    if (businessError || !business) {
      throw new Error(businessError?.message ?? "Could not create business.");
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      business_id: business.id,
      full_name: fullName,
      email: user.email,
      role: "owner",
      status: "approved",
      onboarding_completed: false,
    });

    if (profileError) {
      throw new Error(profileError.message);
    }

    if (primaryChannel && primaryChannel !== "Multiple channels") {
      await supabase.from("channels").insert({
        business_id: business.id,
        type: channelMap[primaryChannel] ?? "instagram",
        display_name: primaryChannel,
        status: "ready_to_connect",
      });
    }

    return NextResponse.json({ ok: true, status: "registered" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed." },
      { status: 500 },
    );
  }
}
