"use client";

import { useEffect, useState } from "react";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { SiFacebook, SiInstagram, SiMessenger, SiTelegram, SiWhatsapp } from "react-icons/si";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Automation = {
  id: string;
  name: string;
  trigger_type: string;
  status: string;
  config_json: Record<string, unknown> | null;
  channels: { type: string; display_name: string } | null;
};

const channelLogos = {
  instagram: SiInstagram,
  whatsapp: SiWhatsapp,
  facebook: SiFacebook,
  messenger: SiMessenger,
  telegram: SiTelegram,
};

const channelColors = {
  instagram: "bg-gradient-to-br from-yellow-300 via-pink-500 to-violet-600 text-white",
  whatsapp: "bg-[#25D366] text-white",
  facebook: "bg-[#1877F2] text-white",
  messenger: "bg-[#00B2FF] text-white",
  telegram: "bg-[#26A5E4] text-white",
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

export function AutomationsLiveTable() {
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
    window.addEventListener("pasnex:automations-updated", loadAutomations);

    return () => {
      window.removeEventListener("pasnex:automations-updated", loadAutomations);
    };
  }, []);

  return (
    <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Automation Flows</h2>
        <span className="text-xs font-bold text-slate-500">{automations.length} workflows</span>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="py-3">Flow</th>
              <th>Status</th>
              <th>Channel</th>
              <th>Trigger</th>
              <th>Source</th>
              <th>Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {isLoading && (
              <tr>
                <td colSpan={6} className="py-5 text-slate-400">Loading workflows...</td>
              </tr>
            )}
            {!isLoading && automations.length === 0 && (
              <tr>
                <td colSpan={6} className="py-5 text-slate-400">No workflows yet. Run onboarding or use a template to create your first automation.</td>
              </tr>
            )}
            {automations.map((automation) => {
              const channelType = automation.channels?.type ?? "";
              const Logo = channelLogos[channelType as keyof typeof channelLogos] ?? HiOutlineChatBubbleLeftRight;
              const logoClass = channelColors[channelType as keyof typeof channelColors] ?? "bg-blue-500/15 text-blue-300";

              return (
                <tr key={automation.id} className="text-slate-300">
                  <td className="py-4 font-bold text-white">{automation.name}</td>
                  <td>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${automation.status === "active" ? "bg-blue-400/10 text-blue-300" : automation.status === "draft" ? "bg-slate-400/10 text-slate-300" : "bg-amber-400/10 text-amber-300"}`}>
                      {automation.status.charAt(0).toUpperCase() + automation.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-2">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${logoClass}`}>
                        <Logo className="h-4 w-4" />
                      </span>
                      {formatChannel(automation)}
                    </span>
                  </td>
                  <td>{formatTrigger(automation.trigger_type)}</td>
                  <td>{automation.config_json?.created_from === "onboarding" ? "Onboarding" : "Workspace"}</td>
                  <td><span className="text-blue-300">{automation.status === "active" ? "Setup ready" : "Needs setup"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
