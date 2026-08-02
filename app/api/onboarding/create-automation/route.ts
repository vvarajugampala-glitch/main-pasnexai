import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CreateAutomationPayload = {
  templateName?: string;
  channelType?: string;
};

const templateTriggers: Record<string, string> = {
  "Welcome Message": "message_received",
  "Auto Reply": "keyword_or_message",
  "Comment to DM": "comment_received",
  "AI Chatbot": "ai_chat_started",
  "Instagram Comment to DM": "comment_received",
  "WhatsApp Lead Qualification": "message_received",
  "Facebook Lead Capture": "lead_form",
  "Messenger Support Reply": "message_received",
};

const validChannelTypes = ["instagram", "whatsapp", "facebook", "messenger", "telegram"] as const;
type ValidChannelType = (typeof validChannelTypes)[number];

function normalizeChannelType(type?: string): ValidChannelType | null {
  const normalized = type?.toLowerCase();
  return validChannelTypes.find((channelType) => channelType === normalized) ?? null;
}

function formatDisplayName(type: ValidChannelType) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const payload = (await request.json()) as CreateAutomationPayload;
    const templateName = payload.templateName?.trim() || "Welcome Message";

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
      .select("id, business_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.business_id) {
      return NextResponse.json({ error: "Business profile not found." }, { status: 404 });
    }

    const requestedChannelType = normalizeChannelType(payload.channelType);
    let channelQuery = supabase
      .from("channels")
      .select("id, type")
      .eq("business_id", profile.business_id)
      .order("connected_at", { ascending: false, nullsFirst: false })
      .limit(1);

    if (requestedChannelType) {
      channelQuery = channelQuery.eq("type", requestedChannelType);
    }

    let { data: channel } = await channelQuery.maybeSingle();

    if (!channel && requestedChannelType) {
      const { data: createdChannel, error: channelCreateError } = await supabase
        .from("channels")
        .insert({
          business_id: profile.business_id,
          type: requestedChannelType,
          display_name: formatDisplayName(requestedChannelType),
          status: "ready_to_connect",
          webhook_status: "api_pending",
        })
        .select("id, type")
        .single();

      if (channelCreateError || !createdChannel) {
        throw new Error(channelCreateError?.message ?? "Could not connect channel.");
      }

      channel = createdChannel;
    } else if (channel && requestedChannelType) {
      const { error: channelUpdateError } = await supabase
        .from("channels")
        .update({
          status: "ready_to_connect",
          webhook_status: "api_pending",
          connected_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", channel.id);

      if (channelUpdateError) {
        throw new Error(channelUpdateError.message);
      }
    }

    const { data: existingAutomation } = await supabase
      .from("automations")
      .select("id")
      .eq("business_id", profile.business_id)
      .eq("name", templateName)
      .maybeSingle();

    const automationPayload = {
      business_id: profile.business_id,
      channel_id: channel?.id ?? null,
      name: templateName,
      trigger_type: templateTriggers[templateName] ?? "message_received",
      status: "active",
      config_json: {
        template: templateName,
        channel_type: channel?.type ?? payload.channelType ?? "instagram",
        created_from: "onboarding",
      },
      created_by: profile.id,
      updated_at: new Date().toISOString(),
    };

    if (existingAutomation) {
      const { error: updateError } = await supabase
        .from("automations")
        .update(automationPayload)
        .eq("id", existingAutomation.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      return NextResponse.json({ ok: true, status: "updated", automationId: existingAutomation.id });
    }

    const { data: automation, error: insertError } = await supabase
      .from("automations")
      .insert(automationPayload)
      .select("id")
      .single();

    if (insertError || !automation) {
      throw new Error(insertError?.message ?? "Could not create automation.");
    }

    return NextResponse.json({ ok: true, status: "created", automationId: automation.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create automation." },
      { status: 500 },
    );
  }
}
