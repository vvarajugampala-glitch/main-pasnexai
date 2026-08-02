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

function isMissingTable(message: string) {
  return message.includes("admin_client_notes") || message.includes("relation") || message.includes("schema cache");
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { id } = await params;
    const { supabase } = await requireAdmin(token);

    const { data, error } = await supabase
      .from("admin_client_notes")
      .select("id, note, admin_email, created_at")
      .eq("business_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      if (isMissingTable(error.message)) {
        return NextResponse.json({ notes: [], setupRequired: true });
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ notes: data ?? [], setupRequired: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load admin notes." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing session." }, { status: 401 });
    }

    const { id } = await params;
    const { note } = (await request.json()) as { note?: string };
    const cleanNote = note?.trim();

    if (!cleanNote) {
      return NextResponse.json({ error: "Note is required." }, { status: 400 });
    }

    const { supabase, adminEmail } = await requireAdmin(token);
    const { error } = await supabase.from("admin_client_notes").insert({
      business_id: id,
      admin_email: adminEmail,
      note: cleanNote,
    });

    if (error) {
      if (isMissingTable(error.message)) {
        return NextResponse.json({ error: "Admin notes table is not created yet." }, { status: 409 });
      }
      throw new Error(error.message);
    }

    await supabase.from("admin_audit_logs").insert({
      admin_email: adminEmail,
      action: "client_internal_note_added",
      target_type: "business",
      target_id: id,
      metadata: { note_preview: cleanNote.slice(0, 80) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save admin note." },
      { status: 500 },
    );
  }
}
