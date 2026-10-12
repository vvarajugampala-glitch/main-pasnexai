"use client";

import { createBrowserClient } from "@supabase/ssr";

export function normalizeSupabaseUrl(url?: string): string {
  if (!url) return "https://placeholder.supabase.co";
  let cleanUrl = url.trim().replace(/^["']|["']$/g, "");
  if (!cleanUrl) return "https://placeholder.supabase.co";
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = `https://${cleanUrl}`;
  }
  try {
    const parsed = new URL(cleanUrl);
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "https://placeholder.supabase.co";
  }
}

export function createSupabaseBrowserClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseUrl = normalizeSupabaseUrl(rawUrl);
  const supabaseAnonKey =
    (rawKey || "").trim().replace(/^["']|["']$/g, "") ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMjY5MDcsImV4cCI6MTc5MDM3MDEwN30.dummy";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
