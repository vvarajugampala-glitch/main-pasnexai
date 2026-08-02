"use client";

import { useEffect, useState } from "react";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { SiFacebook, SiInstagram, SiMessenger, SiWhatsapp } from "react-icons/si";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const templates = [
  { title: "Instagram Comment to DM", channel: "Instagram", channelType: "instagram", Icon: SiInstagram, style: "from-yellow-300 via-pink-500 to-violet-600" },
  { title: "WhatsApp Lead Qualification", channel: "WhatsApp", channelType: "whatsapp", Icon: SiWhatsapp, style: "from-[#25D366] via-emerald-500 to-green-600" },
  { title: "Facebook Lead Capture", channel: "Facebook", channelType: "facebook", Icon: SiFacebook, style: "from-[#1877F2] via-blue-600 to-blue-500" },
  { title: "Messenger Support Reply", channel: "Messenger", channelType: "messenger", Icon: SiMessenger, style: "from-[#00B2FF] via-blue-500 to-violet-600" },
  { title: "Welcome Message", channel: "Multi-channel", channelType: "multiple", Icon: HiOutlineChatBubbleLeftRight, style: "from-cyan-400 via-blue-500 to-violet-600" },
];

export function AutomationsTemplateGrid() {
  const [creatingTemplate, setCreatingTemplate] = useState("");
  const [message, setMessage] = useState("");
  const [connectedTypes, setConnectedTypes] = useState<string[]>([]);

  const fetchConnectedTypes = async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return [];

    const response = await fetch("/api/dashboard/channel-summary", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as {
      channels?: Array<{ type: string; status: string }>;
    };

    return (data.channels ?? [])
      .filter((channel) => channel.status === "connected" || channel.status === "ready_to_connect")
      .map((channel) => channel.type);
  };

  useEffect(() => {
    let mounted = true;

    fetchConnectedTypes().then((types) => {
      if (mounted) {
        setConnectedTypes(types);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleUseTemplate = async (template: (typeof templates)[number]) => {
    setCreatingTemplate(template.title);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please login again to create automation.");
      }

      const response = await fetch("/api/onboarding/create-automation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          templateName: template.title,
          channelType: template.channelType,
        }),
      });

      const result = (await response.json()) as { ok?: boolean; error?: string; status?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not create automation.");
      }

      setMessage(
        `${template.channel === "Multi-channel" || connectedTypes.includes(template.channelType) ? "" : `${template.channel} setup prepared and `}${template.title} ${result.status === "updated" ? "updated" : "created"} successfully.`,
      );
      setConnectedTypes(await fetchConnectedTypes());
      window.dispatchEvent(new Event("pasnex:automations-updated"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create automation.");
    } finally {
      setCreatingTemplate("");
    }
  };

  return (
    <>
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {templates.map((template) => {
          const { title, channel, Icon, style } = template;
          const isPrepared = channel === "Multi-channel" || connectedTypes.includes(template.channelType);

          return (
            <article key={title} className="group rounded-lg border border-white/10 bg-[#07101d]/90 p-5 shadow-[0_16px_45px_rgba(0,0,0,.2)] transition hover:-translate-y-1 hover:border-blue-400/50 hover:bg-white/[0.055]">
              <div className="flex items-center justify-between">
                {channel === "Multi-channel" ? (
                  <div className="flex h-12 w-16 items-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 via-pink-500 to-violet-600 ring-2 ring-[#07101d]">
                      <SiInstagram className="h-5 w-5 text-white" />
                    </span>
                    <span className="-ml-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] ring-2 ring-[#07101d]">
                      <SiWhatsapp className="h-5 w-5 text-white" />
                    </span>
                    <span className="-ml-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 ring-2 ring-[#07101d]">
                      <Icon className="h-5 w-5 text-white" />
                    </span>
                  </div>
                ) : (
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${style} shadow-[0_0_24px_rgba(37,99,235,.22)]`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                )}
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${isPrepared ? "bg-blue-400/10 text-blue-200" : "bg-amber-400/10 text-amber-200"}`}>
                  {isPrepared ? "Prepared" : "Prepare to use"}
                </span>
              </div>
              <h2 className="mt-5 text-xl font-black">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Start from this template and customize triggers, replies, lead fields, and team handoff rules.
              </p>
              <button onClick={() => handleUseTemplate(template)} disabled={creatingTemplate === title} className="mt-5 w-full rounded-lg border border-white/10 bg-white/[0.04] py-3 text-sm font-bold transition group-hover:border-blue-300/50 disabled:cursor-not-allowed disabled:opacity-60">
                {creatingTemplate === title ? "Creating..." : isPrepared ? "Use Template" : `Prepare ${channel}`}
              </button>
            </article>
          );
        })}
      </section>
      {message && (
        <div className="mt-4 rounded-lg border border-blue-400/20 bg-blue-400/10 p-3 text-sm font-semibold text-blue-100">
          {message}
        </div>
      )}
    </>
  );
}
