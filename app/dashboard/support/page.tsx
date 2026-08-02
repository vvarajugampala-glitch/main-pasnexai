import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlinePhone,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineWrenchScrewdriver,
} from "react-icons/hi2";
import { DashboardLogoutButton } from "../DashboardLogoutButton";
import { SupportTicketsPanel } from "./SupportTicketsPanel";

const supportEmail = "pasnexai@gmail.com";
const supportPhone = "+91 8919052808";

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 transition hover:text-white">
              <HiOutlineArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Support</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Pasnex.ai help center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              Get setup guidance, launch support, platform integration notes, and direct help from the Pasnex.ai team.
            </p>
          </div>
          <DashboardLogoutButton />
        </header>

        <section className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-blue-300/15 bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-cyan-500/10 p-6">
            <HiOutlineSparkles className="h-8 w-8 text-blue-300" />
            <h2 className="mt-5 text-2xl font-black">Launch support for your automation workspace</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              We will help you prepare channels, workflows, inbox operations, analytics, and provider API requirements before production launch.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a href={`mailto:${supportEmail}?subject=Pasnex.ai%20Support%20Request`} className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-center text-sm font-bold">
                Email Support
              </a>
              <a href={`https://wa.me/918919052808?text=${encodeURIComponent("Hi Pasnex.ai, I need help with my automation workspace.")}`} className="rounded-lg border border-white/10 bg-white/[0.04] px-5 py-3 text-center text-sm font-bold transition hover:border-blue-300/50">
                WhatsApp Support
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Email", value: supportEmail, text: "For setup, billing, API, and account support.", Icon: HiOutlineEnvelope },
              { label: "Phone", value: supportPhone, text: "For demo, launch readiness, and urgent help.", Icon: HiOutlinePhone },
              { label: "API status", value: "Provider approval phase", text: "Meta/WhatsApp/Messenger APIs are prepared, not live yet.", Icon: HiOutlineShieldCheck },
              { label: "Workspace health", value: "Ready", text: "Core dashboard modules are connected to real data.", Icon: HiOutlineCheckCircle },
            ].map(({ label, value, text, Icon }) => (
              <article key={label} className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
                <Icon className="h-7 w-7 text-blue-300" />
                <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
                <h2 className="mt-1 text-lg font-black">{value}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <SupportTicketsPanel />

        <section className="mt-6 grid gap-5 xl:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <HiOutlineWrenchScrewdriver className="h-7 w-7 text-violet-300" />
            <h2 className="mt-4 text-xl font-black">Setup Checklist</h2>
            <div className="mt-5 grid gap-3">
              {[
                ["Complete onboarding", "/onboarding"],
                ["Prepare social channels", "/dashboard/channels"],
                ["Create automation templates", "/dashboard/automations"],
                ["Test inbox conversations", "/dashboard/inbox"],
                ["Review analytics", "/dashboard/analytics"],
              ].map(([label, href]) => (
                <Link key={label} href={href} className="flex items-center gap-3 rounded-lg bg-white/[0.035] p-3 text-sm font-bold transition hover:bg-white/[0.06]">
                  <HiOutlineCheckCircle className="h-5 w-5 text-blue-300" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <HiOutlineBookOpen className="h-7 w-7 text-blue-300" />
            <h2 className="mt-4 text-xl font-black">Quick Guides</h2>
            <div className="mt-5 grid gap-3">
              {[
                ["How channel setup works", "Prepare workspace first, then complete official API approval."],
                ["How automations work", "Templates prepare trigger, reply, qualification, and handoff rules."],
                ["How inbox works", "Conversations are stored and AI replies can be prepared for review."],
                ["How billing works", "Manual invoices now, payment gateway later before launch."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-lg bg-white/[0.035] p-4">
                  <p className="font-bold">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <HiOutlineChatBubbleLeftRight className="h-7 w-7 text-cyan-300" />
            <h2 className="mt-4 text-xl font-black">FAQ</h2>
            <div className="mt-5 grid gap-3">
              {[
                ["Are messages live now?", "Not yet. The workspace is prepared; live messages start after official platform API approval."],
                ["Can clients use Google login?", "Yes. First-time Google users complete profile and onboarding, then dashboard opens."],
                ["Can we invite team members?", "Role flow is prepared. Email invite delivery will be connected before launch."],
                ["Is data real?", "Dashboard modules now read from Supabase workspace tables."],
              ].map(([question, answer]) => (
                <div key={question} className="rounded-lg bg-white/[0.035] p-4">
                  <p className="font-bold">{question}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <HiOutlineGlobeAlt className="h-7 w-7 text-blue-300" />
                <h2 className="text-xl font-black">Production launch guidance</h2>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                Before public launch, we will complete provider APIs, email invite delivery, payment gateway, role enforcement, privacy pages, and end-to-end QA.
              </p>
            </div>
            <Link href="/dashboard/settings" className="rounded-lg border border-white/10 bg-white/[0.04] px-5 py-3 text-center text-sm font-bold transition hover:border-blue-300/50">
              Review Settings
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
