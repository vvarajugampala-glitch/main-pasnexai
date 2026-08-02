"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const statuses = ["open", "in_progress", "resolved", "closed"];

export function AdminTicketStatusSelect({
  ticketId,
  status,
  onUpdated,
}: {
  ticketId: string;
  status: string;
  onUpdated?: () => void;
}) {
  const [value, setValue] = useState(status);
  const [isSaving, setIsSaving] = useState(false);

  const updateStatus = async (nextStatus: string) => {
    setValue(nextStatus);
    setIsSaving(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) throw new Error("Admin session expired.");

      const response = await fetch("/api/admin/support-tickets", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticketId, status: nextStatus }),
      });

      if (!response.ok) throw new Error("Could not update ticket.");
      onUpdated?.();
    } catch {
      setValue(status);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <select
      value={value}
      onChange={(event) => void updateStatus(event.target.value)}
      disabled={isSaving}
      className="rounded-lg border border-white/10 bg-[#030712] px-2 py-1 text-xs font-bold text-slate-200 outline-none disabled:cursor-not-allowed disabled:opacity-60"
    >
      {statuses.map((item) => (
        <option key={item} value={item}>
          {item.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}
