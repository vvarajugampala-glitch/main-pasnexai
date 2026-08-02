import { NextResponse } from "next/server";
import { isJwtLikeKey } from "@/lib/env";

export function GET() {
  return NextResponse.json({
    ok: true,
    app: "Pasnex.ai",
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    supabaseJwtKeysReady: Boolean(
      isJwtLikeKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
        isJwtLikeKey(process.env.SUPABASE_SERVICE_ROLE_KEY),
    ),
    timestamp: new Date().toISOString(),
  });
}
