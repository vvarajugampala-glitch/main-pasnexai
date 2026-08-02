"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FaAws, FaFacebookF, FaMicrosoft, FaPhoneAlt, FaStripe } from "react-icons/fa";
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
import { AskPasnexCard } from "./AskPasnexCard";
import { trackCta } from "@/lib/track";

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

const demoLink =
  "mailto:pasnexai@gmail.com?subject=Book%20a%20Pasnex.ai%20Demo&body=Hi%20Pasnex.ai%2C%0A%0AI%20want%20to%20book%20a%20demo%20for%20social%20media%20automation.%0A%0ABusiness%20name%3A%0AWebsite%20or%20Instagram%3A%0APhone%2FWhatsApp%3A%0AMain%20requirement%3A";
const formSubmitLink = "https://formsubmit.co/pasnexai@gmail.com";
const phoneLink = "tel:+918919052808";
const whatsappLink =
  "https://wa.me/918919052808?text=Hi%20Pasnex.ai%2C%20I%20want%20to%20book%20a%20demo%20for%20social%20media%20automation.";
const leadFormLink = "#lead-form";

const useCases = [
  {
    Icon: HiOutlineInbox,
    title: "Multi-Channel Inbox",
    text: "Manage every customer message from social, chat, and web channels in one workspace.",
    detail: "Best for any business receiving enquiries from multiple places. Your team can review conversations, qualify leads, and avoid missing important messages.",
  },
  {
    Icon: HiOutlineUserGroup,
    title: "Find Real Customers",
    text: "Capture enquiries, identify serious buyers, and organize follow-ups automatically.",
    detail: "Pasnex.ai handles lead capture and qualification by collecting customer details, understanding intent, and helping your team focus on high-value prospects.",
  },
  {
    Icon: HiOutlineBolt,
    title: "Sales Follow-up Automation",
    text: "Send timely replies, reminders, demo links, offers, and next steps without manual delay.",
    detail: "Pasnex.ai helps businesses keep conversations moving after the first enquiry, so potential customers do not go cold.",
  },
  {
    Icon: HiOutlineChatBubbleLeftRight,
    title: "Customer Support Automation",
    text: "Answer common questions, prepare support replies, and route important cases to your team.",
    detail: "AI can handle repetitive questions while your team focuses on urgent, high-value, or sensitive customer conversations.",
  },
  {
    Icon: HiOutlinePlayCircle,
    title: "Appointment & Demo Booking",
    text: "Guide customers from interest to booking, consultation, callback, or demo request.",
    detail: "Good for businesses that depend on calls, appointments, walkthroughs, sales demos, site visits, or consultations.",
  },
  {
    Icon: HiOutlineChartBar,
    title: "Performance & Growth Tracking",
    text: "Track messages, leads, automations, channel readiness, and conversion signals.",
    detail: "Owners and teams can see what is working, where leads are coming from, and which workflows need improvement.",
  },
];

const faqs = [
  {
    question: "Can Pasnex.ai automate Instagram and WhatsApp together?",
    answer: "Yes. Pasnex.ai is designed for multi-channel conversations, so teams can manage Instagram, Facebook, Messenger, WhatsApp, and AI replies from one workflow.",
  },
  {
    question: "Do I need technical knowledge to use it?",
    answer: "No. The flow builder is made for business users. You can start with templates and customize replies, lead capture, routing, and follow-ups as your business grows.",
  },
  {
    question: "Is this suitable for global brands?",
    answer: "Yes. Pasnex.ai is built around reliability, security, multi-country support, and scalable team workflows needed by growing global businesses.",
  },
];

function getFooterHref(link: string) {
  if (link === "Privacy Policy") return "/privacy";
  if (link === "Pricing") return "#pricing";
  if (link === "Features") return "#features";
  if (link === "Integrations") return "#integrations";
  if (link === "Contact Us") return "#contact";
  if (link === "About Us") return "#about";
  if (link === "Blog") return "#blog";
  if (["Multi-Channel Inbox", "Find Real Customers", "Sales Follow-up", "Customer Support"].includes(link)) return "#solutions";
  return "#";
}

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState("");
  const [expandedSolution, setExpandedSolution] = useState("");
  const [hoveredFeature, setHoveredFeature] = useState("");
  const [hoveredSolution, setHoveredSolution] = useState("");

  useEffect(() => {
    if (!expandedFeature || hoveredFeature === expandedFeature) return;

    const timer = window.setTimeout(() => {
      setExpandedFeature("");
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [expandedFeature, hoveredFeature]);

  useEffect(() => {
    if (!expandedSolution || hoveredSolution === expandedSolution) return;

    const timer = window.setTimeout(() => {
      setExpandedSolution("");
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [expandedSolution, hoveredSolution]);

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#030712] text-white"
      onClickCapture={(event) => {
        if (!expandedFeature && !expandedSolution) return;
        const target = event.target;
        if (target instanceof Element && target.closest("[data-feature-card]")) return;
        if (target instanceof Element && target.closest("[data-solution-card]")) return;
        setExpandedFeature("");
        setExpandedSolution("");
      }}
    >
      <header className="fixed inset-x-0 top-5 z-50 px-4">
        <div className="mx-auto flex h-[76px] w-full max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-[#07101d]/90 px-5 shadow-2xl backdrop-blur-2xl md:px-8">
          <a href="#" className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] via-[#7c3aed] to-[#22d3ee] text-xl font-black shadow-[0_0_30px_rgba(37,99,235,.38)]">
              <span className="relative z-10">P</span>
              <span className="absolute -right-1 top-1 h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(34,211,238,.9)]" />
              <span className="absolute right-1 top-[-3px] h-1.5 w-1.5 rounded-full bg-blue-200" />
              <span className="absolute right-3 top-2 h-px w-4 rotate-[-28deg] bg-cyan-200/70" />
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

          <nav className="hidden items-center gap-5 lg:flex">
            <a href="#" className="text-sm text-slate-300 transition hover:text-white">Home</a>
            <a href="#features" className="text-sm text-slate-300 transition hover:text-white">Features</a>
            <a href="#solutions" className="text-sm text-slate-300 transition hover:text-white">Solutions</a>
            <a href="#pricing" onClick={() => trackCta("pricing", "desktop_nav", "pricing_click")} className="text-sm text-slate-300 transition hover:text-white">Pricing</a>
            <a href="#about" className="text-sm text-slate-300 transition hover:text-white">About</a>
            <a href="#contact" className="text-sm text-slate-300 transition hover:text-white">Contact</a>
            <a href="#blog" className="text-sm text-slate-300 transition hover:text-white">Blog</a>
            <a href="/register" onClick={() => trackCta("register", "desktop_nav", "register_click")} className="text-sm text-slate-300 transition hover:text-white">Register</a>
            <a href="/login" onClick={() => trackCta("login", "desktop_nav")} className="text-sm text-slate-300 transition hover:text-white">Login</a>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <a href="#pricing" onClick={() => trackCta("start_free_trial", "header_trial", "pricing_click")} className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold shadow-[0_0_30px_rgba(37,99,235,.35)] transition hover:scale-105">
              Start Free Trial
            </a>
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
              {[
                { label: "Home", href: "#" },
                { label: "Features", href: "#features" },
                { label: "Solutions", href: "#solutions" },
                { label: "Pricing", href: "#pricing" },
                { label: "About", href: "#about" },
                { label: "Contact", href: "#contact" },
                { label: "Blog", href: "#blog" },
                { label: "Register", href: "/register" },
                { label: "Login", href: "/login" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                  onClick={() => {
                    trackCta(item.label.toLowerCase().replaceAll(" ", "_"), "mobile_menu", item.label === "Register" ? "register_click" : item.label === "Pricing" ? "pricing_click" : "cta_click");
                    setIsMenuOpen(false);
                  }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 grid gap-3">
              <a href="#pricing" className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-center text-sm font-semibold" onClick={() => { trackCta("start_free_trial", "mobile_menu", "pricing_click"); setIsMenuOpen(false); }}>Start Free Trial</a>
            </div>
          </div>
        )}
      </header>

      <section className="relative flex min-h-[780px] items-center overflow-hidden px-4 pb-10 pt-36 sm:min-h-screen sm:pt-52 lg:pt-40">
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
                <a href="#pricing" onClick={() => trackCta("start_free_trial", "hero_trial", "pricing_click")} className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 font-semibold shadow-[0_0_35px_rgba(37,99,235,.45)] transition hover:scale-105">Start Free Trial +</a>
                <a href={leadFormLink} onClick={() => trackCta("book_demo", "hero_demo", "demo_click")} className="rounded-2xl border border-slate-700 bg-white/5 px-8 py-4 font-semibold backdrop-blur-xl transition hover:border-blue-500 hover:bg-white/10">Book Demo</a>
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
    sizes="(max-width: 768px) 92vw, 560px"
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

          <div className="mt-8 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-6">
            {[
              { Icon: HiOutlineInbox, title: "Multi-Channel Inbox", text: "Manage Instagram, Facebook, WhatsApp, Messenger and more in one place.", detail: "All customer conversations can be reviewed from one shared workspace, so your team does not miss leads across Instagram, WhatsApp, Facebook, Messenger, or web enquiries." },
              { Icon: HiOutlineBolt, title: "Smart Automations", text: "Auto reply, keyword replies, comments to DM, and welcome flows.", detail: "Pasnex.ai can prepare reply flows for keywords, comments, welcome messages, lead qualification, and follow-up reminders while keeping provider API approval clear." },
              { Icon: HiOutlineSquares2X2, title: "Flow Builder", text: "Visual drag and drop builder to create powerful automation flows.", detail: "Start from ready templates, choose triggers, add reply actions, capture lead details, and build a workflow that matches your business process." },
              { Icon: HiOutlineChatBubbleLeftRight, title: "AI Assistant", text: "AI-powered smart replies that engage and convert your customers.", detail: "AI can suggest human-like replies, summarize customer intent, and prepare next actions so your team replies faster with better context." },
              { Icon: HiOutlineChartBar, title: "Analytics & Reports", text: "Advanced analytics to track performance and optimize results.", detail: "Track conversations, leads, automation performance, channel readiness, and conversion signals from one dashboard before scaling campaigns." },
              { Icon: HiOutlineUserGroup, title: "Team Collaboration", text: "Add team members, set roles, and work together smoothly.", detail: "Invite team members, assign conversations, review AI replies, and keep sales, support, and admin work organized in one secure workspace." },
            ].map(({ Icon, title, text, detail }) => (
              <article
                key={title}
                data-feature-card
                onMouseEnter={() => setHoveredFeature(title)}
                onMouseLeave={() => setHoveredFeature("")}
                onClick={() => {
                  const nextFeature = expandedFeature === title ? "" : title;
                  setExpandedFeature(nextFeature);
                  if (nextFeature) trackCta("feature_card", title.toLowerCase().replaceAll(" ", "_"));
                }}
                className="group flex h-[320px] cursor-pointer flex-col rounded-lg border border-white/10 bg-[#07101d]/90 p-5 text-left shadow-[0_14px_45px_rgba(0,0,0,.22)] transition duration-300 hover:-translate-y-1 hover:border-violet-400/50 hover:bg-white/[0.055] hover:shadow-[0_18px_55px_rgba(124,58,237,.18)] xl:h-[350px]"
              >
                <Icon className="h-9 w-9 text-violet-400 transition group-hover:text-blue-300" />
                <h3 className="mt-5 text-base font-bold text-white">{title}</h3>
                <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-400">{text}</p>
                {expandedFeature === title && (
                  <p className="mt-4 max-h-[95px] overflow-y-auto rounded-lg border border-blue-300/15 bg-blue-400/10 p-3 text-xs leading-5 text-blue-100">
                    {detail}
                  </p>
                )}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    const nextFeature = expandedFeature === title ? "" : title;
                    setExpandedFeature(nextFeature);
                    if (nextFeature) trackCta("feature_learn_more", title.toLowerCase().replaceAll(" ", "_"));
                  }}
                  className="mt-auto self-start cursor-pointer pt-5 text-sm font-bold text-white transition hover:text-blue-300"
                >
                  {expandedFeature === title ? "Show Less -" : "Learn More +"}
                </button>
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

      <section id="automation-showcase" className="px-4 py-16">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[1.2fr_0.88fr_0.82fr] lg:gap-6">
          <div className="relative mx-auto h-[315px] w-full max-w-[660px] overflow-hidden rounded-lg sm:h-[395px] lg:h-[430px]">
            <Image
              src="/Shoecase-female.png"
              alt="Pasnex automation showcase"
              fill
              sizes="(max-width: 1024px) 92vw, 45vw"
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

            <a href={leadFormLink} onClick={() => trackCta("see_ai_in_action", "automation_section", "demo_click")} className="mt-8 inline-flex rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-7 py-3 text-sm font-bold shadow-[0_0_32px_rgba(124,58,237,.32)] transition hover:-translate-y-1">
              See AI in Action +
            </a>
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
              <span className="text-lg text-slate-500">x</span>
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

            <a href={leadFormLink} onClick={() => trackCta("chat_book_demo", "live_chat_card", "demo_click")} className="mt-5 flex w-full justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-semibold text-white transition duration-300 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(37,99,235,.5)]">
              Book Demo +
            </a>
          </div>
        </div>
      </section>

      <section id="solutions" className="scroll-mt-28 px-4 pb-10 pt-4">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.5fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400 sm:text-base">Solutions</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Automation solutions for every business</h2>
            </div>
            <p className="text-sm leading-7 text-slate-400">
              Pasnex.ai is not limited to one industry. Any business that depends on conversations, leads, support, bookings, or follow-ups can use these automation systems.
            </p>
          </div>

          <div className="mt-8 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            {useCases.map(({ Icon, title, text, detail }) => (
              <article
                key={title}
                data-solution-card
                onMouseEnter={() => setHoveredSolution(title)}
                onMouseLeave={() => setHoveredSolution("")}
                onClick={() => {
                  const nextSolution = expandedSolution === title ? "" : title;
                  setExpandedSolution(nextSolution);
                  if (nextSolution) trackCta("solution_card", title.toLowerCase().replaceAll(" ", "_"));
                }}
                className="group cursor-pointer rounded-lg border border-white/10 bg-[#07101d]/85 p-6 shadow-[0_16px_45px_rgba(0,0,0,.2)] transition duration-300 hover:-translate-y-1 hover:border-blue-400/50 hover:bg-white/[0.055]"
              >
                <Icon className="h-9 w-9 text-blue-300 transition group-hover:text-violet-300" />
                <h3 className="mt-5 text-lg font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
                {expandedSolution === title && (
                  <p className="mt-4 rounded-lg border border-violet-300/15 bg-violet-400/10 p-3 text-xs leading-5 text-violet-100">
                    {detail}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      const nextSolution = expandedSolution === title ? "" : title;
                      setExpandedSolution(nextSolution);
                      if (nextSolution) trackCta("solution_learn_more", title.toLowerCase().replaceAll(" ", "_"));
                    }}
                    className="cursor-pointer text-sm font-bold text-blue-200 transition hover:text-white"
                  >
                    {expandedSolution === title ? "Show Less -" : "Learn More +"}
                  </button>
                </div>
                {expandedSolution === title && <AskPasnexCard solution={title} leadFormLink={leadFormLink} />}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto grid w-full max-w-7xl gap-4 rounded-lg border border-white/10 bg-[#07101d]/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,.22)] md:grid-cols-3">
          {[
            { title: "Secure by design", text: "Role-based access, careful data handling, and audit-friendly workflows for growing teams." },
            { title: "Global-ready", text: "Built for businesses serving customers across countries, channels, and time zones." },
            { title: "Human handoff", text: "Let AI handle repeat questions while your team takes over high-value conversations." },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 rounded-lg bg-white/[0.035] p-5">
              <HiOutlineShieldCheck className="h-7 w-7 shrink-0 text-emerald-300" />
              <div>
                <h3 className="font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="px-4 py-10">
        <div className="mx-auto grid w-full max-w-7xl gap-8 rounded-lg border border-white/10 bg-[#07101d]/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,.22)] lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400 sm:text-base">About Pasnex.ai</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">We help businesses turn conversations into growth systems</h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-slate-400">
            <p>
              Pasnex.ai is being built as an AI automation platform for businesses that depend on Instagram, Facebook, WhatsApp, and customer messaging to generate leads and support customers.
            </p>
            <p>
              Our focus is simple: reduce manual replies, capture every serious lead, and help teams respond faster with intelligent workflows that feel practical for real business operations.
            </p>
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {["Social automation", "Lead capture", "AI support"].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 text-center text-sm font-bold text-slate-200">
                  {item}
                </div>
              ))}
            </div>
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

      <section id="pricing" className="px-4 pb-16 pt-8">
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
                <a
                  href={plan.name === "Enterprise" ? leadFormLink : "#contact"}
                  onClick={() => trackCta(plan.name === "Enterprise" ? "talk_to_sales" : "pricing_plan_trial", `pricing_${plan.name.toLowerCase()}`, plan.name === "Enterprise" ? "demo_click" : "pricing_click")}
                  className="mt-7 flex w-full justify-center rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(37,99,235,.24)] transition hover:scale-[1.02]"
                >
                  {plan.cta}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 pt-2">
        <div className="mx-auto w-full max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400 sm:text-base">Questions</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">What businesses ask before starting</h2>
          </div>

          <div className="mt-8 grid gap-4">
            {faqs.map((item) => (
              <article key={item.question} className="rounded-lg border border-white/10 bg-[#07101d]/85 p-6">
                <h3 className="text-lg font-bold text-white">{item.question}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="blog" className="px-4 pb-14 pt-2">
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex flex-col gap-4 text-center sm:items-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400 sm:text-base">Blog</p>
            <h2 className="text-3xl font-black sm:text-4xl">Automation insights for growing teams</h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-400">
              Practical guides for using AI, messaging channels, and automation workflows to capture leads and support customers faster.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { title: "How Instagram automation helps capture more leads", tag: "Social Automation" },
              { title: "WhatsApp workflows every service business should use", tag: "WhatsApp" },
              { title: "What to automate before hiring a support team", tag: "AI Operations" },
            ].map((post) => (
              <article key={post.title} className="group rounded-lg border border-white/10 bg-[#07101d]/85 p-6 shadow-[0_16px_45px_rgba(0,0,0,.2)] transition duration-300 hover:-translate-y-1 hover:border-blue-400/50 hover:bg-white/[0.055]">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-300">{post.tag}</p>
                <h3 className="mt-4 text-xl font-black leading-snug text-white">{post.title}</h3>
                <p className="mt-4 text-sm leading-6 text-slate-400">Coming soon with practical examples, templates, and setup ideas for Pasnex.ai customers.</p>
                <a href={leadFormLink} onClick={() => trackCta("blog_discuss", "blog_card", "demo_click")} className="mt-5 inline-flex text-sm font-bold text-blue-300 transition group-hover:text-white">Discuss this with us +</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="px-4 pb-12 pt-4 sm:pb-20">
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-5 overflow-hidden rounded-lg border border-violet-500/20 bg-gradient-to-r from-violet-700/75 via-blue-700/45 to-[#07101d] px-5 py-6 shadow-[0_20px_70px_rgba(37,99,235,.2)] sm:px-8 md:flex-row md:items-center lg:pr-44">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-56 bg-gradient-to-l from-blue-500/18 via-cyan-400/8 to-transparent" />
          <div className="relative z-10 max-w-xl">
            <h2 className="text-2xl font-black sm:text-3xl">Ready to Automate Your Business?</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-200">Join thousands of businesses already using Pasnex.ai to automate conversations and grow faster.</p>
          </div>
          <div className="relative z-20 hidden items-center gap-3 md:flex lg:-translate-x-12">
            <a href="#pricing" onClick={() => trackCta("start_free_trial", "final_cta", "pricing_click")} className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-7 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(37,99,235,.35)] transition hover:scale-[1.03]">Start 14-Day Free Trial +</a>
            <a href={leadFormLink} onClick={() => trackCta("book_demo", "final_cta", "demo_click")} className="group inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-bold text-white transition duration-300 hover:-translate-y-1 hover:border-blue-300/50 hover:bg-white/[0.1] hover:shadow-[0_0_28px_rgba(96,165,250,.25)]">
              <HiOutlinePlayCircle className="h-5 w-5 text-blue-300 transition group-hover:scale-110 group-hover:text-white" />
              <span>Book a Demo</span>
            </a>
            <a href={whatsappLink} onClick={() => trackCta("whatsapp", "final_cta")} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-sm font-bold text-emerald-200 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/50 hover:bg-emerald-400/15">
              <SiWhatsapp className="h-5 w-5 transition group-hover:scale-110" />
              <span>WhatsApp</span>
            </a>
          </div>
          <div className="relative z-20 grid w-full gap-3 sm:grid-cols-2 md:hidden">
            <a href="#pricing" onClick={() => trackCta("start_free_trial", "mobile_final_cta", "pricing_click")} className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-center text-sm font-bold text-white shadow-[0_0_28px_rgba(37,99,235,.35)]">Start 14-Day Free Trial +</a>
            <a href={whatsappLink} onClick={() => trackCta("whatsapp", "mobile_final_cta")} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-sm font-bold text-emerald-200">
              <SiWhatsapp className="h-5 w-5" />
              <span>WhatsApp</span>
            </a>
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

      <section id="lead-form" className="px-4 pb-12 pt-2 sm:pb-16">
        <div className="mx-auto grid w-full max-w-7xl gap-6 rounded-lg border border-white/10 bg-[#07101d]/85 p-6 shadow-[0_20px_70px_rgba(0,0,0,.24)] lg:grid-cols-[0.85fr_1.15fr] lg:p-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400 sm:text-base">Book your demo</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Tell us what you want to automate</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Share your business details and the Pasnex team will reply with the best automation plan for your channels, leads, and support flow.
            </p>
            <div className="mt-6 grid gap-3 text-sm font-semibold text-slate-300">
              {["Reply within 24 hours", "Instagram, WhatsApp and Messenger workflows", "Free automation consultation"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <HiCheckBadge className="h-5 w-5 text-emerald-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <form action={formSubmitLink} method="POST" onSubmit={() => trackCta("demo_form_submit", "lead_form", "demo_click")} className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <input type="hidden" name="_subject" value="New Pasnex.ai demo request" />
            <input type="hidden" name="_captcha" value="false" />
            <input type="hidden" name="_template" value="table" />
            <input type="hidden" name="_next" value="https://pasnex.com" />
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="name" className="rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400" placeholder="Your name" />
              <input name="business" className="rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400" placeholder="Business name" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="contact" className="rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400" placeholder="Email or WhatsApp" />
              <select name="channel" className="rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400" defaultValue="">
                <option value="" disabled>Main channel</option>
                <option>Instagram</option>
                <option>WhatsApp</option>
                <option>Facebook Messenger</option>
                <option>Multiple channels</option>
              </select>
            </div>
            <textarea name="requirement" rows={4} className="resize-none rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400" placeholder="What do you want to automate?" />
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(37,99,235,.28)] transition hover:scale-[1.02]">
                Send Demo Request
              </button>
              <a href={whatsappLink} onClick={() => trackCta("whatsapp", "contact_form")} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-6 py-3 text-sm font-bold text-emerald-200 transition hover:border-emerald-300/50 hover:bg-emerald-400/15">
                <SiWhatsapp className="h-4 w-4" />
                WhatsApp
              </a>
              <a href={demoLink} onClick={() => trackCta("email_demo", "contact_form", "demo_click")} className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-white transition hover:border-blue-300/50 hover:bg-white/[0.08]">
                Email Directly
              </a>
            </div>
            <a href={phoneLink} onClick={() => trackCta("phone_call", "contact_form")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-6 py-3 text-sm font-bold text-slate-200 transition hover:border-blue-300/50 hover:bg-white/[0.08]">
              <FaPhoneAlt className="h-3.5 w-3.5 text-blue-300" />
              Call +91 8919052808
            </a>
          </form>
        </div>
      </section>


      <footer className="border-t border-white/10 bg-[#050b15] px-4 py-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_0.8fr_1.4fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] via-[#7c3aed] to-[#22d3ee] shadow-[0_0_26px_rgba(37,99,235,.42)]">
                  <span className="relative z-10 text-xl font-black text-white">P</span>
                  <span className="absolute -right-1 top-1 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,.9)]" />
                  <span className="absolute right-1 top-[-3px] h-1.5 w-1.5 rounded-full bg-blue-300" />
                  <span className="absolute right-3 top-2 h-px w-4 rotate-[-28deg] bg-cyan-200/70" />
                </div>
                <p className="text-2xl font-extrabold">Pasnex<span className="text-blue-500">.ai</span></p>
              </div>
              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">AI automation platform that helps businesses automate customer conversations and grow faster.</p>
              <div className="mt-4 grid gap-2 text-sm text-slate-400">
                <a href="mailto:pasnexai@gmail.com" className="transition hover:text-white">pasnexai@gmail.com</a>
                <a href={phoneLink} className="transition hover:text-white">+91 8919052808</a>
              </div>
              <div className="mt-4 flex gap-3 text-slate-400">
                <SiInstagram className="h-4 w-4 transition hover:text-pink-400" />
                <FaFacebookF className="h-4 w-4 transition hover:text-blue-400" />
                <SiWhatsapp className="h-4 w-4 transition hover:text-emerald-400" />
                <SiTelegram className="h-4 w-4 transition hover:text-sky-400" />
              </div>
            </div>

            {[
              { title: "Platform", links: ["Features", "Integrations", "Pricing", "Changelog"] },
              { title: "Solutions", links: ["Multi-Channel Inbox", "Find Real Customers", "Sales Follow-up", "Customer Support"] },
              { title: "Resources", links: ["Blog", "Guides", "Help Center", "API Docs"] },
              { title: "Company", links: ["About Us", "Careers", "Contact Us", "Privacy Policy"] },
            ].map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-bold text-white">{group.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-500">
                  {group.links.map((link) => (
                    <li key={link}><a href={getFooterHref(link)} className="transition hover:text-white">{link}</a></li>
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
              <a href="/terms" className="transition hover:text-white">Terms of Service</a>
              <a href="/privacy" className="transition hover:text-white">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>

    </main>
  );
}
