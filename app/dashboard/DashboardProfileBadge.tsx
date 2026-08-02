"use client";

import { useEffect, useState } from "react";
import { HiOutlineUserCircle } from "react-icons/hi2";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProfileState = {
  name: string;
  role: string;
};

function formatRole(role?: string | null) {
  if (!role) return "Owner";
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function DashboardProfileBadge() {
  const [profile, setProfile] = useState<ProfileState>({ name: "Client", role: "Owner" });

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted || !data) return;

      setProfile({
        name: data.full_name || user.email || "Client",
        role: formatRole(data.role),
      });
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#07101d] px-3 py-2">
      <HiOutlineUserCircle className="h-8 w-8 text-blue-300" />
      <div className="hidden text-sm sm:block">
        <p className="max-w-[150px] truncate font-bold">{profile.name}</p>
        <p className="text-xs text-slate-500">{profile.role}</p>
      </div>
    </div>
  );
}
