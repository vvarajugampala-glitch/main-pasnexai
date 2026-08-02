import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ConnectChannelPayload = {
  type?: string;
  displayName?: string;
};

const validChannelTypes = ["instagram", "whatsapp", "facebook", "messenger", "telegram"] as const;
type ValidChannelType = (typeof validChannelTypes)[number];

function normalizeChannelType(type?: string): ValidChannelType {
  const normalized = type?.toLowerCase();
  return validChannelTypes.find((channelType) => channelType === normalized) ?? "instagram";
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const payload = (await request.json()) as ConnectChannelPayload;
    const channelType = normalizeChannelType(payload.type);
    const displayName = payload.displayName?.trim() || channelType;

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
      return NextResponse.json({ error: "Business profile not found." }, { status: 404 });
    }

    const { data: existingChannel } = await supabase
      .from("channels")
      .select("id")
      .eq("business_id", profile.business_id)
      .eq("type", channelType)
      .maybeSingle();

    if (existingChannel) {
      const { error: updateError } = await supabase
        .from("channels")
        .update({
          display_name: displayName,
          status: "ready_to_connect",
          webhook_status: "api_pending",
          connected_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingChannel.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else {
      const { error: insertError } = await supabase.from("channels").insert({
        business_id: profile.business_id,
        type: channelType,
        display_name: displayName,
        status: "ready_to_connect",
        webhook_status: "api_pending",
      });

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    return NextResponse.json({ ok: true, type: channelType, displayName });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not connect channel." },
      { status: 500 },
    );
  }
}
