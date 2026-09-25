import Link from "next/link";
import { AutomationsHeaderActions } from "./AutomationsHeaderActions";
import { AutomationsLiveTable } from "./AutomationsLiveTable";
import { AutomationsSidebarBuilder } from "./AutomationsSidebarBuilder";
import { AutomationsTemplateGrid } from "./AutomationsTemplateGrid";
import { TrialAutomationLauncher } from "./TrialAutomationLauncher";
import { HiOutlineArrowLeft } from "react-icons/hi2";

export default function AutomationsPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 transition hover:text-white"
            >
              <HiOutlineArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Automations</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Build workflows that reply, qualify, and convert</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              Create automation flows for comments, messages, lead capture, support replies, and campaign follow-ups.
            </p>
          </div>
          <AutomationsHeaderActions />
        </header>

        <TrialAutomationLauncher />

        <div id="automation-templates" className="scroll-mt-6">
          <AutomationsTemplateGrid />
        </div>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <AutomationsLiveTable />
          <AutomationsSidebarBuilder />
        </section>
      </div>
    </main>
  );
}
