import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const days = 7;

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function formatKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

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
      return NextResponse.json({ points: [] });
    }

    const today = startOfDay(new Date());
    const dateBuckets = Array.from({ length: days }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (days - 1 - index));
      return {
        key: formatKey(date),
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: 0,
      };
    });

    const startDate = dateBuckets[0].key;
    const [
      { data: automations },
      { data: leads },
      { data: conversations },
    ] = await Promise.all([
      supabase
        .from("automations")
        .select("created_at")
        .eq("business_id", profile.business_id)
        .gte("created_at", startDate),
      supabase
        .from("leads")
        .select("created_at")
        .eq("business_id", profile.business_id)
        .gte("created_at", startDate),
      supabase
        .from("conversations")
        .select("id, created_at")
        .eq("business_id", profile.business_id)
        .gte("created_at", startDate),
    ]);

    const bucketMap = new Map(dateBuckets.map((bucket) => [bucket.key, bucket]));

    for (const item of automations ?? []) {
      const bucket = bucketMap.get(formatKey(new Date(item.created_at)));
      if (bucket) bucket.value += 2;
    }

    for (const item of leads ?? []) {
      const bucket = bucketMap.get(formatKey(new Date(item.created_at)));
      if (bucket) bucket.value += 1;
    }

    for (const item of conversations ?? []) {
      const bucket = bucketMap.get(formatKey(new Date(item.created_at)));
      if (bucket) bucket.value += 1;
    }

    return NextResponse.json({ points: dateBuckets });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load growth data." },
      { status: 500 },
    );
  }
}
