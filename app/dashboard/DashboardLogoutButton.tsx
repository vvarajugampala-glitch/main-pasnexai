"use client";

import { HiOutlineArrowRightOnRectangle } from "react-icons/hi2";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function DashboardLogoutButton() {
  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.localStorage.removeItem("pasnex_onboarding_complete");
    window.location.href = "/login";
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:border-red-300/40 hover:bg-red-400/10 hover:text-red-100"
    >
      <HiOutlineArrowRightOnRectangle className="h-5 w-5" />
      Logout
    </button>
  );
}
