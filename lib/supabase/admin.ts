import { createClient } from "@supabase/supabase-js";
import { getRequiredEnv, validateSupabaseJwtKeys } from "@/lib/env";

export function createSupabaseAdminClient() {
  validateSupabaseJwtKeys();

  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
