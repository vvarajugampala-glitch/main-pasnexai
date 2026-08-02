import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ConversationWithLeadScore = {
  id: string;
  lead_id: string | null;
  leads?: { score: number | null } | { score: number | null }[] | null;
};

function getLeadScore(conversation: ConversationWithLeadScore) {
  const lead = Array.isArray(conversation.leads) ? conversation.leads[0] : conversation.leads;
  return Number(lead?.score ?? 0);
}

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
    .select("business_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.business_id) {
    throw new Error("Business profile not found.");
  }

  return { supabase, businessId: profile.business_id };
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { supabase, businessId } = await getBusinessContext(token);
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("id, status, last_message_at, created_at, channels(type, display_name), leads(id, name, status, score, interest, next_action), messages(id, sender_type, message_text, ai_generated, created_at)")
      .eq("business_id", businessId)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ conversations: conversations ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load inbox." },
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

    const { supabase, businessId } = await getBusinessContext(token);
    const { data: channel } = await supabase
      .from("channels")
      .select("id, type")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        business_id: businessId,
        channel_id: channel?.id ?? null,
        name: "Sample Inbox Lead",
        phone: "+91 90000 00001",
        email: "inbox-lead@example.com",
        source: channel?.type ?? "instagram",
        status: "qualified",
        score: 84,
        interest: "AI reply automation",
        next_action: "Send demo link",
      })
      .select("id")
      .single();

    if (leadError || !lead) {
      throw new Error(leadError?.message ?? "Could not create lead.");
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        business_id: businessId,
        channel_id: channel?.id ?? null,
        lead_id: lead.id,
        status: "open",
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (conversationError || !conversation) {
      throw new Error(conversationError?.message ?? "Could not create conversation.");
    }

    const { error: messagesError } = await supabase.from("messages").insert([
      {
        conversation_id: conversation.id,
        sender_type: "customer",
        message_text: "Hi, can Pasnex.ai reply to social messages automatically?",
        ai_generated: false,
      },
      {
        conversation_id: conversation.id,
        sender_type: "ai",
        message_text: "Yes. Pasnex.ai can prepare reply workflows, qualify leads, and route conversations to your team after API approval.",
        ai_generated: true,
      },
    ]);

    if (messagesError) {
      await supabase.from("conversations").delete().eq("id", conversation.id);
      await supabase.from("leads").delete().eq("id", lead.id);
      throw new Error(messagesError.message);
    }

    return NextResponse.json({ ok: true, conversationId: conversation.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create test conversation." },
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

    const { supabase, businessId } = await getBusinessContext(token);
    const body = (await request.json()) as {
      action?: string;
      conversationId?: string;
      messageText?: string;
    };

    if (!body.conversationId) {
      return NextResponse.json({ error: "Conversation is required." }, { status: 400 });
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id, lead_id, leads(score)")
      .eq("id", body.conversationId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (conversationError || !conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }
    const selectedConversation = conversation as ConversationWithLeadScore;

    if (body.action === "send_message") {
      const messageText = body.messageText?.trim();

      if (!messageText) {
        return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
      }

      const now = new Date().toISOString();
      const { error: messageError } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_type: "agent",
        message_text: messageText,
        ai_generated: false,
        created_at: now,
      });

      if (messageError) {
        throw new Error(messageError.message);
      }

      await supabase.from("conversations").update({ last_message_at: now }).eq("id", conversation.id);

      if (selectedConversation.lead_id) {
        await supabase
          .from("leads")
          .update({
            score: Math.min(getLeadScore(selectedConversation) + 3, 100),
            next_action: "Wait for customer reply",
          })
          .eq("id", selectedConversation.lead_id)
          .eq("business_id", businessId);
      }

      return NextResponse.json({ ok: true });
    }

    if (body.action === "mark_qualified" || body.action === "create_task") {
      if (!selectedConversation.lead_id) {
        return NextResponse.json({ error: "Lead not found for this conversation." }, { status: 404 });
      }

      const update =
        body.action === "mark_qualified"
          ? { status: "qualified", score: 90, next_action: "Send proposal" }
          : {
              score: Math.min(getLeadScore(selectedConversation) + 5, 100),
              next_action: "Follow up with demo and pricing",
            };

      const { error: leadError } = await supabase
        .from("leads")
        .update(update)
        .eq("id", selectedConversation.lead_id)
        .eq("business_id", businessId);

      if (leadError) {
        throw new Error(leadError.message);
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unsupported inbox action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update inbox." },
      { status: 500 },
    );
  }
}
