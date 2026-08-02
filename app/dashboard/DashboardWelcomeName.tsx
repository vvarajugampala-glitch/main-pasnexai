"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function DashboardWelcomeName() {
  const [firstName, setFirstName] = useState("there");

  useEffect(() => {
    let mounted = true;

    async function loadName() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      const name = data?.full_name || user.email || "";
      setFirstName(name.trim().split(/\s+/)[0] || "there");
    }

    loadName();

    return () => {
      mounted = false;
    };
  }, []);

  return <>Welcome Back, {firstName}</>;
}
