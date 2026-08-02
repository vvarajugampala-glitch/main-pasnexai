export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isJwtLikeKey(value: string | undefined) {
  return Boolean(value?.startsWith("eyJ"));
}

export function validateSupabaseJwtKeys() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isJwtLikeKey(anonKey) || !isJwtLikeKey(serviceRoleKey)) {
    throw new Error(
      "Supabase keys are not JWT keys. Please use the anon public key and service_role key that start with eyJ...",
    );
  }
}
