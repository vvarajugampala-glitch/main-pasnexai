import Link from "next/link";
import { DashboardLogoutButton } from "../DashboardLogoutButton";
import { AutomationsLiveTable } from "./AutomationsLiveTable";
import { AutomationsTemplateGrid } from "./AutomationsTemplateGrid";
import { TrialAutomationLauncher } from "./TrialAutomationLauncher";
import {
  HiOutlineArrowLeft,
  HiOutlineBolt,
  HiOutlineClock,
  HiOutlinePlus,
  HiOutlineSquares2X2,
} from "react-icons/hi2";

export default function AutomationsPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 transition hover:text-white">
              <HiOutlineArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Automations</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Build workflows that reply, qualify, and convert</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              Create automation flows for comments, messages, lead capture, support replies, and campaign follow-ups.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="#automation-templates" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-bold shadow-[0_0_28px_rgba(37,99,235,.3)]">
              <HiOutlinePlus className="h-5 w-5" />
              Create Automation
            </a>
            <DashboardLogoutButton />
          </div>
        </header>

        <TrialAutomationLauncher />

        <div id="automation-templates" className="scroll-mt-6">
          <AutomationsTemplateGrid />
        </div>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <AutomationsLiveTable />

          <aside className="grid gap-5">
            <section className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
              <h2 className="text-xl font-black">Create Flow</h2>
              <div className="mt-5 grid gap-3">
                {[
                  { label: "Choose trigger", text: "Message, keyword, comment, story reply", Icon: HiOutlineBolt },
                  { label: "Add actions", text: "Reply, tag lead, notify team, send offer", Icon: HiOutlineSquares2X2 },
                  { label: "Publish schedule", text: "Run 24/7 or during business hours", Icon: HiOutlineClock },
                ].map(({ label, text, Icon }) => (
                  <div key={label} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4">
                    <Icon className="h-6 w-6 shrink-0 text-blue-300" />
                    <div>
                      <p className="font-bold">{label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-lg border border-blue-400/20 bg-[#030712] p-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  <span>Live flow preview</span>
                  <span className="text-blue-300">Ready</span>
                </div>
                <div className="mt-4 grid gap-3">
                  {["Instagram comment", "AI qualifies intent", "Send DM + collect phone", "Notify sales team"].map((item, index) => (
                    <div key={item} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 text-xs font-black text-blue-300">{index + 1}</span>
                      <span className="flex-1 rounded-lg bg-white/[0.035] px-3 py-2 text-sm font-semibold text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-violet-400/20 bg-violet-400/10 p-5">
              <h2 className="text-lg font-black text-violet-100">Automation tip</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Start with Comment to DM, WhatsApp Qualification, and Welcome Message. These three flows usually capture the fastest leads across social campaigns.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
