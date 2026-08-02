import Link from "next/link";
import { DashboardLogoutButton } from "../DashboardLogoutButton";
import { ChannelsLiveGrid } from "./ChannelsLiveGrid";
import {
  HiOutlineArrowLeft,
  HiOutlineBolt,
  HiOutlineChartBar,
  HiOutlineGlobeAlt,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
const healthItems = [
  { label: "Prepared channels", value: "Workspace ready", Icon: HiOutlineLockClosed },
  { label: "Webhook delivery", value: "API pending", Icon: HiOutlineBolt },
  { label: "Permissions", value: "Provider approval phase", Icon: HiOutlineShieldCheck },
  { label: "Automation coverage", value: "Templates ready", Icon: HiOutlineChartBar },
  { label: "Global availability", value: "150+ countries", Icon: HiOutlineGlobeAlt },
];

export default function ChannelsPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 transition hover:text-white">
              <HiOutlineArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Channels</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Prepare your customer channels</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              Prepare Instagram, WhatsApp, Facebook, Messenger, and Telegram workflows here. Real connections begin after official provider API approval.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/onboarding" className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-center text-sm font-bold shadow-[0_0_28px_rgba(37,99,235,.3)]">
              Run Onboarding
            </Link>
            <DashboardLogoutButton />
          </div>
        </header>

        <ChannelsLiveGrid />

        <section className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <h2 className="text-xl font-black">Setup Health</h2>
            <div className="mt-5 grid gap-3">
              {healthItems.map(({ label, value, Icon }) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-blue-300" />
                    <span className="font-bold">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-400">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <h2 className="text-xl font-black">How channel connection works</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                ["1", "Prepare", "Select the social channel and create the workspace setup."],
                ["2", "Approve API", "Complete official platform OAuth, webhook, and token approval."],
                ["3", "Automate", "Publish workflows for replies, lead capture, and team handoff."],
              ].map(([step, title, text]) => (
                <div key={title} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-black">{step}</span>
                  <h3 className="mt-4 font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 rounded-lg border border-blue-400/15 bg-blue-400/10 p-4 text-sm leading-7 text-blue-100">
              Current channel setup prepares the workspace only. Real Meta, WhatsApp, Messenger, and Telegram API/OAuth approval will be added in the backend integration phase.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
