"use client";

import Link from "next/link";
import { useState } from "react";
import { HiOutlineBolt, HiOutlineChatBubbleLeftRight, HiOutlineUserGroup } from "react-icons/hi2";
import { SiInstagram } from "react-icons/si";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type TrialResult = {
  automationId?: string;
  leadId?: string;
  conversationId?: string;
  message?: string;
};

export function TrialAutomationLauncher() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<TrialResult | null>(null);
  const [error, setError] = useState("");

  const runTrial = async () => {
    setIsRunning(true);
    setResult(null);
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please login again to run the trial automation.");
      }

      const response = await fetch("/api/dashboard/trial-automation", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = (await response.json()) as TrialResult & { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Could not run trial automation.");
      }

      setResult(data);
      window.dispatchEvent(new Event("pasnex:automations-updated"));
    } catch (trialError) {
      setError(trialError instanceof Error ? trialError.message : "Could not run trial automation.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="mt-6 rounded-lg border border-blue-400/20 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-[#07101d] p-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-300 via-pink-500 to-violet-600">
              <SiInstagram className="h-6 w-6 text-white" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-300">Trial Automation</p>
              <h2 className="mt-1 text-2xl font-black">Run Instagram Comment to DM flow</h2>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            This creates one prepared Instagram automation, one sample qualified lead, and one inbox conversation so you can see the product working end to end.
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            {[
              { Icon: HiOutlineBolt, text: "Keyword: price" },
              { Icon: HiOutlineChatBubbleLeftRight, text: "AI reply prepared" },
              { Icon: HiOutlineUserGroup, text: "Lead captured" },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <Icon className="h-5 w-5 text-blue-300" />
                <span className="font-semibold">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={runTrial}
          disabled={isRunning}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(37,99,235,.3)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRunning ? "Running Trial..." : "Run Trial Automation"}
        </button>
      </div>

      {result && (
        <div className="mt-5 rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4">
          <p className="font-bold text-emerald-100">{result.message ?? "Trial automation is ready."}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/dashboard/inbox" className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white transition hover:border-blue-300/50">
              View Inbox
            </Link>
            <Link href="/dashboard/contacts" className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white transition hover:border-blue-300/50">
              View Lead
            </Link>
            <Link href="/dashboard" className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white transition hover:border-blue-300/50">
              View Dashboard Counts
            </Link>
          </div>
        </div>
      )}

      {error && <p className="mt-4 rounded-lg border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
    </section>
  );
}
