export function getRequiredEnv(name: string) {
  let value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  value = value.trim().replace(/^["']|["']$/g, "");
  if (name === "NEXT_PUBLIC_SUPABASE_URL" && !value.startsWith("http://") && !value.startsWith("https://")) {
    value = `https://${value}`;
  }

  return value;
}

export function hasSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key);
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
