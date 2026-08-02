"use client";

import Image from "next/image";
import { useState } from "react";
import { FaAws, FaFacebookF, FaMicrosoft, FaStripe } from "react-icons/fa";
import {
  HiCheckBadge,
  HiOutlineArrowTrendingUp,
  HiOutlineBolt,
  HiOutlineChartBar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineGlobeAlt,
  HiOutlineInbox,
  HiOutlinePlayCircle,
  HiOutlineArrowsPointingOut,
  HiOutlineShieldCheck,
  HiOutlineSquares2X2,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { TbBrandOpenai } from "react-icons/tb";
import {
  SiInstagram,
  SiMessenger,
  SiMeta,
  SiGooglecloud,
  SiTelegram,
  SiWhatsapp,
} from "react-icons/si";

const socialIcons = [
  { Icon: SiInstagram, className: "instagramIcon", orbitClass: "orbit1" },
  { Icon: SiWhatsapp, className: "whatsappIcon", orbitClass: "orbit2" },
  { Icon: SiMessenger, className: "messengerIcon", orbitClass: "orbit3" },
  { Icon: FaFacebookF, className: "facebookIcon", orbitClass: "orbit4" },
  { Icon: SiTelegram, className: "telegramIcon", orbitClass: "orbit5" },
];

const technologies = [
  { name: "OpenAI", Icon: TbBrandOpenai, className: "text-emerald-300" },
  { name: "Meta", Icon: SiMeta, className: "text-blue-400" },
  { name: "Google Cloud", Icon: SiGooglecloud, className: "text-sky-300" },
  { name: "Microsoft", Icon: FaMicrosoft, className: "text-sky-400" },
  { name: "AWS", Icon: FaAws, className: "text-orange-300" },
  { name: "Stripe", Icon: FaStripe, className: "text-indigo-300" },
];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#030712] text-white">
      <header className="fixed inset-x-0 top-5 z-50 px-4">
        <div className="mx-auto flex h-[76px] w-full max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-[#07101d]/90 px-5 shadow-2xl backdrop-blur-2xl md:px-8">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-xl font-black shadow-[0_0_30px_rgba(37,99,235,.38)]">
              P
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                Pasnex<span className="text-blue-500">.ai</span>
              </h2>
              <p className="hidden text-[9px] uppercase tracking-[0.25em] text-slate-500 sm:block">
                AI Automation Platform
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            <a href="#features" className="text-sm text-slate-300 transition hover:text-white">Features</a>
            <a href="#solutions" className="text-sm text-slate-300 transition hover:text-white">Solutions</a>
            <a href="#integrations" className="text-sm text-slate-300 transition hover:text-white">Integrations</a>
            <a href="#contact" className="text-sm text-slate-300 transition hover:text-white">Contact</a>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <button className="text-sm text-slate-300 transition hover:text-white">Login</button>
            <button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold shadow-[0_0_30px_rgba(37,99,235,.35)] transition hover:scale-105">
              Start Free Trial
            </button>
          </div>

          <button
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm md:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            Menu
          </button>
        </div>

        {isMenuOpen && (
          <div className="mx-auto mt-3 w-full max-w-7xl rounded-2xl border border-white/10 bg-[#07101d]/95 p-4 shadow-2xl backdrop-blur-2xl md:hidden">
            <nav className="grid gap-3">
              {["Features", "Solutions", "Integrations", "Contact"].map((item) => (
                <a
                  key={item}
                  href={item === "Contact" ? "#contact" : `#${item.toLowerCase()}`}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
            </nav>
            <div className="mt-4 grid gap-3">
              <button className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-300">Login</button>
              <button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold">Start Free Trial</button>
            </div>
          </div>
        )}
      </header>

      <section className="relative flex min-h-screen items-center overflow-hidden px-4 pb-6 pt-48 sm:pt-52 lg:pt-40">
        <div className="pointer-events-none absolute left-1/2 top-24 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[170px]" />
        <div className="pointer-events-none absolute -right-32 top-1/3 h-[420px] w-[420px] rounded-full bg-indigo-500/10 blur-[140px]" />

        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="grid w-full items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center lg:mx-0 lg:items-start lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300 sm:text-sm">AI Powered Automation Platform</span>
              </div>

              <h1 className="mt-7 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-[68px]">
                Automate Your
                <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">Business</span>
                Like Never Before
              </h1>

              <p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
                Pasnex.ai helps businesses automate Instagram, Facebook, WhatsApp and customer conversations using powerful AI workflows that work 24/7.
              </p>

              <div className="mt-9 flex w-full flex-col justify-center gap-4 sm:w-auto sm:flex-row lg:justify-start">
                <button className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 font-semibold shadow-[0_0_35px_rgba(37,99,235,.45)] transition hover:scale-105">Start Free Trial â†’</button>
                <button className="rounded-2xl border border-slate-700 bg-white/5 px-8 py-4 font-semibold backdrop-blur-xl transition hover:border-blue-500 hover:bg-white/10">Book Demo</button>
              </div>


              <div className="mt-8 w-full max-w-xl">
                <div className="grid gap-3 text-xs font-semibold text-slate-300 sm:grid-cols-3">
                  {["No Credit Card Required", "Cancel Anytime", "14-Day Free Trial"].map((item) => (
                    <div key={item} className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 lg:justify-start">
                      <HiCheckBadge className="h-4 w-4 shrink-0 text-violet-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>

      
     <div className="heroOrbit">

  <Image
    src="/hero.person.jpg.png"
    alt="Pasnex Hero"
    width={560}
    height={660}
    priority
    className="heroImage"
  />

  {socialIcons.map(({ Icon, className, orbitClass }) => (
      <div key={className} className={`orbit ${orbitClass}`}>
        <div className="orbitIcon">
          <Icon className={className} />
        </div>
      </div>
  ))}

</div>

                 {/* HERO RIGHT */}

</div> {/* HERO GRID */}

</div> {/* HERO CONTAINER */}

</section>

      <section id="integrations" className="py-6">
        <div className="mx-auto w-full max-w-7xl px-4 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.32em] text-slate-400 sm:text-base">Trusted Technologies</p>
          <div className="mt-5 grid grid-cols-2 items-center gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {technologies.map(({ name, Icon, className }) => (
              <div key={name} className="group flex h-16 items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-[#08111f]/80 px-4 text-sm font-semibold text-slate-300 shadow-[0_14px_40px_rgba(0,0,0,.18)] transition duration-300 hover:-translate-y-1 hover:border-blue-400/50 hover:bg-white/[0.06] hover:text-white hover:shadow-[0_18px_55px_rgba(37,99,235,.18)]">
                <Icon className={`h-5 w-5 shrink-0 ${className}`} />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-4 pb-8 pt-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.32em] text-blue-400 sm:text-base">Powerful Features</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Everything You Need to Automate</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
              All-in-one platform to automate conversations, nurture leads, and grow your business.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {[
              { Icon: HiOutlineInbox, title: "Multi-Channel Inbox", text: "Manage Instagram, Facebook, WhatsApp, Messenger and more in one place." },
              { Icon: HiOutlineBolt, title: "Smart Automations", text: "Auto reply, keyword replies, comments to DM, and welcome flows." },
              { Icon: HiOutlineSquares2X2, title: "Flow Builder", text: "Visual drag and drop builder to create powerful automation flows." },
              { Icon: HiOutlineChatBubbleLeftRight, title: "AI Assistant", text: "AI-powered smart replies that engage and convert your customers." },
              { Icon: HiOutlineChartBar, title: "Analytics & Reports", text: "Advanced analytics to track performance and optimize results." },
              { Icon: HiOutlineUserGroup, title: "Team Collaboration", text: "Add team members, set roles, and work together smoothly." },
            ].map(({ Icon, title, text }) => (
              <article key={title} className="group flex min-h-[210px] flex-col rounded-lg border border-white/10 bg-[#07101d]/90 p-5 text-left shadow-[0_14px_45px_rgba(0,0,0,.22)] transition duration-300 hover:-translate-y-1 hover:border-violet-400/50 hover:bg-white/[0.055] hover:shadow-[0_18px_55px_rgba(124,58,237,.18)]">
                <Icon className="h-9 w-9 text-violet-400 transition group-hover:text-blue-300" />
                <h3 className="mt-5 text-base font-bold text-white">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">{text}</p>
                <button className="mt-5 self-start text-sm font-bold text-white transition hover:text-blue-300">Learn More +</button>
              </article>
            ))}
          </div>

          <div className="mt-4 grid overflow-hidden rounded-lg border border-violet-400/20 bg-gradient-to-r from-violet-700 via-indigo-700 to-blue-700 shadow-[0_18px_60px_rgba(37,99,235,.22)] sm:grid-cols-2 lg:grid-cols-5">
            {[
              { Icon: HiOutlineUserGroup, value: "5,000+", label: "Active Businesses" },
              { Icon: HiOutlineChatBubbleLeftRight, value: "10M+", label: "Messages Automated" },
              { Icon: HiOutlineArrowTrendingUp, value: "99.9%", label: "Uptime & Reliability" },
              { Icon: HiOutlineGlobeAlt, value: "150+", label: "Countries Supported" },
              { Icon: HiOutlineShieldCheck, value: "24/7", label: "Customer Support" },
            ].map(({ Icon, value, label }) => (
              <div key={label} className="flex items-center gap-4 border-white/10 px-6 py-5 text-left lg:border-r last:border-r-0">
                <Icon className="h-9 w-9 shrink-0 text-blue-200" />
                <div>
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="text-xs font-semibold text-blue-100/85">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="solutions" className="px-4 py-16">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-6 lg:grid-cols-[1.2fr_0.88fr_0.82fr]">
          <div className="relative mx-auto h-[365px] w-full max-w-[660px] overflow-hidden rounded-lg sm:h-[395px] lg:h-[430px]">
            <Image
              src="/Shoecase-female.png"
              alt="Pasnex automation showcase"
              fill
              className="object-contain"
            />
          </div>

          <div className="text-center lg:text-left">
            <p className="inline-flex rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-300">AI that works for you</p>
            <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">
              Smarter Automation.
              <span className="block">Better Conversations.</span>
              <span className="block bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">Real Results.</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400 lg:max-w-none">
              Pasnex.ai uses AI to understand, respond and engage your customers like never before.
            </p>

            <div className="mt-6 space-y-3 text-sm font-semibold text-slate-300">
              {["AI-Powered Replies", "Human-like Conversations", "Higher Engagement", "More Conversions"].map((item) => (
                <div key={item} className="flex items-center justify-center gap-3 lg:justify-start">
                  <HiCheckBadge className="h-5 w-5 text-violet-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <button className="mt-8 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-7 py-3 text-sm font-bold shadow-[0_0_32px_rgba(124,58,237,.32)] transition hover:-translate-y-1">
              See AI in Action +
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0B1220]/95 p-5 shadow-[0_0_50px_rgba(59,130,246,.25)] backdrop-blur-2xl transition duration-300 hover:-translate-y-2 hover:border-blue-500/40">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 font-bold shadow-lg">AI</div>
                <div>
                  <h3 className="font-bold text-white">Pasnex AI</h3>
                  <p className="text-xs text-slate-400">AI Automation Assistant</p>
                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                    LIVE
                  </span>
                </div>
              </div>
              <span className="text-lg text-slate-500">Ã—</span>
            </div>

            <div className="mt-5 max-h-[285px] space-y-4 overflow-y-auto pr-2">
              <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-slate-800 p-4 text-sm leading-6 text-slate-300">
                Welcome to Pasnex AI.
                <br />
                How can I automate your business today?
              </div>
              <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-sm text-white">
                I need Instagram Automation.
              </div>
              <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-slate-800 p-4 text-sm leading-6 text-slate-300">
                Auto Reply
                <br />
                Comment Automation
                <br />
                Lead Capture
                <br />
                AI Conversations
              </div>
              <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-sm text-white">
                Can it work 24/7?
              </div>
              <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-slate-800 p-4 text-sm leading-6 text-slate-300">
                Yes. Pasnex.ai replies instantly, captures leads, and keeps conversations moving day and night.
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <span className="text-xs text-slate-400">AI is typing</span>
              <div className="flex gap-1">
                <span className="typingDot" />
                <span className="typingDot" />
                <span className="typingDot" />
              </div>
            </div>

            <button className="mt-5 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-semibold text-white transition duration-300 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(37,99,235,.5)]">
              Book Demo +
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 pt-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400 sm:text-base">How it works</p>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl">Get Started in 3 Simple Steps</h2>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-3 lg:items-center lg:gap-14">
            {[
              { Icon: HiOutlineUserGroup, step: "01", title: "Connect Channels", text: "Connect your favorite platforms like Instagram, Facebook, WhatsApp and more." },
              { Icon: HiOutlineSquares2X2, step: "02", title: "Build Automations", text: "Create smart automations using our easy drag and drop flow builder." },
              { Icon: HiOutlineArrowsPointingOut, step: "03", title: "Engage & Grow", text: "Engage customers, automate conversations and grow your business." },
            ].map(({ Icon, step, title, text }, index) => (
              <article key={title} className="group relative flex min-h-36 items-center gap-6 rounded-lg border border-white/10 bg-[#07101d]/80 p-6 text-left shadow-[0_16px_50px_rgba(0,0,0,.22)] transition duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:bg-white/[0.05]">
                {index < 2 && (
                  <div className="stepConnector pointer-events-none absolute -right-12 top-1/2 hidden h-1 w-16 rounded-full bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-300 lg:block">
                    <span className="absolute -right-1.5 -top-1.5 h-4 w-4 rotate-45 border-r-2 border-t-2 border-cyan-300" />
                  </div>
                )}
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 shadow-[0_0_36px_rgba(37,99,235,.38)]">
                  <Icon className="h-10 w-10 text-white" />
                  <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-[11px] font-black text-white ring-4 ring-[#030712]">{step}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400 sm:text-base">Simple Pricing</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">Choose the Plan That&apos;s Right for You</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Start free and upgrade anytime. No hidden fees.</p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              { name: "Starter", audience: "For small businesses", price: "INR 1,499", features: ["3 Social Accounts", "10,000 Messages / Month", "Advanced Automations", "AI Auto Reply", "Priority Support"], cta: "Start 14-Day Free Trial" },
              { name: "Pro", audience: "For growing businesses", price: "INR 2,999", badge: "Popular", features: ["10 Social Accounts", "50,000 Messages / Month", "Advanced Flow Builder", "AI Assistant (GPT-4)", "Analytics & Reports", "Priority Support"], cta: "Start 14-Day Free Trial" },
              { name: "Business", audience: "For established businesses", price: "INR 5,999", features: ["25 Social Accounts", "100,000 Messages / Month", "Advanced Automations", "AI Assistant (GPT-4)", "Analytics & Reports", "Priority Support"], cta: "Start 14-Day Free Trial" },
              { name: "Enterprise", audience: "For large organizations", price: "Custom", suffix: "/month", features: ["Unlimited Accounts", "Unlimited Messages", "Custom Integrations", "Dedicated Account Manager", "24/7 Premium Support"], cta: "Talk to Sales" },
            ].map((plan) => (
              <article key={plan.name} className="relative rounded-lg border border-white/10 bg-[#07101d]/85 p-6 shadow-[0_18px_55px_rgba(0,0,0,.22)] transition duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:bg-white/[0.05]">
                {plan.badge && <span className="absolute right-4 top-4 rounded-full bg-violet-600 px-3 py-1 text-[10px] font-bold text-white">{plan.badge}</span>}
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{plan.audience}</p>
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="pb-1 text-sm font-semibold text-slate-400">{plan.suffix ?? "/month"}</span>
                </div>
                <ul className="mt-6 space-y-2 text-sm text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <HiCheckBadge className="h-4 w-4 shrink-0 text-violet-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="mt-7 w-full rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(37,99,235,.24)] transition hover:scale-[1.02]">{plan.cta}</button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="px-4 pb-20 pt-4">
        <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between overflow-hidden rounded-lg border border-violet-500/20 bg-gradient-to-r from-violet-700/75 via-blue-700/45 to-[#07101d] px-8 py-6 pr-10 shadow-[0_20px_70px_rgba(37,99,235,.2)] lg:pr-44">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-56 bg-gradient-to-l from-blue-500/18 via-cyan-400/8 to-transparent" />
          <div className="relative z-10 max-w-xl">
            <h2 className="text-2xl font-black sm:text-3xl">Ready to Automate Your Business?</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-200">Join thousands of businesses already using Pasnex.ai to automate conversations and grow faster.</p>
          </div>
          <div className="relative z-20 hidden items-center gap-3 md:flex lg:-translate-x-12">
            <button className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-7 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(37,99,235,.35)] transition hover:scale-[1.03]">Start 14-Day Free Trial +</button>
            <button className="group inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-bold text-white transition duration-300 hover:-translate-y-1 hover:border-blue-300/50 hover:bg-white/[0.1] hover:shadow-[0_0_28px_rgba(96,165,250,.25)]">
              <HiOutlinePlayCircle className="h-5 w-5 text-blue-300 transition group-hover:scale-110 group-hover:text-white" />
              <span>Book a Demo</span>
            </button>
          </div>
          <div className="pointer-events-none absolute bottom-[-28px] right-[-4px] z-10 hidden h-44 w-44 opacity-95 md:block lg:right-4">
            <Image
              src="/image-robot.png"
              alt="Pasnex automation robot"
              fill
              className="object-contain drop-shadow-[0_0_34px_rgba(96,165,250,.5)]"
            />
          </div>
        </div>
      </section>


      <footer className="border-t border-white/10 bg-[#050b15] px-4 py-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_0.8fr_1.4fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2b5cff] via-[#7c3aed] to-[#20d8ff] shadow-[0_0_26px_rgba(37,99,235,.42)]">
                  <span className="text-xl font-black text-white">P</span>
                  <span className="absolute -right-1 top-1 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,.9)]" />
                  <span className="absolute right-1 top-[-3px] h-1.5 w-1.5 rounded-full bg-blue-300" />
                </div>
                <p className="text-2xl font-extrabold">Pasnex<span className="text-blue-500">.ai</span></p>
              </div>
              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">AI automation platform that helps businesses automate customer conversations and grow faster.</p>
              <div className="mt-4 flex gap-3 text-slate-400">
                <SiInstagram className="h-4 w-4 transition hover:text-pink-400" />
                <FaFacebookF className="h-4 w-4 transition hover:text-blue-400" />
                <SiWhatsapp className="h-4 w-4 transition hover:text-emerald-400" />
                <SiTelegram className="h-4 w-4 transition hover:text-sky-400" />
              </div>
            </div>

            {[
              { title: "Platform", links: ["Features", "Integrations", "Pricing", "Changelog"] },
              { title: "Solutions", links: ["E-commerce", "Real Estate", "Education", "Healthcare"] },
              { title: "Resources", links: ["Blog", "Guides", "Help Center", "API Docs"] },
              { title: "Company", links: ["About Us", "Careers", "Contact Us", "Privacy Policy"] },
            ].map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-bold text-white">{group.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-500">
                  {group.links.map((link) => (
                    <li key={link}><a href="#" className="transition hover:text-white">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="text-sm font-bold text-white">Stay Updated</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">Subscribe to our newsletter for latest updates and offers.</p>
              <div className="mt-4 flex overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
                <input className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600" placeholder="Enter your email" />
                <button className="bg-gradient-to-r from-violet-600 to-blue-600 px-4 text-sm font-bold text-white">+</button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-slate-500 sm:flex-row">
            <p>(c) 2026 Pasnex.ai. All rights reserved.</p>
            <div className="flex gap-5">
              <a href="#" className="transition hover:text-white">Terms of Service</a>
              <a href="#" className="transition hover:text-white">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>

    </main>
  );
}
