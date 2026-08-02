"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HiCheckBadge,
  HiOutlineBolt,
  HiOutlineChartBar,
  HiOutlineGlobeAlt,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { SiFacebook, SiInstagram, SiMessenger, SiTelegram, SiWhatsapp } from "react-icons/si";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const baseCard =
  "relative min-h-[560px] rounded-lg border p-6 shadow-[0_20px_70px_rgba(0,0,0,.22)] transition duration-300 sm:p-8";

const channelOptions = [
  {
    type: "instagram",
    label: "Instagram",
    Icon: SiInstagram,
    color: "text-pink-300",
    panel: "border-pink-400/20 bg-pink-400/10 shadow-[0_0_42px_rgba(236,72,153,.25)]",
    help: "Prepare your Instagram Business setup for comments, DMs, story replies, and lead capture. Real API approval happens later.",
  },
  {
    type: "whatsapp",
    label: "WhatsApp",
    Icon: SiWhatsapp,
    color: "text-emerald-300",
    panel: "border-emerald-400/20 bg-emerald-400/10 shadow-[0_0_42px_rgba(52,211,153,.22)]",
    help: "Prepare WhatsApp automation setup for replies and lead qualification. Real WhatsApp Business API approval happens later.",
  },
  {
    type: "messenger",
    label: "Messenger",
    Icon: SiMessenger,
    color: "text-blue-300",
    panel: "border-blue-400/20 bg-blue-400/10 shadow-[0_0_42px_rgba(96,165,250,.22)]",
    help: "Prepare Messenger setup to manage Facebook page chats and follow-up workflows.",
  },
  {
    type: "facebook",
    label: "Facebook",
    Icon: SiFacebook,
    color: "text-sky-300",
    panel: "border-sky-400/20 bg-sky-400/10 shadow-[0_0_42px_rgba(56,189,248,.2)]",
    help: "Prepare Facebook setup to capture page engagement, comments, and campaign leads.",
  },
  {
    type: "telegram",
    label: "Telegram",
    Icon: SiTelegram,
    color: "text-cyan-300",
    panel: "border-cyan-400/20 bg-cyan-400/10 shadow-[0_0_42px_rgba(34,211,238,.2)]",
    help: "Prepare Telegram setup to automate community replies and support messages.",
  },
  {
    type: "multiple",
    label: "Multiple Channels",
    Icon: HiOutlineGlobeAlt,
    color: "text-violet-300",
    panel: "border-violet-400/20 bg-violet-400/10 shadow-[0_0_42px_rgba(124,58,237,.2)]",
    help: "Prepare Instagram, WhatsApp, Messenger, and other channels from one workspace.",
  },
];

export default function OnboardingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState(channelOptions[0]);
  const [channelConnected, setChannelConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("Welcome Message");
  const [isCreatingAutomation, setIsCreatingAutomation] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState("");
  const SelectedChannelIcon = selectedChannel.Icon;
  const steps = [
    { label: "Welcome", Icon: HiOutlineSparkles },
    { label: `Prepare ${selectedChannel.label}`, Icon: selectedChannel.Icon },
    { label: "Grant Permissions", Icon: HiOutlineShieldCheck },
    { label: "Create Automation", Icon: HiOutlineBolt },
    { label: "Dashboard", Icon: HiOutlineChartBar },
  ];

  useEffect(() => {
    async function loadPrimaryChannel() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return;
      }

      const response = await fetch("/api/onboarding/primary-channel", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { type?: string; displayName?: string };
      const savedChannel = data.type || data.displayName?.toLowerCase();
      const matchedChannel = channelOptions.find(
        (channel) => channel.type === savedChannel || channel.label.toLowerCase() === savedChannel,
      );

      if (matchedChannel) {
        setSelectedChannel(matchedChannel);
      }
    }

    void loadPrimaryChannel();
  }, []);

  const completeStep = (step: number) => setActiveStep((current) => Math.max(current, step + 1));
  const previousStep = () => {
    setFinishError("");
    setActiveStep((current) => Math.max(0, current - 1));
  };

  const connectSelectedChannel = async () => {
    setIsConnecting(true);
    setFinishError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please login again to connect your channel.");
      }

      const response = await fetch("/api/onboarding/connect-channel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: selectedChannel.type,
          displayName: selectedChannel.label,
        }),
      });

      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not connect channel.");
      }

      setChannelConnected(true);
      setIsConnecting(false);
      completeStep(1);
    } catch (error) {
      setIsConnecting(false);
      setFinishError(error instanceof Error ? error.message : "Could not connect channel.");
    }
  };

  const finishOnboarding = async () => {
    setIsFinishing(true);
    setFinishError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please login again to finish onboarding.");
      }

      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not finish onboarding.");
      }

      window.localStorage.setItem("pasnex_onboarding_complete", "true");
      window.location.href = "/dashboard";
    } catch (error) {
      setIsFinishing(false);
      setFinishError(error instanceof Error ? error.message : "Could not finish onboarding.");
    }
  };

  const createAutomation = async () => {
    setIsCreatingAutomation(true);
    setFinishError("");

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
          templateName: selectedTemplate,
          channelType: selectedChannel.type,
        }),
      });

      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not create automation.");
      }

      setIsCreatingAutomation(false);
      completeStep(3);
    } catch (error) {
      setIsCreatingAutomation(false);
      setFinishError(error instanceof Error ? error.message : "Could not create automation.");
    }
  };

  const cardClass = (index: number) => {
    if (index < activeStep) {
      return `${baseCard} hidden border-blue-400/35 bg-[#07101d]/95`;
    }
    if (index === activeStep) {
      return `${baseCard} block animate-[onboardingStep_.28s_ease-out] border-violet-400/50 bg-[#07101d] shadow-[0_0_45px_rgba(124,58,237,.2)]`;
    }
    return `${baseCard} hidden border-white/10 bg-[#07101d]/55 opacity-45 grayscale`;
  };

  const isLocked = (index: number) => index > activeStep;

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-8 text-white">
      <div className="pointer-events-none fixed left-1/2 top-0 h-[560px] w-[760px] -translate-x-1/2 rounded-full bg-blue-600/12 blur-[160px]" />
      <div className="relative mx-auto w-full max-w-7xl">
        <header className="text-center">
          <Link href="/" className="text-4xl font-black tracking-tight">
            Pasnex<span className="text-blue-500">.ai</span>
          </Link>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.34em] text-slate-500">AI automation for your business</p>
          <h1 className="mt-5 text-4xl font-black sm:text-5xl">Onboarding Flow</h1>
          <p className="mt-2 text-sm text-slate-400">Complete each step in order to activate your dashboard.</p>
        </header>

        <section className="mt-10 hidden items-center justify-center gap-3 lg:flex">
          {steps.map(({ label, Icon }, index) => {
            const done = index < activeStep;
            const active = index === activeStep;
            return (
              <div key={label} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-2">
                  <div className={`relative flex h-14 w-14 items-center justify-center rounded-full border shadow-[0_0_26px_rgba(37,99,235,.24)] ${done ? "border-blue-300 bg-blue-500/15" : active ? "border-violet-300 bg-violet-500/15" : "border-white/10 bg-[#07101d]"}`}>
                    {done ? <HiCheckBadge className="h-8 w-8 text-blue-300" /> : <Icon className={`h-7 w-7 ${active ? "text-violet-300" : "text-slate-500"}`} />}
                    <span className="absolute -right-2 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-blue-600 text-xs font-black">
                      {index + 1}
                    </span>
                  </div>
                  <span className={`text-xs font-bold ${active || done ? "text-slate-200" : "text-slate-600"}`}>{label}</span>
                </div>
                {index < steps.length - 1 && <div className={`h-px w-28 ${index < activeStep ? "bg-gradient-to-r from-violet-500 to-blue-500" : "bg-white/10"}`} />}
              </div>
            );
          })}
        </section>

        <section className="mx-auto mt-8 w-full max-w-md">
          <article className={cardClass(0)}>
            {activeStep > 0 && <span className="absolute right-4 top-4 rounded-full bg-blue-400/10 px-3 py-1 text-[10px] font-bold text-blue-200">Done</span>}
            <p className="font-black">Pasnex<span className="text-blue-500">.ai</span></p>
            <div className="mt-8 text-center">
              <div className="mx-auto text-6xl">*</div>
              <h2 className="mt-5 text-2xl font-black">Welcome to <span className="text-blue-400">Pasnex.ai</span></h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">You&apos;re just 4 steps away from automating your business.</p>
            </div>
            <div className="mt-6 grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4">
              {["AI-Powered Automations", "Grow Your Business", "Save Time 24/7"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                  <HiCheckBadge className="h-5 w-5 text-violet-300" />
                  {item}
                </div>
              ))}
            </div>
            <div className={`mt-5 rounded-lg border p-4 ${selectedChannel.panel}`}>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">Selected channel</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06]">
                  <SelectedChannelIcon className={`h-6 w-6 ${selectedChannel.color}`} />
                </div>
                <div>
                  <p className="font-black text-white">{selectedChannel.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">This was selected during registration.</p>
                </div>
              </div>
            </div>
            <button disabled={activeStep !== 0} onClick={() => completeStep(0)} className="mt-6 w-full cursor-pointer rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45">Let&apos;s Get Started</button>
          </article>

          <article className={cardClass(1)}>
            {channelConnected && <span className="absolute right-4 top-4 rounded-full bg-blue-400/10 px-3 py-1 text-[10px] font-bold text-blue-200">Prepared</span>}
            <p className="font-black text-center">Pasnex<span className="text-blue-500">.ai</span></p>
            <div className="mt-8 text-center">
              <h2 className="text-2xl font-black">Prepare Your <span className="text-violet-400">{selectedChannel.label}</span></h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{selectedChannel.help}</p>
              <div className={`mx-auto mt-7 flex h-24 w-24 items-center justify-center rounded-full border ${selectedChannel.panel}`}>
                <SelectedChannelIcon className={`h-14 w-14 ${selectedChannel.color}`} />
              </div>
            </div>
            <div className="mt-7 grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4">
              {["Setup prepared", "API approval pending", "Automate & Grow"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                  <HiOutlineLockClosed className="h-5 w-5 text-violet-300" />
                  {item}
                </div>
              ))}
            </div>
            {finishError && activeStep === 1 && (
              <div className="mt-4 rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-sm leading-6 text-red-100">
                {finishError}
              </div>
            )}
            <div className="mt-6 grid grid-cols-[0.8fr_1.2fr] gap-3">
              <button type="button" onClick={previousStep} className="rounded-lg border border-white/10 bg-white/[0.04] py-3 text-sm font-bold text-slate-200 transition hover:border-blue-300/50 hover:bg-white/[0.08]">Previous</button>
              <button disabled={isLocked(1) || channelConnected || isConnecting} onClick={connectSelectedChannel} className="cursor-pointer rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45">
                {isConnecting ? "Preparing..." : channelConnected ? `${selectedChannel.label} Setup Prepared` : `Prepare ${selectedChannel.label}`}
              </button>
            </div>
          </article>

          <article className={cardClass(2)}>
            {activeStep > 2 && <span className="absolute right-4 top-4 rounded-full bg-blue-400/10 px-3 py-1 text-[10px] font-bold text-blue-200">Granted</span>}
            <p className="font-black text-center">Pasnex<span className="text-blue-500">.ai</span></p>
            <h2 className="mt-8 text-center text-2xl font-black">Grant Permissions</h2>
            <p className="mt-3 text-center text-sm leading-6 text-slate-400">We need access to the following permissions to work properly.</p>
            <div className="mt-7 grid gap-3">
              {[
                `Access ${selectedChannel.label} profile`,
                "Read messages",
                "Manage comments",
                "Send replies",
                "Track insights",
              ].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm font-semibold">
                  <span>{item}</span>
                  <HiCheckBadge className={`h-5 w-5 ${activeStep > 2 ? "text-blue-300" : "text-slate-600"}`} />
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-[0.8fr_1.2fr] gap-3">
              <button type="button" onClick={previousStep} className="rounded-lg border border-white/10 bg-white/[0.04] py-3 text-sm font-bold text-slate-200 transition hover:border-blue-300/50 hover:bg-white/[0.08]">Previous</button>
              <button disabled={activeStep !== 2} onClick={() => completeStep(2)} className="cursor-pointer rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45">Grant Permissions</button>
            </div>
          </article>

          <article className={cardClass(3)}>
            {activeStep > 3 && <span className="absolute right-4 top-4 rounded-full bg-blue-400/10 px-3 py-1 text-[10px] font-bold text-blue-200">Created</span>}
            <p className="font-black text-center">Pasnex<span className="text-blue-500">.ai</span></p>
            <h2 className="mt-8 text-center text-2xl font-black">Create Your First <span className="text-violet-400">Automation</span></h2>
            <p className="mt-3 text-center text-sm leading-6 text-slate-400">Choose a workflow template to get started.</p>
            <div className="mt-7 grid gap-3">
              {["Welcome Message", "Auto Reply", "Comment to DM", "AI Chatbot"].map((item, index) => (
                <button key={item} disabled={isLocked(3)} onClick={() => setSelectedTemplate(item)} className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-left transition ${selectedTemplate === item ? "border-violet-400/60 bg-violet-400/10" : "border-white/10 bg-white/[0.035]"} disabled:cursor-not-allowed`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">{index + 1}</div>
                    <span className="text-sm font-semibold">{item}</span>
                  </div>
                  <span className={`h-4 w-4 rounded-full border ${selectedTemplate === item ? "border-violet-300 bg-violet-400" : "border-white/30"}`} />
                </button>
              ))}
            </div>
            {finishError && activeStep === 3 && (
              <div className="mt-4 rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-sm leading-6 text-red-100">
                {finishError}
              </div>
            )}
            <div className="mt-6 grid grid-cols-[0.8fr_1.2fr] gap-3">
              <button type="button" onClick={previousStep} className="rounded-lg border border-white/10 bg-white/[0.04] py-3 text-sm font-bold text-slate-200 transition hover:border-blue-300/50 hover:bg-white/[0.08]">Previous</button>
              <button disabled={activeStep !== 3 || isCreatingAutomation} onClick={createAutomation} className="cursor-pointer rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45">
                {isCreatingAutomation ? "Creating..." : "Create Automation"}
              </button>
            </div>
          </article>

          <article className={cardClass(4)}>
            <div className="flex items-center justify-between">
              <p className="font-black">Pasnex<span className="text-blue-500">.ai</span></p>
              <span className="rounded-full bg-blue-400/10 px-3 py-1 text-[10px] font-bold text-blue-200">{activeStep >= 4 ? "Ready" : "Locked"}</span>
            </div>
            <h2 className="mt-8 text-2xl font-black">Welcome to Your Dashboard</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">You&apos;re all set. Let&apos;s grow your business.</p>
            <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm font-bold">Getting Started Checklist</p>
              {[`Prepare ${selectedChannel.label}`, "Review permissions", `Create ${selectedTemplate}`, "Explore dashboard"].map((item) => (
                <div key={item} className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                  <HiCheckBadge className={`h-5 w-5 ${activeStep >= 4 ? "text-blue-300" : "text-slate-600"}`} />
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <p className="text-2xl font-black">248</p>
                <p className="text-xs text-slate-500">Messages Today</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <p className="text-2xl font-black">35</p>
                <p className="text-xs text-slate-500">New Leads</p>
              </div>
            </div>
            {finishError && (
              <div className="mt-4 rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-sm leading-6 text-red-100">
                {finishError}
              </div>
            )}
            <div className="mt-6 grid grid-cols-[0.8fr_1.2fr] gap-3">
              <button type="button" onClick={previousStep} className="rounded-lg border border-white/10 bg-white/[0.04] py-3 text-sm font-bold text-slate-200 transition hover:border-blue-300/50 hover:bg-white/[0.08]">Previous</button>
              <button disabled={activeStep < 4 || isFinishing} onClick={finishOnboarding} className="cursor-pointer rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45">
                {isFinishing ? "Saving..." : "Go to Dashboard"}
              </button>
            </div>
          </article>
        </section>

        <p className="mt-8 text-center text-xs text-slate-500">
          Channel setup is prepared for preview. Real OAuth/API approval will be completed in the backend integration phase.
        </p>
      </div>
    </main>
  );
}
