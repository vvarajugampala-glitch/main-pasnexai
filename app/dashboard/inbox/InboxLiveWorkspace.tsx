"use client";

import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineBolt,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { SiFacebook, SiInstagram, SiMessenger, SiTelegram, SiWhatsapp } from "react-icons/si";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Message = {
  id: string;
  sender_type: string;
  message_text: string;
  ai_generated: boolean;
  created_at: string;
};

type Conversation = {
  id: string;
  status: string;
  last_message_at: string | null;
  created_at: string;
  channels: { type: string; display_name: string; status: string | null; webhook_status: string | null; has_token: boolean } | null;
  leads: { id: string; name: string; status: string; score: number; interest: string | null; next_action: string | null } | null;
  messages: Message[];
};

const channelIcon = {
  instagram: SiInstagram,
  whatsapp: SiWhatsapp,
  facebook: SiFacebook,
  messenger: SiMessenger,
  telegram: SiTelegram,
};

const channelStyles = {
  instagram: "bg-gradient-to-br from-yellow-300 via-pink-500 to-violet-600 text-white",
  whatsapp: "bg-[#25D366] text-white",
  facebook: "bg-[#1877F2] text-white",
  messenger: "bg-[#00B2FF] text-white",
  telegram: "bg-[#26A5E4] text-white",
};

const suggestedReply =
  "We can prepare this conversation for automated qualification and route the lead after channel API approval is completed.";

function formatChannel(conversation?: Conversation) {
  return conversation?.channels?.display_name || conversation?.channels?.type || "Workspace";
}

function formatTime(value?: string | null) {
  if (!value) return "New";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function formatStatus(status?: string) {
  if (!status) return "New";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatApiStatus(conversation?: Conversation) {
  const channel = conversation?.channels;

  if (!channel) return "No channel mapped";
  if (!channel.has_token) return "Token pending";
  if (channel.status === "connected" && channel.webhook_status === "live") return "Live";
  return "Token connected, approval pending";
}

export function InboxLiveWorkspace() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const [conversationFilter, setConversationFilter] = useState("All");

  const fetchConversations = async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return [];

    const response = await fetch("/api/dashboard/inbox", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as { conversations?: Conversation[] };
    return data.conversations ?? [];
  };

  useEffect(() => {
    let mounted = true;
    fetchConversations().then((nextConversations) => {
      if (!mounted) return;
      setConversations(nextConversations);
      setSelectedId((current) => current || nextConversations[0]?.id || "");
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0],
    [conversations, selectedId],
  );
  const visibleConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      if (conversationFilter === "Open") return conversation.status === "open";
      if (conversationFilter === "Qualified") return conversation.leads?.status === "qualified";
      if (conversationFilter === "Needs reply") {
        const lastMessage = [...(conversation.messages ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        return lastMessage?.sender_type === "customer";
      }
      return true;
    });
  }, [conversations, conversationFilter]);

  const createTestConversation = async () => {
    setIsCreating(true);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please login again to create a conversation.");
      }

      const response = await fetch("/api/dashboard/inbox", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not create conversation.");
      }

      const nextConversations = await fetchConversations();
      setConversations(nextConversations);
      setSelectedId(nextConversations[0]?.id ?? "");
      setMessage("Test conversation created successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create conversation.");
    } finally {
      setIsCreating(false);
    }
  };

  const refreshConversations = async (preferredId?: string) => {
    const nextConversations = await fetchConversations();
    setConversations(nextConversations);
    setSelectedId(preferredId ?? selectedId ?? nextConversations[0]?.id ?? "");
  };

  const runInboxAction = async (action: string, successMessage: string, messageText?: string) => {
    if (!selectedConversation) return;

    setIsSaving(true);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please login again to update this conversation.");
      }

      const response = await fetch("/api/dashboard/inbox", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          conversationId: selectedConversation.id,
          messageText,
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        providerStatus?: { note?: string };
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not update conversation.");
      }

      setReplyText("");
      await refreshConversations(selectedConversation.id);
      setMessage(result.providerStatus?.note ?? successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update conversation.");
    } finally {
      setIsSaving(false);
    }
  };

  const sendReply = async () => {
    await runInboxAction("send_message", "Reply saved to conversation.", replyText);
  };

  const selectedChannelType = selectedConversation?.channels?.type ?? "";
  const ChannelIcon = channelIcon[selectedChannelType as keyof typeof channelIcon] ?? HiOutlineChatBubbleLeftRight;
  const channelClass = channelStyles[selectedChannelType as keyof typeof channelStyles] ?? "bg-blue-500/15 text-blue-300";

  return (
    <section className="mt-6 grid gap-4 xl:grid-cols-[0.85fr_1.35fr_0.8fr]">
      <aside className="rounded-lg border border-white/10 bg-[#07101d]/90 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">Conversations</h2>
          <span className="rounded-full bg-violet-500 px-2 py-0.5 text-xs font-bold">{conversations.length}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["All", "Open", "Qualified", "Needs reply"].map((filter) => (
            <button key={filter} onClick={() => setConversationFilter(filter)} className={`rounded-full px-3 py-1 text-xs font-bold transition ${conversationFilter === filter ? "bg-blue-500 text-white" : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"}`}>
              {filter}
            </button>
          ))}
        </div>
        <button onClick={createTestConversation} disabled={isCreating} className="mt-4 w-full rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
          {isCreating ? "Creating..." : "Create Test Conversation"}
        </button>
        {message && <div className="mt-3 rounded-lg border border-blue-400/20 bg-blue-400/10 p-3 text-xs font-semibold text-blue-100">{message}</div>}
        <div className="mt-4 grid gap-3">
          {isLoading && <p className="text-sm text-slate-500">Loading conversations...</p>}
          {!isLoading && conversations.length === 0 && <p className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-400">No conversations yet. Create a test conversation to preview the inbox.</p>}
          {!isLoading && conversations.length > 0 && visibleConversations.length === 0 && (
            <p className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-400">No conversations match this filter.</p>
          )}
          {visibleConversations.map((conversation) => {
            const channelType = conversation.channels?.type ?? "";
            const Icon = channelIcon[channelType as keyof typeof channelIcon] ?? HiOutlineChatBubbleLeftRight;
            const style = channelStyles[channelType as keyof typeof channelStyles] ?? "bg-blue-500/15 text-blue-300";
            const lastMessage = [...(conversation.messages ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            const active = selectedConversation?.id === conversation.id;

            return (
              <button key={conversation.id} onClick={() => setSelectedId(conversation.id)} className={`rounded-lg border p-4 text-left transition ${active ? "border-blue-400/50 bg-blue-400/10" : "border-white/10 bg-white/[0.035] hover:border-blue-300/40"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${style}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-bold">{conversation.leads?.name ?? "Unknown Lead"}</span>
                  </div>
                  <span className="text-xs text-slate-500">{formatTime(conversation.last_message_at ?? conversation.created_at)}</span>
                </div>
                <p className="mt-3 line-clamp-1 text-xs text-slate-500">{lastMessage?.message_text ?? "No messages yet"}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{formatChannel(conversation)}</span>
                  <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs font-bold text-slate-300">{formatStatus(conversation.leads?.status)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="rounded-lg border border-white/10 bg-[#07101d]/90 p-4">
        {selectedConversation ? (
          <>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${channelClass}`}>
                  <ChannelIcon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-black">{selectedConversation.leads?.name ?? "Customer"}</h2>
                  <p className="mt-1 text-xs text-slate-500">{formatChannel(selectedConversation)} - {formatStatus(selectedConversation.leads?.status)} lead</p>
                </div>
              </div>
              <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-200">AI prepared</span>
            </div>

            <div className="mt-5 grid max-h-[460px] gap-4 overflow-y-auto pr-2">
              {(selectedConversation.messages ?? []).map((chat) => (
                <div key={chat.id} className={`${chat.sender_type === "customer" ? "mr-auto rounded-bl-md bg-white/[0.06] text-slate-200" : "ml-auto rounded-br-md bg-gradient-to-r from-violet-600 to-blue-600"} max-w-[78%] rounded-2xl p-4 text-sm leading-6`}>
                  {chat.message_text}
                </div>
              ))}
            </div>

            <div id="ai-suggested-reply" className="mt-5 scroll-mt-6 rounded-lg border border-blue-400/15 bg-blue-400/10 p-4">
              <div className="flex items-start gap-3">
                <HiOutlineSparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-blue-100">AI suggested reply</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {suggestedReply}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => setReplyText(suggestedReply)} className="rounded-lg border border-blue-300/20 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-blue-100 transition hover:bg-white/[0.08]">
                      Use reply
                    </button>
                    <button onClick={() => setReplyText((current) => current || suggestedReply)} className="rounded-lg border border-blue-300/20 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-blue-100 transition hover:bg-white/[0.08]">
                      Edit
                    </button>
                    <button onClick={() => runInboxAction("create_task", "Lead task created successfully.")} disabled={isSaving} className="rounded-lg border border-blue-300/20 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-blue-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60">
                      Create lead task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-[460px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.025] text-sm text-slate-500">
            Select or create a conversation.
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <input value={replyText} onChange={(event) => setReplyText(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400" placeholder="Type a reply..." />
          <button onClick={sendReply} disabled={isSaving || !replyText.trim() || !selectedConversation} className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 disabled:cursor-not-allowed disabled:opacity-60">
            <HiOutlinePaperAirplane className="h-5 w-5" />
          </button>
        </div>
      </section>

      <aside className="grid gap-4">
        <section className="rounded-lg border border-white/10 bg-[#07101d]/90 p-4">
          <h2 className="text-lg font-black">Lead Details</h2>
          <div className="mt-4 grid gap-3 text-sm">
            {[
              ["Source", formatChannel(selectedConversation)],
              ["Status", formatStatus(selectedConversation?.leads?.status)],
              ["Lead score", `${selectedConversation?.leads?.score ?? 0}/100`],
              ["Interest", selectedConversation?.leads?.interest ?? "Not set"],
              ["Next action", selectedConversation?.leads?.next_action ?? "Review"],
              ["API status", formatApiStatus(selectedConversation)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between rounded-lg bg-white/[0.035] p-3">
                <span className="text-slate-500">{label}</span>
                <span className="font-bold text-slate-200">{value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-[#07101d]/90 p-4">
          <h2 className="text-lg font-black">Quick Actions</h2>
          <div className="mt-4 grid gap-3">
            {[
              { label: "Mark Qualified", Icon: HiOutlineUserGroup },
              { label: "Create Automation", Icon: HiOutlineBolt },
              { label: "Open AI Reply", Icon: HiOutlineChatBubbleLeftRight },
            ].map(({ label, Icon }) => (
              <button
                key={label}
                onClick={() => {
                  if (label === "Mark Qualified") {
                    void runInboxAction("mark_qualified", "Lead marked as qualified.");
                    return;
                  }
                  if (label === "Create Automation") {
                    window.location.href = "/dashboard/automations";
                    return;
                  }
                  setReplyText(suggestedReply);
                }}
                disabled={isSaving}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-left text-sm font-bold transition hover:border-blue-300/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon className="h-5 w-5 text-blue-300" />
                {label}
              </button>
            ))}
          </div>
        </section>
      </aside>
    </section>
  );
}
