import Link from "next/link";
import { AutomationsHeaderActions } from "./AutomationsHeaderActions";
import { AutomationsLiveTable } from "./AutomationsLiveTable";
import { AutomationsSidebarBuilder } from "./AutomationsSidebarBuilder";
import { AutomationsTemplateGrid } from "./AutomationsTemplateGrid";
import { TrialAutomationLauncher } from "./TrialAutomationLauncher";
import { HiOutlineArrowLeft } from "react-icons/hi2";

export default function AutomationsPage() {
  return (
    <main className="min-h-screen bg-[#080d1a] px-4 py-8 text-white relative overflow-hidden">
      {/* Subtle modern ambient background glow for senior SaaS look */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[140px]" />

      <div className="relative mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 transition hover:text-white"
            >
              <HiOutlineArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <div className="mt-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">Automations Studio</p>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl text-white">
              Workflows that reply, qualify, and convert
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 font-normal">
              Design automated conversational funnels across Instagram, WhatsApp, Facebook, and Telegram with zero code.
            </p>
          </div>
          <AutomationsHeaderActions />
        </header>

        <TrialAutomationLauncher />

        <div id="automation-templates" className="scroll-mt-6">
          <AutomationsTemplateGrid />
        </div>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <AutomationsLiveTable />
          <AutomationsSidebarBuilder />
        </section>
      </div>
    </main>
  );
}
