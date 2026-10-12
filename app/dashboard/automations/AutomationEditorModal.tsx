"use client";

import { useEffect, useState } from "react";
import {
  HiOutlineBolt,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineSparkles,
  HiOutlineTag,
  HiOutlineXMark,
  HiOutlinePaperAirplane,
} from "react-icons/hi2";
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
    post_scope?: "all" | "specific";
    post_id?: string;
    comment_condition_type?: "any" | "keywords";
    keyword?: string;
    keywords?: string[];
    match_mode?: "contains_any" | "contains_all" | "exact";
    action_type?: string;
    automated_dm?: string;
    response_message?: string;
    dm_text?: string;
    public_reply_enabled?: boolean;
    public_reply_text?: string;
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
  {
    type: "comment_received",
    label: "Comment Received",
    desc: "Triggers when a visitor comments on your post or reel",
  },
  {
    type: "message_received",
    label: "Direct Message Received",
    desc: "Triggers when a customer sends an Instagram Direct Message",
  },
  {
    type: "keyword_or_message",
    label: "Keyword Match",
    desc: "Triggers on specific keywords found anywhere in incoming text",
  },
  {
    type: "ai_chat_started",
    label: "AI Assistant Started",
    desc: "Triggers AI assistant to handle initial conversation",
  },
];

const actionOptions = [
  {
    type: "send_dm",
    label: "Send Private Instagram DM",
    desc: "Automatically sends a private direct message to commenter",
  },
  {
    type: "send_link",
    label: "Send Link in DM",
    desc: "Sends automated DM containing clickable link",
  },
  {
    type: "ai_handoff",
    label: "AI Sales Follow-up",
    desc: "Hands conversation over to AI assistant for follow-up",
  },
];

const matchModeOptions = [
  { type: "contains_any", label: "Contains Any", desc: "Matches if comment has at least one keyword" },
  { type: "contains_all", label: "Contains All", desc: "Matches only if comment contains all keywords" },
  { type: "exact", label: "Exact Match", desc: "Matches exact keyword phrase only" },
];

const BUILDER_STEPS = [
  { id: 1, label: "Name & Channel" },
  { id: 2, label: "Target Post" },
  { id: 3, label: "Comments" },
  { id: 4, label: "Actions" },
  { id: 5, label: "Responses" },
  { id: 6, label: "Summary" },
];

export function AutomationEditorModal({ isOpen, onClose, automation, onSaved }: AutomationEditorModalProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [name, setName] = useState("Instagram Auto-DM Workflow");
  const [channelType, setChannelType] = useState("instagram");
  const [triggerType, setTriggerType] = useState("comment_received");
  
  // Post targeting
  const [postScope, setPostScope] = useState<"all" | "specific">("all");
  const [postId, setPostId] = useState("");

  // Comment conditions
  const [commentConditionType, setCommentConditionType] = useState<"any" | "keywords">("keywords");
  const [keywords, setKeywords] = useState<string[]>(["price", "cost", "buy"]);
  const [newKeywordInput, setNewKeywordInput] = useState("");
  const [matchMode, setMatchMode] = useState<"contains_any" | "contains_all" | "exact">("contains_any");

  // Actions & Responses
  const [actionType, setActionType] = useState("send_dm");
  const [publicReplyEnabled, setPublicReplyEnabled] = useState(true);
  const [publicReplyText, setPublicReplyText] = useState("Thanks for reaching out! Just sent you a private DM with the details 📩");
  const [responseMessage, setResponseMessage] = useState(
    "Hi Alex 👋 Thanks for your interest! Would you like me to send you the full details?"
  );

  const [previewTab, setPreviewTab] = useState<"post" | "dm">("dm");
  const [status, setStatus] = useState("active");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [openingDmText, setOpeningDmText] = useState("Send me the link");
  const [askFollowBeforeLink, setAskFollowBeforeLink] = useState(false);
  const [askEmailBeforeLink, setAskEmailBeforeLink] = useState(false);
  const [followUpDmEnabled, setFollowUpDmEnabled] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkButtonText, setLinkButtonText] = useState("Check it out");
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [nameEditedManually, setNameEditedManually] = useState(false);

  const selectedChannelObj = channelOptions.find((c) => c.type === channelType) || channelOptions[0];

  const handleChannelSelect = (type: string) => {
    setChannelType(type);
    const targetObj = channelOptions.find((c) => c.type === type);
    const channelLabel = targetObj ? targetObj.name : "Workflow";
    // If the user hasn't typed a completely custom name, automatically update the workflow name box
    if (!nameEditedManually || name.includes("Auto-DM") || name.includes("Workflow")) {
      setName(`${channelLabel} Auto-DM Workflow`);
    }
  };

  useEffect(() => {
    if (automation) {
      setName(automation.name || "Instagram Auto-DM Workflow");
      setChannelType(automation.channels?.type || automation.config_json?.channel_type || "instagram");
      setTriggerType(automation.trigger_type || "comment_received");

      // Post Scope & ID
      const scope = automation.config_json?.post_scope || (automation.config_json?.post_id ? "specific" : "all");
      setPostScope(scope);
      setPostId(automation.config_json?.post_id || "");

      // Comment condition
      const condType = automation.config_json?.comment_condition_type || 
        (automation.config_json?.keyword === "*" ? "any" : "keywords");
      setCommentConditionType(condType);

      const existingKeywords = automation.config_json?.keywords;
      if (Array.isArray(existingKeywords) && existingKeywords.length > 0 && !existingKeywords.includes("*")) {
        setKeywords(existingKeywords);
      } else if (automation.config_json?.keyword && automation.config_json.keyword !== "*") {
        setKeywords([automation.config_json.keyword]);
      } else {
        setKeywords(["price", "cost", "buy"]);
      }

      setMatchMode(automation.config_json?.match_mode || "contains_any");
      setActionType(automation.config_json?.action_type || "send_dm");
      
      setPublicReplyEnabled(automation.config_json?.public_reply_enabled ?? true);
      setPublicReplyText(
        automation.config_json?.public_reply_text ||
        "Thanks for reaching out! Just sent you a private DM with the details 📩"
      );

      setResponseMessage(
        automation.config_json?.automated_dm ||
          automation.config_json?.response_message ||
          automation.config_json?.dm_text ||
          "Hi Alex 👋 Thanks for your interest! Would you like me to send you the full details?"
      );
      setStatus(automation.status || "active");
    } else {
      setName("Instagram Auto-DM Workflow");
      setChannelType("instagram");
      setTriggerType("comment_received");
      setPostScope("all");
      setPostId("");
      setCommentConditionType("keywords");
      setKeywords(["price", "cost", "buy"]);
      setMatchMode("contains_any");
      setActionType("send_dm");
      setPublicReplyEnabled(true);
      setPublicReplyText("Thanks for reaching out! Just sent you a private DM with the details 📩");
      setResponseMessage("Hi Alex 👋 Thanks for your interest! Would you like me to send you the full details?");
      setStatus("active");
    }
    setActiveStep(1);
    setErrorMessage("");
    setSuccessMessage("");
  }, [automation, isOpen]);

  if (!isOpen) return null;

  const handleAddKeyword = () => {
    const trimmed = newKeywordInput.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setNewKeywordInput("");
    }
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setKeywords(keywords.filter((kw) => kw !== kwToRemove));
  };

  const handleSave = async () => {
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

      if (postScope === "specific" && !postId.trim()) {
        throw new Error("Please provide an Instagram Post/Reel URL or ID for specific post targeting.");
      }

      if (commentConditionType === "keywords" && keywords.length === 0) {
        throw new Error("Please add at least one keyword for keyword matching, or choose 'Any Comment'.");
      }

      const primaryKeyword = commentConditionType === "any" ? "*" : (keywords[0] || "price");

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
          postScope,
          postId: postScope === "specific" ? postId.trim() : "",
          commentConditionType,
          keyword: primaryKeyword,
          keywords: commentConditionType === "any" ? ["*"] : keywords,
          matchMode,
          actionType,
          publicReplyEnabled,
          publicReplyText: publicReplyEnabled ? publicReplyText.trim() : "",
          responseMessage,
          status,
        }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };

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

  const activeKeywordList = commentConditionType === "any" ? "Any comment (*)" : keywords.length > 0 ? keywords.join(", ") : "None";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-3 backdrop-blur-md">
      <div className="relative w-full max-w-6xl h-[96vh] flex flex-col rounded-2xl border border-slate-700/60 bg-[#0c1322] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden">
        
        {/* Modal Top Header (Refined eye-friendly header) */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-3 bg-[#0a101d] shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md">
              <HiOutlineBolt className="h-4 w-4 text-white" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-100 tracking-tight leading-tight">
                {automation?.id
                  ? `Edit ${selectedChannelObj.name} Automation`
                  : `${selectedChannelObj.name} Automation Builder`}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Configure automated triggers, instant replies &amp; direct messaging
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        {/* Center Body Area */}
        <div className="flex-1 overflow-hidden px-6 py-4 flex flex-col min-h-0 bg-[#0c1322]">
          {/* Messages */}
          {errorMessage && (
            <div className="mb-2 shrink-0 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs font-semibold text-rose-200">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="mb-2 shrink-0 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-semibold text-emerald-200 flex items-center gap-2">
              <HiOutlineCheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MAIN 2-COLUMN MANYCHAT-STYLE BUILDER LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start h-full min-h-0">
            
            {/* LEFT COLUMN: INDEPENDENT SCROLLABLE BUILDER FLOW (Span 7) */}
            <div className="lg:col-span-7 space-y-5 h-full overflow-y-auto pr-3 custom-scrollbar pb-4">
            
            {/* Top Workflow Name & Channel Quick Bar */}
            <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60 shadow-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Workflow Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNameEditedManually(true);
                    }}
                    className="w-full rounded-lg border border-slate-700/60 bg-[#080d18] px-3.5 py-2 text-sm text-slate-100 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none transition"
                    placeholder="e.g. Lead Magnet Reel Auto-DM"
                  />
                </div>
                <div className="sm:w-48">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Channel
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700/60 bg-[#080d18]">
                    <selectedChannelObj.Icon className={`h-4 w-4 ${selectedChannelObj.color} shrink-0`} />
                    <select
                      value={channelType}
                      onChange={(e) => handleChannelSelect(e.target.value)}
                      className="bg-transparent text-xs text-slate-100 font-semibold focus:outline-none w-full cursor-pointer"
                    >
                      {channelOptions.map((ch) => (
                        <option key={ch.type} value={ch.type} className="bg-[#0b1329] text-white">
                          {ch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 1: TRIGGER SOURCE (ADAPTIVE BASED ON POST COMMENT VS DIRECT MESSAGE) */}
            {previewTab === "post" ? (
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
                  When someone comments on
                </h3>

                <div className="space-y-2.5">
                  {/* Option 1: a specific post or reel */}
                  <div
                    onClick={() => setPostScope("specific")}
                    className={`rounded-xl border p-4 cursor-pointer transition ${
                      postScope === "specific"
                        ? "border-indigo-500/80 bg-indigo-500/10 shadow-xs"
                        : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="post_scope_mc"
                        checked={postScope === "specific"}
                        onChange={() => setPostScope("specific")}
                        className="mt-1 h-4 w-4 text-indigo-500 border-slate-700 bg-slate-900 focus:ring-0 cursor-pointer"
                      />
                      <div className="flex-1 space-y-3">
                        <div>
                          <span className="text-sm font-bold text-slate-100 block">a specific post or reel</span>
                          <span className="text-xs text-slate-400">Triggers only when someone comments on your selected post/reel</span>
                        </div>

                        {postScope === "specific" && (
                          <div className="space-y-3 pt-1">
                            {/* Visual Post Thumbnail Selection */}
                            <div className="flex items-center gap-3">
                              <div className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-indigo-500 w-16 h-20 bg-slate-800 shadow-md flex items-center justify-center">
                                <img
                                  src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&auto=format&fit=crop&q=80"
                                  alt="Post thumb 1"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                                  <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
                                </div>
                              </div>

                              <div className="relative group cursor-pointer rounded-lg overflow-hidden border border-slate-800 w-16 h-20 bg-slate-800 opacity-60 hover:opacity-100 transition flex items-center justify-center">
                                <img
                                  src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&auto=format&fit=crop&q=80"
                                  alt="Post thumb 2"
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              <div className="relative group cursor-pointer rounded-lg overflow-hidden border border-slate-800 w-16 h-20 bg-slate-800 opacity-60 hover:opacity-100 transition flex items-center justify-center">
                                <img
                                  src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=200&auto=format&fit=crop&q=80"
                                  alt="Post thumb 3"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>

                            {/* Direct Instagram Post URL or ID input */}
                            <div className="space-y-1.5 pt-1">
                              <label className="text-[11px] font-semibold text-slate-300">
                                Or paste Instagram Post/Reel URL or Media ID:
                              </label>
                              <input
                                type="text"
                                value={postId}
                                onChange={(e) => setPostId(e.target.value)}
                                placeholder="e.g. https://www.instagram.com/reel/C_xxxxxx/ or 17841400000000"
                                className="w-full rounded-lg border border-slate-700/60 bg-[#080d18] px-3.5 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Option 2: any post or reel */}
                  <div
                    onClick={() => setPostScope("all")}
                    className={`rounded-xl border p-4 cursor-pointer transition flex items-center justify-between ${
                      postScope === "all"
                        ? "border-indigo-500/80 bg-indigo-500/10 shadow-xs"
                        : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="post_scope_mc"
                        checked={postScope === "all"}
                        onChange={() => setPostScope("all")}
                        className="h-4 w-4 text-indigo-500 border-slate-700 bg-slate-900 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                          any post or reel
                          <span className="text-slate-500 text-xs">ⓘ</span>
                        </span>
                        <span className="text-xs text-slate-400">Triggers on comments across all posts and reels</span>
                      </div>
                    </div>
                    <span className="rounded bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider">
                      PRO
                    </span>
                  </div>

                  {/* Option 3: next post or reel (Feature hint) */}
                  <div className="rounded-xl border border-slate-800/60 bg-slate-900/20 p-4 flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        disabled
                        className="h-4 w-4 text-slate-600 border-slate-800 bg-slate-900 cursor-not-allowed"
                      />
                      <div>
                        <span className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                          next post or reel
                          <span className="text-slate-500 text-xs">ⓘ</span>
                        </span>
                        <span className="text-xs text-slate-500">Automatically attaches to your next upcoming publish</span>
                      </div>
                    </div>
                    <span className="rounded bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 text-[10px] font-extrabold text-violet-300 uppercase tracking-wider">
                      UPGRADE
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* When in DIRECT MESSAGE mode */
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
                  When someone sends a Direct Message (DM)
                </h3>

                <div className="space-y-2.5">
                  <div className="rounded-xl border border-indigo-500/80 bg-indigo-500/10 p-4 shadow-xs">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked
                        readOnly
                        className="h-4 w-4 text-indigo-500 border-slate-700 bg-slate-900"
                      />
                      <div>
                        <span className="text-sm font-bold text-slate-100 block">
                          Direct Message to {selectedChannelObj.name} Inbox
                        </span>
                        <span className="text-xs text-slate-400">
                          Automatically handles incoming customer DMs 24/7
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: CONDITION FILTER (Comments vs DM Text) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                {previewTab === "post" ? "And this comment has" : "And this message contains"}
              </h3>

              <div className="space-y-2.5">
                {/* Specific word or words */}
                <div
                  onClick={() => setCommentConditionType("keywords")}
                  className={`rounded-xl border p-4 cursor-pointer transition ${
                    commentConditionType === "keywords"
                      ? "border-blue-500/80 bg-blue-600/10 shadow-sm"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="comment_cond_mc"
                      checked={commentConditionType === "keywords"}
                      onChange={() => setCommentConditionType("keywords")}
                      className="mt-1 h-4 w-4 text-blue-600 border-white/20 bg-black/40 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1 space-y-3">
                      <div>
                        <span className="text-sm font-bold text-white block">a specific word or words</span>
                        <span className="text-xs text-slate-400">
                          {previewTab === "post"
                            ? "Triggers only when the comment contains target keywords"
                            : "Triggers when customer types any of these keywords in DM"}
                        </span>
                      </div>

                      {commentConditionType === "keywords" && (
                        <div className="space-y-3 pt-1">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newKeywordInput}
                              onChange={(e) => setNewKeywordInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddKeyword();
                                }
                              }}
                              placeholder="Type keyword (e.g. price, link, guide) and press Enter..."
                              className="flex-1 rounded-lg border border-white/10 bg-[#030712] px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAddKeyword}
                              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 transition"
                            >
                              Add
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {keywords.map((kw) => (
                              <span
                                key={kw}
                                className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/40 bg-blue-600/20 px-2.5 py-1 text-xs font-bold text-blue-200"
                              >
                                {kw}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveKeyword(kw)}
                                  className="text-slate-400 hover:text-white font-bold ml-1"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[11px] text-slate-400 font-semibold">Match mode:</span>
                            <select
                              value={matchMode}
                              onChange={(e) => setMatchMode(e.target.value as "contains_any" | "contains_all" | "exact")}
                              className="rounded-md border border-white/10 bg-[#030712] px-2 py-1 text-xs text-white focus:outline-none"
                            >
                              <option value="contains_any">Contains Any Keyword</option>
                              <option value="contains_all">Contains All Keywords</option>
                              <option value="exact">Exact Match</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Any word */}
                <div
                  onClick={() => setCommentConditionType("any")}
                  className={`rounded-xl border p-4 cursor-pointer transition ${
                    commentConditionType === "any"
                      ? "border-blue-500/80 bg-blue-600/10 shadow-sm"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="comment_cond_mc"
                      checked={commentConditionType === "any"}
                      onChange={() => setCommentConditionType("any")}
                      className="h-4 w-4 text-blue-600 border-white/20 bg-black/40 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-bold text-white block">any word</span>
                      <span className="text-xs text-slate-400">
                        {previewTab === "post"
                          ? "Triggers on every comment (wildcard response)"
                          : "Triggers on any incoming direct message"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reply to their comments under the post (Only relevant when Post Comment mode is active) */}
                {previewTab === "post" && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-white block">
                          reply to their comments under the post
                        </span>
                        <span className="text-xs text-slate-400">
                          Post an automated public reply directly under the visitor's comment
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPublicReplyEnabled(!publicReplyEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          publicReplyEnabled ? "bg-blue-600" : "bg-slate-700"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            publicReplyEnabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {publicReplyEnabled && (
                      <div className="pt-1">
                        <input
                          type="text"
                          value={publicReplyText}
                          onChange={(e) => setPublicReplyText(e.target.value)}
                          placeholder="e.g. Sent you a DM! Check your inbox 📩"
                          className="w-full rounded-lg border border-white/10 bg-[#030712] px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: They will get (Opening DM Flow) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                They will get
              </h3>

              {/* Opening DM Card */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <input
                  type="text"
                  value={openingDmText}
                  onChange={(e) => setOpeningDmText(e.target.value)}
                  placeholder="Send me the link"
                  className="w-full rounded-lg border border-white/10 bg-[#030712] px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
                <div className="flex items-center gap-1.5 text-[11px] text-blue-400 font-medium cursor-pointer hover:underline">
                  <span>ⓘ</span>
                  <span>Why does an Opening DM matter?</span>
                </div>
              </div>

              {/* a DM asking to follow you before they get the link (UPGRADE toggle) */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    a DM asking to follow you
                  </span>
                  <span className="text-xs text-slate-400">
                    before they get the link
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-600/20 border border-blue-500/40 px-2 py-0.5 text-[9px] font-extrabold text-blue-400 uppercase tracking-wider">
                    UPGRADE
                  </span>
                  <button
                    type="button"
                    onClick={() => setAskFollowBeforeLink(!askFollowBeforeLink)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                      askFollowBeforeLink ? "bg-blue-600" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
                        askFollowBeforeLink ? "translate-x-4.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* a DM asking for their email (UPGRADE toggle) */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    a DM asking for their email
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-600/20 border border-blue-500/40 px-2 py-0.5 text-[9px] font-extrabold text-blue-400 uppercase tracking-wider">
                    UPGRADE
                  </span>
                  <button
                    type="button"
                    onClick={() => setAskEmailBeforeLink(!askEmailBeforeLink)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                      askEmailBeforeLink ? "bg-blue-600" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
                        askEmailBeforeLink ? "translate-x-4.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 4: And then, they will get */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                And then, they will get
              </h3>

              {/* a DM with a link Card */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <span className="text-xs font-bold text-white block">
                  a DM with a link
                </span>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Write a message"
                    maxLength={1000}
                    className="w-full rounded-lg border border-white/10 bg-[#030712] p-3 text-xs text-white leading-relaxed focus:border-blue-500 focus:outline-none"
                  />
                  <span className="absolute bottom-2 right-2.5 text-[10px] text-slate-500">
                    {1000 - responseMessage.length}
                  </span>
                </div>

                {/* Add a link action button / configured link preview */}
                {linkUrl ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-blue-500/30 bg-blue-600/10 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-blue-400">🔗 Button:</span>
                      <span className="text-white font-medium truncate">&ldquo;{linkButtonText}&rdquo; → {linkUrl}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkUrl("");
                        setLinkButtonText("Check it out");
                      }}
                      className="text-slate-400 hover:text-white font-bold ml-2 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddLinkModal(true)}
                    className="w-full rounded-lg border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.05] py-2.5 text-xs font-bold text-slate-300 transition flex items-center justify-center gap-1.5"
                  >
                    <span className="text-base leading-none">+</span>
                    <span>Add A Link</span>
                  </button>
                )}

                {/* Inline link configuration modal/popover if open */}
                {showAddLinkModal && (
                  <div className="p-3 rounded-lg border border-white/10 bg-[#0b1329] space-y-2.5">
                    <span className="text-xs font-bold text-white block">Configure Button Link</span>
                    <input
                      type="text"
                      value={linkButtonText}
                      onChange={(e) => setLinkButtonText(e.target.value)}
                      placeholder="Button title (e.g. Visit Website)"
                      className="w-full rounded-md border border-white/10 bg-[#030712] px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com/your-link"
                      className="w-full rounded-md border border-white/10 bg-[#030712] px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddLinkModal(false)}
                        className="rounded px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddLinkModal(false)}
                        className="rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-500"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* a follow up DM if they don't click the link (UPGRADE toggle) */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    a follow up DM if they don't
                  </span>
                  <span className="text-xs text-slate-400">
                    click the link
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-600/20 border border-blue-500/40 px-2 py-0.5 text-[9px] font-extrabold text-blue-400 uppercase tracking-wider">
                    UPGRADE
                  </span>
                  <button
                    type="button"
                    onClick={() => setFollowUpDmEnabled(!followUpDmEnabled)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                      followUpDmEnabled ? "bg-blue-600" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
                        followUpDmEnabled ? "translate-x-4.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Workflow Activation Status */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Automation Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: "active", label: "Active (24/7)" },
                  { val: "draft", label: "Draft" },
                  { val: "paused", label: "Paused" },
                ].map((st) => (
                  <button
                    key={st.val}
                    type="button"
                    onClick={() => setStatus(st.val)}
                    className={`rounded-lg py-2 text-xs font-bold transition border ${
                      status === st.val
                        ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                        : "bg-white/[0.04] text-slate-400 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: INDEPENDENT SCROLLABLE PREVIEW (Span 5) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-start space-y-2 h-full overflow-y-auto pr-2 custom-scrollbar pb-2">
            
            {/* Header with Preview Mode Switcher (Post Comment vs Direct Message) & Go Live Button */}
            <div className="w-full flex items-center justify-between px-1 shrink-0 pb-1">
              {/* Top View Mode Switcher */}
              <div className="flex items-center rounded-lg bg-white/[0.08] p-1 border border-white/10 shadow-sm">
                <button
                  type="button"
                  onClick={() => setPreviewTab("post")}
                  className={`rounded-md px-2.5 py-1 text-xs font-bold transition flex items-center gap-1.5 ${
                    previewTab === "post"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>Post Comment</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("dm")}
                  className={`rounded-md px-2.5 py-1 text-xs font-bold transition flex items-center gap-1.5 ${
                    previewTab === "dm"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <HiOutlinePaperAirplane className="h-3.5 w-3.5 rotate-45" />
                  <span>Direct Message</span>
                </button>
              </div>

              {/* Go Live Button */}
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Go Live"}
              </button>
            </div>

            {/* REALISTIC IPHONE DEVICE FRAME (Optimized to fit screen completely) */}
            <div className="relative w-[300px] h-[520px] shrink-0 rounded-[42px] bg-[#121212] border-[5px] border-[#2a2a2a] shadow-2xl overflow-hidden flex flex-col">
              
              {/* iPhone Dynamic Island / Notch & Top Status Bar */}
              <div className="pt-2 px-5 pb-1 flex items-center justify-between text-white text-[10px] font-semibold tracking-tight z-20">
                <span>6:57</span>
                <div className="h-3.5 w-16 rounded-full bg-black mx-auto"></div>
                <div className="flex items-center gap-1 text-[9px]">
                  <span>5G</span>
                  <div className="h-2 w-3.5 rounded-xs border border-white/80 p-0.5 flex items-center">
                    <div className="h-full w-full bg-white rounded-2xs"></div>
                  </div>
                </div>
              </div>

              {/* VIEW 1: INSTAGRAM POST & COMMENTS PREVIEW */}
              {previewTab === "post" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Instagram App Header */}
                  <div className="px-4 py-2 flex items-center justify-between text-white border-b border-white/5 z-10 bg-[#121212]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">‹</span>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none">
                          {channelType === "instagram" ? "HAMSAKA1980" : "PASNEX.AI"}
                        </span>
                        <span className="text-xs font-black text-white leading-none">Posts</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">•••</span>
                  </div>

                  {/* Post Content Area */}
                  <div className="relative flex-1 bg-black flex flex-col overflow-hidden">
                    {/* Author row */}
                    <div className="px-3 py-2 flex items-center justify-between bg-black/60">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 p-0.5">
                          <div className="h-full w-full rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-white">
                            H
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-white">hamsaka1980</span>
                      </div>
                      <span className="text-slate-400 text-xs">•••</span>
                    </div>

                    {/* Post Main Visual / Image */}
                    <div className="h-44 w-full bg-slate-900 overflow-hidden relative">
                      <img
                        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80"
                        alt="Instagram Post"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Instagram Slide-Up Comments Drawer */}
                    <div className="flex-1 bg-[#1a1a1a] rounded-t-2xl mt-[-12px] p-3 flex flex-col justify-between shadow-2xl border-t border-white/10 z-20">
                      <div>
                        <div className="w-8 h-1 rounded-full bg-slate-600 mx-auto mb-2"></div>
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <span className="text-xs font-bold text-white">Comments</span>
                          <HiOutlinePaperAirplane className="h-3.5 w-3.5 text-slate-400 rotate-45" />
                        </div>

                        {/* Single Simulated Comment & Author Reply */}
                        <div className="pt-3 space-y-3">
                          {/* Commenter Row */}
                          <div className="flex items-start gap-2.5">
                            <div className="h-6 w-6 rounded-full bg-slate-600 flex items-center justify-center text-[10px] text-white shrink-0 font-bold">
                              U
                            </div>
                            <div className="flex-1 text-[11px]">
                              <div className="flex items-baseline gap-1.5">
                                <span className="font-bold text-white">Username</span>
                                <span className="text-[9px] text-slate-500">Now</span>
                              </div>
                              <p className="text-slate-300 mt-0.5">
                                {commentConditionType === "any"
                                  ? "Leaves any comment"
                                  : `Interested in ${keywords[0] || "price"}!`}
                              </p>
                              <span className="text-[10px] text-slate-500 font-semibold block mt-1">Reply</span>
                            </div>
                            <span className="text-slate-500 text-xs">♡</span>
                          </div>

                          {/* Public Reply Under Comment if Enabled */}
                          {publicReplyEnabled && (
                            <div className="ml-7 pl-2.5 border-l border-white/20 text-[10px] space-y-0.5">
                              <div className="flex items-center gap-1 font-bold text-pink-400">
                                <span>hamsaka1980</span>
                                <span className="rounded bg-pink-500/20 px-1 text-[7px] uppercase">Author</span>
                              </div>
                              <p className="text-slate-300 text-[10px] leading-tight">
                                {publicReplyText || "Sent you a DM! Check your inbox 📩"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Quick Reactions Emoji Bar */}
                      <div className="pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between px-1 text-sm">
                          <span className="cursor-pointer hover:scale-125 transition">❤️</span>
                          <span className="cursor-pointer hover:scale-125 transition">🔥</span>
                          <span className="cursor-pointer hover:scale-125 transition">👏</span>
                          <span className="cursor-pointer hover:scale-125 transition">😢</span>
                          <span className="cursor-pointer hover:scale-125 transition">😍</span>
                          <span className="cursor-pointer hover:scale-125 transition">😂</span>
                          <span className="cursor-pointer hover:scale-125 transition">😮</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: AUTHENTIC INSTAGRAM DIRECT MESSAGE (DM) VIEW */}
              {previewTab === "dm" && (
                <div className="flex-1 flex flex-col justify-between bg-black text-white">
                  {/* Instagram DM Header */}
                  <div className="px-3 py-2.5 flex items-center justify-between border-b border-white/10 bg-[#121212]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 cursor-pointer">‹</span>
                      <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 p-0.5">
                        <div className="h-full w-full rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                          H
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block leading-tight">
                          {channelType === "instagram" ? "hamsaka1980" : "pasnex.ai"}
                        </span>
                        <span className="text-[9px] text-emerald-400 font-semibold block leading-tight">
                          Active now
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <span>📞</span>
                      <span>📹</span>
                    </div>
                  </div>

                  {/* DM Messages Thread */}
                  <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                    {/* Timestamp */}
                    <div className="text-center">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Today 6:57 PM</span>
                    </div>

                    {/* Conversation Flow */}
                    {/* 1. Opening DM from commenter or bot */}
                    <div className="flex flex-col items-start space-y-1">
                      <span className="text-[9px] text-slate-500 font-medium px-1">Customer sent via post</span>
                      <div className="rounded-2xl rounded-tl-xs bg-[#262626] p-2.5 text-xs text-slate-200 max-w-[85%] border border-white/5">
                        <p className="text-[11px]">
                          {openingDmText || (commentConditionType === "any" ? "Send me the link" : `Interested in ${keywords[0] || "price"}!`)}
                        </p>
                      </div>
                    </div>

                    {/* 2. Automated Bot / Business DM Bubble with Link Button */}
                    <div className="flex flex-col items-end space-y-1">
                      <div className="flex items-center gap-1 text-[9px] text-pink-400 font-bold px-1">
                        <span>Auto-DM</span>
                        <HiOutlineSparkles className="h-2.5 w-2.5 text-pink-400" />
                      </div>
                      <div className="rounded-2xl rounded-tr-xs bg-gradient-to-tr from-violet-600 via-pink-600 to-rose-600 p-3 text-xs leading-relaxed max-w-[88%] text-white shadow-md space-y-2">
                        <p className="whitespace-pre-wrap">{responseMessage}</p>
                        {linkUrl && (
                          <div className="pt-1">
                            <div className="w-full py-1.5 px-3 rounded-lg bg-white/20 hover:bg-white/30 text-center font-bold text-xs text-white border border-white/30 shadow-xs flex items-center justify-center gap-1">
                              <span>🔗</span>
                              <span>{linkButtonText || "Check it out"}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-[8px] text-slate-500 pr-1">Delivered</span>
                    </div>
                  </div>

                  {/* DM Composer Bar */}
                  <div className="p-2.5 border-t border-white/10 bg-[#121212] flex items-center gap-2">
                    <span className="text-blue-500 text-sm cursor-not-allowed">📷</span>
                    <input
                      type="text"
                      disabled
                      placeholder="Message..."
                      className="flex-1 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-slate-400 cursor-not-allowed"
                    />
                    <span className="text-slate-400 text-sm cursor-not-allowed">🎤</span>
                    <span className="text-slate-400 text-sm cursor-not-allowed">🖼️</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* Modal Bottom Actions (Fixed at bottom - Compact) */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-5 py-2.5 bg-[#07101d] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 px-6 py-1.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Automation"}
          </button>
        </div>
      </div>
    </div>
  );
}

