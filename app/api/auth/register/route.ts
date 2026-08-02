import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRequiredEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RegisterPayload = {
  fullName?: string;
  businessName?: string;
  email?: string;
  password?: string;
  primaryChannel?: string;
};

const channelMap: Record<string, "instagram" | "whatsapp" | "facebook" | "messenger" | "telegram"> = {
  Instagram: "instagram",
  WhatsApp: "whatsapp",
  "Facebook Messenger": "messenger",
};

export async function POST(request: Request) {
  let createdUserId: string | null = null;

  try {
    const payload = (await request.json()) as RegisterPayload;
    const fullName = payload.fullName?.trim();
    const businessName = payload.businessName?.trim();
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password;
    const primaryChannel = payload.primaryChannel?.trim();

    if (!fullName || !businessName || !email || !password) {
      return NextResponse.json({ error: "Please fill all required fields." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const authClient = createClient(
      getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { data: authData, error: authError } = await authClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/login`,
        data: {
          full_name: fullName,
          business_name: businessName,
        },
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message ?? "Could not create user." },
        { status: 400 },
      );
    }

    createdUserId = authData.user.id;
    const supabase = createSupabaseAdminClient();

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .insert({
        name: businessName,
        email,
        status: "approved",
        plan: "starter",
      })
      .select("id")
      .single();

    if (businessError || !business) {
      throw new Error(businessError?.message ?? "Could not create business.");
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      business_id: business.id,
      full_name: fullName,
      email,
      role: "owner",
      status: "approved",
      onboarding_completed: false,
    });

    if (profileError) {
      throw new Error(profileError.message);
    }

    if (primaryChannel && primaryChannel !== "Multiple channels") {
      const channelType = channelMap[primaryChannel] ?? "instagram";

      await supabase.from("channels").insert({
        business_id: business.id,
        type: channelType,
        display_name: primaryChannel,
        status: "ready_to_connect",
      });
    }

    return NextResponse.json({
      ok: true,
      businessId: business.id,
      status: "email_verification_required",
    });
  } catch (error) {
    if (createdUserId) {
      const supabase = createSupabaseAdminClient();
      await supabase.auth.admin.deleteUser(createdUserId);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed." },
      { status: 500 },
    );
  }
}
