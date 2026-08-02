import Link from "next/link";
import {
  HiOutlineBolt,
  HiOutlineChartBar,
  HiOutlineCog6Tooth,
  HiOutlineCreditCard,
  HiOutlineGlobeAlt,
  HiOutlineInbox,
  HiOutlinePlus,
  HiOutlineSquares2X2,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { SiFacebook, SiInstagram, SiMessenger, SiTelegram, SiWhatsapp } from "react-icons/si";
import { DashboardLogoutButton } from "./DashboardLogoutButton";
import { DashboardAutomationsTable } from "./DashboardAutomationsTable";
import { DashboardChannelsPanel } from "./DashboardChannelSummary";
import { DashboardGrowthOverview } from "./DashboardGrowthOverview";
import { DashboardHeroHealth } from "./DashboardHeroHealth";
import { DashboardInboxBadge } from "./DashboardInboxBadge";
import { DashboardProfileBadge } from "./DashboardProfileBadge";
import { DashboardStatsGrid } from "./DashboardStatsGrid";
import { DashboardActivityButtons, DashboardRecentActivity } from "./DashboardActivity";
import { DashboardSearch } from "./DashboardSearch";

const navItems = [
  { label: "Overview", href: "/dashboard", Icon: HiOutlineChartBar, active: true },
  { label: "Automations", href: "/dashboard/automations", Icon: HiOutlineSquares2X2 },
  { label: "Channels", href: "/dashboard/channels", Icon: HiOutlineGlobeAlt },
  { label: "Inbox", href: "/dashboard/inbox", Icon: HiOutlineInbox, badge: "live" },
  { label: "Contacts", href: "/dashboard/contacts", Icon: HiOutlineUserGroup },
  { label: "Team", href: "/dashboard/team", Icon: HiOutlineUserGroup },
  { label: "Analytics", href: "/dashboard/analytics", Icon: HiOutlineChartBar },
  { label: "Billing", href: "/dashboard/billing", Icon: HiOutlineCreditCard },
  { label: "Settings", href: "/dashboard/settings", Icon: HiOutlineCog6Tooth },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <div className="grid min-h-screen lg:grid-cols-[245px_1fr]">
        <aside className="flex flex-col border-b border-white/10 bg-[#050b15] p-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div>
          <div className="flex items-center justify-between gap-3 lg:block">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] via-[#7c3aed] to-[#22d3ee] text-lg font-black shadow-[0_0_28px_rgba(37,99,235,.38)]">
              P
            </div>
            <div>
              <p className="text-lg font-black">Pasnex<span className="text-blue-500">.ai</span></p>
              <p className="text-[9px] uppercase tracking-[0.22em] text-slate-500">AI Workspace</p>
            </div>
          </Link>

          <Link href="/" className="flex shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-blue-300/50 hover:bg-white/[0.08] hover:text-white lg:mt-5 lg:px-4 lg:py-2.5 lg:text-sm">
            Back to Home
          </Link>
          </div>

          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0">
            {navItems.map(({ label, href, Icon, active, badge }) => (
              <Link
                key={label}
                href={href}
                className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-bold transition lg:shrink ${
                  active
                    ? "bg-gradient-to-r from-violet-700 to-blue-700 text-white shadow-[0_0_22px_rgba(37,99,235,.28)]"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  {label}
                </span>
                {badge === "live" && <DashboardInboxBadge />}
              </Link>
            ))}
          </nav>

          <div className="mt-6 hidden rounded-lg border border-white/10 bg-[#07101d] p-4 lg:block">
            <p className="text-xs text-slate-500">Current Plan</p>
            <p className="mt-1 font-black">Pro Plan</p>
            <p className="mt-1 text-xs text-slate-500">Renews on 25 May, 2026</p>
            <Link href="/dashboard/billing" className="mt-4 block w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 text-center text-xs font-bold text-slate-200 transition hover:border-blue-300/50">
              Manage Plan
            </Link>
          </div>

          <div className="mt-3 hidden rounded-lg border border-blue-400/15 bg-blue-400/10 p-4 lg:block">
            <p className="text-sm font-bold text-blue-100">Need help?</p>
            <Link href="/dashboard/support" className="mt-1 inline-flex text-xs font-bold text-blue-300 hover:text-white">
              Visit help center
            </Link>
          </div>
          </div>

          <div className="mt-4 hidden gap-3 lg:mt-auto lg:grid">
            <div className="rounded-lg border border-violet-400/20 bg-violet-400/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200">Workspace score</p>
              <div className="mt-3 flex items-end justify-between">
                <p className="text-3xl font-black">92</p>
                <span className="rounded-full bg-blue-400/10 px-2 py-1 text-[10px] font-bold text-blue-200">Healthy</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/[0.08]">
                <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-violet-500 to-blue-500" />
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#07101d] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Prepared stack</p>
              <div className="mt-3 flex items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 via-pink-500 to-violet-600 ring-2 ring-[#07101d]"><SiInstagram className="h-4 w-4 text-white" /></span>
                <span className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] ring-2 ring-[#07101d]"><SiWhatsapp className="h-4 w-4 text-white" /></span>
                <span className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] ring-2 ring-[#07101d]"><SiFacebook className="h-4 w-4 text-white" /></span>
                <span className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#00B2FF] ring-2 ring-[#07101d]"><SiMessenger className="h-4 w-4 text-white" /></span>
                <span className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#26A5E4] ring-2 ring-[#07101d]"><SiTelegram className="h-4 w-4 text-white" /></span>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 p-3 sm:p-4 lg:p-5">
          <header className="sticky top-0 z-20 -mx-3 flex flex-col gap-3 border-b border-white/10 bg-[#030712]/95 px-3 py-3 backdrop-blur-xl sm:-mx-4 sm:px-4 lg:-mx-5 lg:flex-row lg:items-center lg:justify-between lg:px-5">
            <DashboardSearch />

            <div className="flex flex-wrap items-center gap-3">
              <DashboardActivityButtons />
              <DashboardProfileBadge />
              <DashboardLogoutButton />
            </div>
          </header>

          <DashboardHeroHealth />

          <DashboardStatsGrid />

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.75fr]">
            <div className="grid auto-rows-max gap-4">
            <DashboardGrowthOverview />

            <DashboardAutomationsTable />
            </div>

            <aside className="grid gap-4">
              <section className="rounded-lg border border-white/10 bg-[#07101d]/90 p-4 shadow-[0_18px_60px_rgba(0,0,0,.18)]">
                <h2 className="text-lg font-black">Quick Actions</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {[
                    { label: "Create Automation", sub: "Build new workflow", Icon: HiOutlinePlus, href: "/dashboard/automations" },
                    { label: "Prepare Channels", sub: "Set up social accounts", Icon: SiInstagram, href: "/dashboard/channels" },
                    { label: "AI Chatbot Training", sub: "Train assistant", Icon: HiOutlineBolt, href: "/dashboard/automations" },
                    { label: "Broadcast Message", sub: "Send to audience", Icon: SiTelegram, href: "/dashboard/inbox" },
                  ].map(({ label, sub, Icon, href }) => (
                    <Link key={label} href={href} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-left transition hover:border-blue-300/50 hover:bg-white/[0.06]">
                      {label === "Prepare Channels" ? (
                        <span className="flex h-8 w-12 shrink-0 items-center">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 via-pink-500 to-violet-600 ring-2 ring-[#101827]">
                            <SiInstagram className="h-4 w-4 text-white" />
                          </span>
                          <span className="-ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] ring-2 ring-[#101827]">
                            <SiWhatsapp className="h-4 w-4 text-white" />
                          </span>
                          <span className="-ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] ring-2 ring-[#101827]">
                            <SiFacebook className="h-4 w-4 text-white" />
                          </span>
                        </span>
                      ) : (
                        <Icon className="h-5 w-5 text-blue-300" />
                      )}
                      <span>
                        <span className="block text-sm font-bold">{label}</span>
                        <span className="text-xs text-slate-500">{sub}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>

              <DashboardChannelsPanel />

              <section className="rounded-lg border border-blue-400/15 bg-blue-400/10 p-4 shadow-[0_18px_60px_rgba(37,99,235,.12)]">
                <h2 className="text-lg font-black text-blue-100">Recommended Next Move</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Prepare Messenger and Telegram to complete the multi-channel workspace, then publish the WhatsApp lead qualification flow.
                </p>
                <Link href="/dashboard/channels" className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-bold">
                  Continue Setup
                </Link>
              </section>

              <DashboardRecentActivity />
            </aside>
          </div>

        </section>
      </div>
    </main>
  );
}
