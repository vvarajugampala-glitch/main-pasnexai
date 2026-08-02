import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const platformAdminEmails = new Set(["pasnexai@gmail.com"]);

async function requireAdmin(token: string) {
  const supabase = createSupabaseAdminClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user?.email || !platformAdminEmails.has(user.email.toLowerCase())) {
    throw new Error("Platform admin access required.");
  }

  return { supabase, adminEmail: user.email };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; channelId: string }> }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { id, channelId } = await params;
    const payload = (await request.json()) as { handle?: string };
    const handle = payload.handle?.trim() || null;

    const { supabase, adminEmail } = await requireAdmin(token);
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("id, type")
      .eq("id", channelId)
      .eq("business_id", id)
      .maybeSingle<{ id: string; type: string }>();

    if (channelError) {
      throw new Error(channelError.message);
    }

    if (!channel) {
      return NextResponse.json({ error: "Channel not found for this client." }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("channels")
      .update({ handle, updated_at: new Date().toISOString() })
      .eq("id", channelId)
      .eq("business_id", id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await supabase.from("admin_audit_logs").insert({
      admin_email: adminEmail,
      action: "provider_channel_handle_updated",
      target_type: "business",
      target_id: id,
      metadata: {
        channel_id: channelId,
        channel_type: channel.type,
        handle,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update channel handle." },
      { status: 500 },
    );
  }
}
