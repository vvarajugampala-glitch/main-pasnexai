import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const platformAdminEmails = new Set(["pasnexai@gmail.com"]);

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing admin session." }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user?.email) {
      return NextResponse.json({ error: "Invalid admin session." }, { status: 401 });
    }

    if (!platformAdminEmails.has(user.email.toLowerCase())) {
      return NextResponse.json({ error: "This login is not allowed for platform admin." }, { status: 403 });
    }

    return NextResponse.json({
      admin: {
        email: user.email,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not verify admin access." },
      { status: 500 },
    );
  }
}
