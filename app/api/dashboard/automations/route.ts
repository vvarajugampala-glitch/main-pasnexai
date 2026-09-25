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
      .select("id, name, trigger_type, status, config_json, created_at, channel_id, channels(id, type, display_name)")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });

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

export async function POST(request: Request) {
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
      .select("id, business_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.business_id) {
      return NextResponse.json({ error: "Business profile not found." }, { status: 404 });
    }

    const body = (await request.json()) as {
      id?: string;
      name?: string;
      channelType?: string;
      triggerType?: string;
      keyword?: string;
      postId?: string;
      responseMessage?: string;
      status?: string;
    };

    const { id, name, channelType, triggerType, keyword, postId, responseMessage, status } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Automation name is required." }, { status: 400 });
    }

    const normChannelType = (channelType || "instagram").toLowerCase();

    let { data: channel } = await supabase
      .from("channels")
      .select("id, type")
      .eq("business_id", profile.business_id)
      .eq("type", normChannelType)
      .maybeSingle();

    if (!channel) {
      const { data: newChannel, error: channelCreateError } = await supabase
        .from("channels")
        .insert({
          business_id: profile.business_id,
          type: normChannelType,
          display_name: normChannelType.charAt(0).toUpperCase() + normChannelType.slice(1),
          status: "ready_to_connect",
          webhook_status: "api_pending",
        })
        .select("id, type")
        .single();

      if (channelCreateError) {
        throw new Error(channelCreateError.message);
      }
      channel = newChannel;
    }

    const now = new Date().toISOString();
    const defaultResponse = "Hi! Thanks for your interest. Please share your requirement so our team can assist you.";
    const responseText = responseMessage?.trim() || defaultResponse;

    const config_json = {
      template: name.trim(),
      channel_type: normChannelType,
      keyword: keyword ? keyword.trim() : "price",
      customer_comment: keyword ? keyword.trim() : "price",
      automated_dm: responseText,
      response_message: responseText,
      dm_text: responseText,
      post_id: postId ? postId.trim() : "",
      created_from: "builder",
    };

    const automationPayload = {
      business_id: profile.business_id,
      channel_id: channel?.id ?? null,
      name: name.trim(),
      trigger_type: triggerType || "comment_received",
      status: status || "active",
      config_json,
      updated_at: now,
    };

    if (id) {
      const { data: updated, error: updateError } = await supabase
        .from("automations")
        .update(automationPayload)
        .eq("id", id)
        .eq("business_id", profile.business_id)
        .select("id")
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }
      return NextResponse.json({ ok: true, status: "updated", automationId: updated.id });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("automations")
      .insert({
        ...automationPayload,
        created_by: profile.id,
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({ ok: true, status: "created", automationId: inserted.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save automation." },
      { status: 500 },
    );
  }
}
