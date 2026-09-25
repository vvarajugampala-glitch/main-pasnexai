"use client";

import { useEffect, useState } from "react";
import { HiOutlineChatBubbleLeftRight, HiOutlinePencilSquare, HiOutlinePlus } from "react-icons/hi2";
import { SiFacebook, SiInstagram, SiMessenger, SiTelegram, SiWhatsapp } from "react-icons/si";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { AutomationEditorModal, type AutomationItem } from "./AutomationEditorModal";

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

function formatChannel(automation: AutomationItem) {
  return automation.channels?.display_name || automation.channels?.type || "Workspace";
}

export function AutomationsLiveTable() {
  const [automations, setAutomations] = useState<AutomationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAutomation, setSelectedAutomation] = useState<AutomationItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadAutomations = async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/dashboard/automations", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!response.ok) {
      setIsLoading(false);
      return;
    }

    const data = (await response.json()) as { automations?: AutomationItem[] };
    setAutomations(data.automations ?? []);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadAutomations();

    const handleUpdate = () => {
      void loadAutomations();
    };

    const handleOpenEditor = (event: Event) => {
      const customEvt = event as CustomEvent<AutomationItem | undefined>;
      setSelectedAutomation(customEvt.detail || null);
      setIsModalOpen(true);
    };

    window.addEventListener("pasnex:automations-updated", handleUpdate);
    window.addEventListener("pasnex:open-automation-editor", handleOpenEditor as EventListener);

    return () => {
      window.removeEventListener("pasnex:automations-updated", handleUpdate);
      window.removeEventListener("pasnex:open-automation-editor", handleOpenEditor as EventListener);
    };
  }, []);

  const handleRowClick = (automation: AutomationItem) => {
    setSelectedAutomation(automation);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedAutomation(null);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl font-black text-white">Automation Flows</h2>
            <p className="text-xs text-slate-400">Click any flow row to edit trigger keywords and auto DM response</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">{automations.length} workflows</span>
            <button
              onClick={handleCreateNew}
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600/20 border border-blue-400/30 px-3.5 py-1.5 text-xs font-bold text-blue-200 transition hover:bg-blue-600/30"
            >
              <HiOutlinePlus className="h-4 w-4" />
              New Flow
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="py-3">Flow Name</th>
                <th>Status</th>
                <th>Channel</th>
                <th>Trigger</th>
                <th>Keyword</th>
                <th>Action</th>
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
                  <td colSpan={6} className="py-5 text-slate-400">
                    No workflows yet. Click "+ New Flow" or use a template to create your first automation.
                  </td>
                </tr>
              )}
              {automations.map((automation) => {
                const channelType = automation.channels?.type ?? (automation.config_json?.channel_type as string) ?? "";
                const Logo = channelLogos[channelType as keyof typeof channelLogos] ?? HiOutlineChatBubbleLeftRight;
                const logoClass = channelColors[channelType as keyof typeof channelColors] ?? "bg-blue-500/15 text-blue-300";
                const keywordVal = (automation.config_json?.keyword as string) || "price";

                return (
                  <tr
                    key={automation.id}
                    onClick={() => handleRowClick(automation)}
                    className="group cursor-pointer text-slate-300 transition hover:bg-white/[0.04]"
                  >
                    <td className="py-4 font-bold text-white group-hover:text-blue-300 transition">
                      {automation.name}
                    </td>
                    <td>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          automation.status === "active"
                            ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/20"
                            : automation.status === "draft"
                              ? "bg-slate-400/10 text-slate-300"
                              : "bg-amber-400/10 text-amber-300 border border-amber-400/20"
                        }`}
                      >
                        {automation.status ? automation.status.charAt(0).toUpperCase() + automation.status.slice(1) : "Active"}
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
                    <td>{formatTrigger(automation.trigger_type || "comment_received")}</td>
                    <td>
                      <span className="rounded bg-white/[0.06] px-2 py-1 font-mono text-xs text-blue-200">
                        {keywordVal}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(automation);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-slate-200 transition group-hover:border-blue-400/50 group-hover:bg-blue-600/20 group-hover:text-blue-200"
                      >
                        <HiOutlinePencilSquare className="h-4 w-4 text-blue-300" />
                        Configure
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AutomationEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        automation={selectedAutomation}
        onSaved={loadAutomations}
      />
    </>
  );
}
