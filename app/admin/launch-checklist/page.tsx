import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineBolt,
  HiOutlineCheckCircle,
  HiOutlineCreditCard,
  HiOutlineGlobeAlt,
  HiOutlineShieldCheck,
  HiOutlineUserCircle,
} from "react-icons/hi2";

const sections = [
  {
    title: "Core Website",
    Icon: HiOutlineGlobeAlt,
    items: [
      ["Landing page", "ready", "Hero, features, pricing, contact, and trust sections prepared."],
      ["Lead forms", "ready", "FormSubmit and WhatsApp/demo paths are prepared."],
      ["Legal pages", "ready", "Privacy, terms, and thank-you pages are available."],
      ["Final domain launch", "pending", "Keep coming-soon live until auth/dashboard QA is finished."],
    ],
  },
  {
    title: "Authentication",
    Icon: HiOutlineUserCircle,
    items: [
      ["Email registration", "ready", "Email verification flow is working."],
      ["Google login", "ready", "Google first-login onboarding path is prepared."],
      ["Forgot password", "ready", "Reset link flow is working with Pasnex sender setup."],
      ["Role enforcement", "review", "Owner/admin role UX exists; hard permission enforcement needs final pass before launch."],
    ],
  },
  {
    title: "Client Workspace",
    Icon: HiOutlineBolt,
    items: [
      ["Onboarding", "ready", "Step-by-step channel and automation preparation is active."],
      ["Dashboard overview", "ready", "Stats, growth, quick actions, channel summary, and activity are prepared."],
      ["Inbox", "ready", "Sample conversations, AI reply preparation, and lead actions are working."],
      ["Team invites", "pending", "Role UI exists; real email invite delivery is pending."],
    ],
  },
  {
    title: "Admin Operations",
    Icon: HiOutlineShieldCheck,
    items: [
      ["Admin access", "ready", "Platform admin restriction is active."],
      ["Client management", "ready", "Approve, suspend, plan change, detail pages, notes, and audit logs are active."],
      ["API setup tracker", "ready", "Provider setup stages are tracked per client."],
      ["Support workflow", "ready", "Tickets, status updates, priority/category badges, and filters are available."],
    ],
  },
  {
    title: "Provider Approval",
    Icon: HiOutlineShieldCheck,
    actions: [
      ["Open Provider Events", "/admin/provider-events"],
      ["View Clients", "/admin#client-businesses"],
    ],
    items: [
      ["Approval pack", "ready", "Meta/WhatsApp approval pack is documented in docs/META-WHATSAPP-APPROVAL-PACK.md."],
      ["Webhook monitor", "ready", "Admin can test inbound webhooks, recipient mapping, and outbound attempt logs."],
      ["Meta app review", "pending", "Submit production app permissions after domain, privacy, and test flow are ready."],
      ["WhatsApp business setup", "pending", "Business Manager, WABA, phone number, and display name approval are pending."],
    ],
  },
  {
    title: "Billing",
    Icon: HiOutlineCreditCard,
    items: [
      ["Plans", "ready", "Starter, pro, business, and enterprise plans are represented."],
      ["Billing watchlist", "ready", "Admin can see plan mix and pending invoice signals."],
      ["Payment gateway", "pending", "Razorpay/Stripe integration should be connected before paid launch."],
      ["Invoice automation", "pending", "Manual/admin tracking exists; automated invoice generation is pending."],
    ],
  },
];

const statusClass = {
  ready: "border-blue-300/20 bg-blue-400/10 text-blue-100",
  pending: "border-amber-300/20 bg-amber-300/10 text-amber-50",
  review: "border-violet-300/20 bg-violet-400/10 text-violet-100",
};

const launchBlockers = [
  "Connect real provider APIs after Meta/WhatsApp/Facebook approvals.",
  "Connect payment gateway before accepting paid subscriptions.",
  "Run full mobile QA on landing, auth, onboarding, dashboard, and admin.",
  "Prepare production environment variables for final domain.",
  "Create final backup before production deployment.",
];

export default function LaunchChecklistPage() {
  const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);
  const readyItems = sections.reduce((sum, section) => sum + section.items.filter((item) => item[1] === "ready").length, 0);
  const readiness = Math.round((readyItems / totalItems) * 100);

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-7xl">
        <header className="border-b border-white/10 pb-5">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 transition hover:text-white">
            <HiOutlineArrowLeft className="h-5 w-5" />
            Back to Admin
          </Link>
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Launch QA</p>
          <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-black sm:text-4xl">Pasnex.ai pre-launch checklist</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                Track product readiness, launch blockers, and final work needed before replacing the coming-soon website.
              </p>
            </div>
            <div className="rounded-lg border border-blue-300/20 bg-blue-400/10 p-5 text-right">
              <p className="text-4xl font-black text-blue-100">{readiness}%</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-blue-200">Current readiness</p>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["Ready", readyItems],
            ["Needs work", totalItems - readyItems],
            ["Total checks", totalItems],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
              <p className="text-3xl font-black">{value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-400">{label}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          {sections.map(({ title, Icon, items, actions }) => (
            <article key={title} className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
              <Icon className="h-7 w-7 text-blue-300" />
              <h2 className="mt-4 text-xl font-black">{title}</h2>
              <div className="mt-5 grid gap-3">
                {items.map(([label, status, detail]) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-bold">{label}</p>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${statusClass[status as keyof typeof statusClass]}`}>
                        {status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>
              {actions && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {actions.map(([label, href]) => (
                    <Link
                      key={href}
                      href={href}
                      className="rounded-lg border border-blue-300/20 bg-blue-400/10 px-4 py-3 text-center text-sm font-bold text-blue-100 transition hover:bg-blue-400/15"
                    >
                      {label}
                    </Link>
                  ))}
                  <p className="rounded-lg border border-white/10 bg-[#030712]/60 p-3 text-xs leading-5 text-slate-400 sm:col-span-2">
                    Approval pack: docs/META-WHATSAPP-APPROVAL-PACK.md
                  </p>
                </div>
              )}
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
          <HiOutlineCheckCircle className="h-7 w-7 text-amber-100" />
          <h2 className="mt-4 text-xl font-black text-amber-50">Final Launch Blockers</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {launchBlockers.map((item) => (
              <div key={item} className="rounded-lg border border-amber-300/15 bg-[#030712]/40 p-4 text-sm leading-6 text-amber-50">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
