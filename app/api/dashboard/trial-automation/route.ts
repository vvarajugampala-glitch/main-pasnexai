import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function getBusinessContext(token: string) {
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
    .select("id, business_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.business_id) {
    throw new Error("Business profile not found.");
  }

  return { supabase, businessId: profile.business_id, profileId: profile.id };
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { supabase, businessId, profileId } = await getBusinessContext(token);
    const now = new Date().toISOString();

    let { data: channel } = await supabase
      .from("channels")
      .select("id, type")
      .eq("business_id", businessId)
      .eq("type", "instagram")
      .maybeSingle();

    if (!channel) {
      const { data: createdChannel, error: channelError } = await supabase
        .from("channels")
        .insert({
          business_id: businessId,
          type: "instagram",
          display_name: "Instagram",
          status: "ready_to_connect",
          webhook_status: "api_pending",
          updated_at: now,
        })
        .select("id, type")
        .single();

      if (channelError || !createdChannel) {
        throw new Error(channelError?.message ?? "Could not prepare Instagram channel.");
      }

      channel = createdChannel;
    } else {
      const { error: channelUpdateError } = await supabase
        .from("channels")
        .update({
          status: "ready_to_connect",
          webhook_status: "api_pending",
          updated_at: now,
        })
        .eq("id", channel.id);

      if (channelUpdateError) {
        throw new Error(channelUpdateError.message);
      }
    }

    const automationName = "Instagram Comment to DM";
    const { data: existingAutomation } = await supabase
      .from("automations")
      .select("id")
      .eq("business_id", businessId)
      .eq("name", automationName)
      .maybeSingle();

    const automationPayload = {
      business_id: businessId,
      channel_id: channel.id,
      name: automationName,
      trigger_type: "comment_received",
      status: "active",
      config_json: {
        template: automationName,
        keyword: "price",
        customer_comment: "price details please",
        automated_dm: "Hi! Thanks for your interest. Please share your phone number and requirement so our team can help you.",
        lead_fields: ["name", "phone", "interest"],
        created_from: "trial_automation",
        provider_note: "Prepared simulation. Real Instagram API starts after Meta approval and token setup.",
      },
      created_by: profileId,
      updated_at: now,
    };

    let automationId = existingAutomation?.id ?? "";

    if (existingAutomation) {
      const { error: automationUpdateError } = await supabase
        .from("automations")
        .update(automationPayload)
        .eq("id", existingAutomation.id);

      if (automationUpdateError) {
        throw new Error(automationUpdateError.message);
      }
    } else {
      const { data: automation, error: automationError } = await supabase
        .from("automations")
        .insert(automationPayload)
        .select("id")
        .single();

      if (automationError || !automation) {
        throw new Error(automationError?.message ?? "Could not create trial automation.");
      }

      automationId = automation.id;
    }

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        business_id: businessId,
        channel_id: channel.id,
        name: "Trial Instagram Lead",
        phone: "+91 90000 00999",
        email: "trial-lead@example.com",
        source: "instagram",
        status: "qualified",
        score: 86,
        interest: "Asked for price through Instagram comment",
        next_action: "Send demo link and pricing options",
      })
      .select("id")
      .single();

    if (leadError || !lead) {
      throw new Error(leadError?.message ?? "Could not create trial lead.");
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        business_id: businessId,
        channel_id: channel.id,
        lead_id: lead.id,
        status: "open",
        last_message_at: now,
      })
      .select("id")
      .single();

    if (conversationError || !conversation) {
      await supabase.from("leads").delete().eq("id", lead.id);
      throw new Error(conversationError?.message ?? "Could not create trial conversation.");
    }

    const { error: messageError } = await supabase.from("messages").insert([
      {
        conversation_id: conversation.id,
        sender_type: "customer",
        message_text: "price details please",
        ai_generated: false,
        created_at: now,
      },
      {
        conversation_id: conversation.id,
        sender_type: "ai",
        message_text:
          "Thanks for your interest. Pasnex.ai can share pricing, qualify your requirement, and route this conversation to the right team member.",
        ai_generated: true,
        created_at: now,
      },
    ]);

    if (messageError) {
      await supabase.from("conversations").delete().eq("id", conversation.id);
      await supabase.from("leads").delete().eq("id", lead.id);
      throw new Error(messageError.message);
    }

    return NextResponse.json({
      ok: true,
      automationId,
      leadId: lead.id,
      conversationId: conversation.id,
      message: "Trial Instagram Comment to DM automation is ready.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not run trial automation." },
      { status: 500 },
    );
  }
}
