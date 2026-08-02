"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Automation = {
  id: string;
  name: string;
  trigger_type: string;
  status: string;
  config_json: Record<string, unknown> | null;
  created_at: string;
  channels: { type: string; display_name: string } | null;
};

function formatTrigger(trigger: string) {
  return trigger
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatChannel(automation: Automation) {
  return automation.channels?.display_name || automation.channels?.type || "Workspace";
}

export function DashboardAutomationsTable() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAutomations() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/dashboard/automations-summary", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        setIsLoading(false);
        return;
      }

      const data = (await response.json()) as { automations?: Automation[] };
      setAutomations(data.automations ?? []);
      setIsLoading(false);
    }

    void loadAutomations();
  }, []);

  return (
    <section className="rounded-lg border border-white/10 bg-[#07101d]/90 p-4 shadow-[0_18px_60px_rgba(0,0,0,.18)]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">Top Performing Automations</h2>
        <Link href="/dashboard/automations" className="text-xs font-bold text-blue-300">View all</Link>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="py-3">Automation Name</th>
              <th>Status</th>
              <th>Channel</th>
              <th>Trigger</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {isLoading && (
              <tr>
                <td className="py-5 text-slate-400" colSpan={5}>Loading automations...</td>
              </tr>
            )}
            {!isLoading && automations.length === 0 && (
              <tr>
                <td className="py-5 text-slate-400" colSpan={5}>
                  No automations yet. Create your first workflow from onboarding.
                </td>
              </tr>
            )}
            {automations.map((automation) => (
              <tr key={automation.id} className="text-slate-300">
                <td className="py-3 font-semibold text-white">{automation.name}</td>
                <td>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${automation.status === "active" ? "bg-blue-400/10 text-blue-300" : "bg-amber-400/10 text-amber-300"}`}>
                    {automation.status.charAt(0).toUpperCase() + automation.status.slice(1)}
                  </span>
                </td>
                <td>{formatChannel(automation)}</td>
                <td>{formatTrigger(automation.trigger_type)}</td>
                <td>{automation.config_json?.created_from === "onboarding" ? "Onboarding" : "Workspace"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
