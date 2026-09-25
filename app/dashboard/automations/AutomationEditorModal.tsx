"use client";

import { useEffect, useState } from "react";
import { HiOutlineBolt, HiOutlineChatBubbleLeftRight, HiOutlineXMark } from "react-icons/hi2";
import { SiFacebook, SiInstagram, SiMessenger, SiTelegram, SiWhatsapp } from "react-icons/si";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type AutomationItem = {
  id?: string;
  name?: string;
  trigger_type?: string;
  status?: string;
  config_json?: {
    template?: string;
    channel_type?: string;
    keyword?: string;
    automated_dm?: string;
    response_message?: string;
    dm_text?: string;
    post_id?: string;
  } | null;
  channels?: { id?: string; type?: string; display_name?: string } | null;
};

type AutomationEditorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  automation?: AutomationItem | null;
  onSaved?: () => void;
};

const channelOptions = [
  { type: "instagram", name: "Instagram", Icon: SiInstagram, color: "text-pink-400" },
  { type: "whatsapp", name: "WhatsApp", Icon: SiWhatsapp, color: "text-emerald-400" },
  { type: "facebook", name: "Facebook", Icon: SiFacebook, color: "text-blue-400" },
  { type: "messenger", name: "Messenger", Icon: SiMessenger, color: "text-cyan-400" },
  { type: "telegram", name: "Telegram", Icon: SiTelegram, color: "text-sky-400" },
];

const triggerOptions = [
  { type: "comment_received", label: "Comment Received", desc: "Triggers when a visitor comments on a post or reel" },
  { type: "message_received", label: "Message Received", desc: "Triggers when a customer sends a direct message" },
  { type: "keyword_or_message", label: "Keyword Match", desc: "Triggers on specific keyword anywhere in incoming text" },
  { type: "ai_chat_started", label: "AI Chat Started", desc: "Triggers AI assistant to handle initial conversation" },
];

export function AutomationEditorModal({ isOpen, onClose, automation, onSaved }: AutomationEditorModalProps) {
  const [name, setName] = useState("Instagram Comment to DM");
  const [channelType, setChannelType] = useState("instagram");
  const [triggerType, setTriggerType] = useState("comment_received");
  const [keyword, setKeyword] = useState("price");
  const [postId, setPostId] = useState("");
  const [responseMessage, setResponseMessage] = useState(
    "Hi! Thanks for your interest. Please share your requirement so our team can assist you."
  );
  const [status, setStatus] = useState("active");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (automation) {
      setName(automation.name || "Instagram Comment to DM");
      setChannelType(automation.channels?.type || automation.config_json?.channel_type || "instagram");
      setTriggerType(automation.trigger_type || "comment_received");
      setKeyword(automation.config_json?.keyword || "price");
      setPostId(automation.config_json?.post_id || "");
      setResponseMessage(
        automation.config_json?.automated_dm ||
          automation.config_json?.response_message ||
          automation.config_json?.dm_text ||
          "Hi! Thanks for your interest. Please share your requirement so our team can assist you."
      );
      setStatus(automation.status || "active");
    } else {
      setName("Instagram Comment to DM");
      setChannelType("instagram");
      setTriggerType("comment_received");
      setKeyword("price");
      setPostId("");
      setResponseMessage(
        "Hi! Thanks for your interest. Please share your requirement so our team can assist you."
      );
      setStatus("active");
    }
    setErrorMessage("");
    setSuccessMessage("");
  }, [automation, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please login again to save automation.");
      }

      const response = await fetch("/api/dashboard/automations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: automation?.id,
          name,
          channelType,
          triggerType,
          keyword,
          postId,
          responseMessage,
          status,
        }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string; status?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Could not save automation.");
      }

      setSuccessMessage(`Automation "${name}" saved successfully as ${status.toUpperCase()}!`);
      window.dispatchEvent(new Event("pasnex:automations-updated"));

      if (onSaved) onSaved();

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not save automation.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#07101d] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600">
              <HiOutlineBolt className="h-6 w-6 text-white" />
            </span>
            <div>
              <h2 className="text-xl font-black text-white">
                {automation?.id ? "Edit Automation Workflow" : "Configure New Automation"}
              </h2>
              <p className="text-xs text-slate-400">Configure triggers, keywords, actions, and auto DM responses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <HiOutlineXMark className="h-6 w-6" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSave} className="mt-5 grid gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Workflow Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-blue-400 focus:outline-none"
              placeholder="e.g. Instagram Comment to DM"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Target Channel</label>
              <select
                value={channelType}
                onChange={(e) => setChannelType(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#0c192c] px-4 py-3 text-sm text-white focus:border-blue-400 focus:outline-none"
              >
                {channelOptions.map((opt) => (
                  <option key={opt.type} value={opt.type}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Workflow Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#0c192c] px-4 py-3 text-sm text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="active">Active (Running 24/7)</option>
                <option value="paused">Paused</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Choose Trigger</label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {triggerOptions.map((trig) => (
                <button
                  key={trig.type}
                  type="button"
                  onClick={() => setTriggerType(trig.type)}
                  className={`flex flex-col text-left rounded-lg border p-3 transition ${
                    triggerType === trig.type
                      ? "border-blue-500 bg-blue-500/10 text-white"
                      : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20"
                  }`}
                >
                  <span className="font-bold text-sm">{trig.label}</span>
                  <span className="mt-1 text-xs text-slate-400 leading-relaxed">{trig.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Trigger Keyword (e.g. price)
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-blue-400 focus:outline-none"
                placeholder="e.g. price, info, demo (or * for all)"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Matches comment text containing this word (case-insensitive).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Post ID Filter (Optional)
              </label>
              <input
                type="text"
                value={postId}
                onChange={(e) => setPostId(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-blue-400 focus:outline-none"
                placeholder="Specific IG post/reel ID (or empty for all posts)"
              />
              <p className="mt-1 text-[11px] text-slate-400">Leave blank to monitor comments across all posts.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Add Action: Private DM Reply
            </label>
            <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-300 mb-2">
                <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
                <span>Automated DM Message Sent to Commenter</span>
              </div>
              <textarea
                rows={3}
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-[#030712] p-3 text-sm text-white focus:border-blue-400 focus:outline-none"
                placeholder="Enter exact message to send via Instagram DM..."
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(37,99,235,.3)] transition hover:brightness-110 disabled:opacity-60"
            >
              {isSaving ? "Saving Configuration..." : "Save & Activate Workflow"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
