"use client";

import { HiOutlinePlus } from "react-icons/hi2";
import { DashboardLogoutButton } from "../DashboardLogoutButton";

export function AutomationsHeaderActions() {
  const handleCreate = () => {
    window.dispatchEvent(new CustomEvent("pasnex:open-automation-editor"));
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleCreate}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-bold shadow-[0_0_28px_rgba(37,99,235,.3)] transition hover:brightness-110"
      >
        <HiOutlinePlus className="h-5 w-5" />
        Create Automation
      </button>
      <DashboardLogoutButton />
    </div>
  );
}
