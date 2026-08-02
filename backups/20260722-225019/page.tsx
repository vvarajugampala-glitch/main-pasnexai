"use client";

import Image from "next/image";
import { FaAws, FaFacebookF, FaMicrosoft, FaStripe } from "react-icons/fa";
import {
  HiCheckBadge,
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

          <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm md:hidden">Menu</button>
        </div>
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
                <button className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 font-semibold shadow-[0_0_35px_rgba(37,99,235,.45)] transition hover:scale-105">Start Free Trial →</button>
                <button className="rounded-2xl border border-slate-700 bg-white/5 px-8 py-4 font-semibold backdrop-blur-xl transition hover:border-blue-500 hover:bg-white/10">Book Demo</button>
              </div>

              <div className="hidden">
               <span className="text-blue-500">✓Free 14 Days</span><span>✓ No Credit Card</span><span>✓ Cancel Anytime</span>
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

                <div className="hidden">
                  <div className="flex -space-x-3">
                    {["R", "A", "M", "S"].map((initial, index) => (
                      <div
                        key={initial}
                        className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#030712] bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 text-sm font-black text-white shadow-lg"
                        style={{ opacity: 1 - index * 0.08 }}
                      >
                        {initial}
                      </div>
                    ))}
                  </div>

                  <div className="text-center sm:text-left">
                    <div className="flex items-center justify-center gap-2 sm:justify-start">
                      <span className="text-lg leading-none text-yellow-400">★★★★★</span>
                      <span className="text-sm font-bold text-white">4.9/5</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-400">Trusted by 5,000+ businesses worldwide</p>
                  </div>
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

      <section id="features" className="px-4 py-16">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[0.9fr_0.95fr_0.85fr]">
          <div className="relative mx-auto aspect-[4/3] min-h-[310px] w-full max-w-[430px] overflow-hidden rounded-lg">
            <Image
              src="/showcase-female.png.png"
              alt="Pasnex automation showcase"
              fill
              className="object-cover"
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
              <span className="text-lg text-slate-500">×</span>
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

      <section id="contact" className="px-4 pb-24">
        <div className="mx-auto w-full max-w-7xl rounded-[32px] border border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent px-6 py-16 text-center sm:px-12">
          <h2 className="text-3xl font-black sm:text-5xl">Build your first automation with Pasnex.ai</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">Launch faster, respond instantly and turn customer conversations into business growth.</p>
          <button className="mt-8 rounded-2xl bg-white px-8 py-4 font-bold text-slate-950 transition hover:scale-105">Start Free Trial →</button>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <div><p className="text-xl font-extrabold">Pasnex<span className="text-blue-500">.ai</span></p><p className="mt-1 text-sm text-slate-500">AI automation for modern businesses.</p></div>
          <p className="text-sm text-slate-500">© 2026 Pasnex.ai. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
