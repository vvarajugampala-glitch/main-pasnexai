"use client";

import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineCheckBadge,
  HiOutlineCreditCard,
  HiOutlineDocumentText,
  HiOutlineReceiptPercent,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Invoice = {
  id: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  billing_period: string | null;
  invoice_url: string | null;
  created_at: string;
};

type BillingResponse = {
  business: { name: string; plan: string; status: string; created_at: string } | null;
  invoices: Invoice[];
};

type Stats = {
  messages: number;
  activeAutomations: number;
  leads: number;
  connectedChannels: number;
};

const plans = [
  { name: "starter", label: "Starter", price: "INR 1,499", accounts: "3 social accounts", messages: "10,000 messages/month", audience: "Small businesses" },
  { name: "pro", label: "Pro", price: "INR 2,999", accounts: "10 social accounts", messages: "50,000 messages/month", audience: "Growing teams" },
  { name: "business", label: "Business", price: "INR 5,999", accounts: "25 social accounts", messages: "100,000 messages/month", audience: "Established brands" },
  { name: "enterprise", label: "Enterprise", price: "Custom", accounts: "Unlimited accounts", messages: "Unlimited messages", audience: "Large organizations" },
];

function formatMoney(amount: number, currency = "INR") {
  return `${currency} ${new Intl.NumberFormat("en-US").format(amount)}`;
}

function planLabel(plan?: string) {
  return plans.find((item) => item.name === plan)?.label ?? "Starter";
}

function usagePercent(value: number, max: number) {
  if (!max) return 0;
  return Math.min(100, Math.round((value / max) * 100));
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(typeof value === "string" ? new Date(value) : value);
}

function getNextRenewalDate(createdAt?: string) {
  const baseDate = createdAt ? new Date(createdAt) : new Date();
  const renewalDate = new Date();
  renewalDate.setDate(baseDate.getDate());

  if (renewalDate <= new Date()) {
    renewalDate.setMonth(renewalDate.getMonth() + 1);
  }

  return formatDate(renewalDate);
}

export function BillingLiveWorkspace() {
  const [billing, setBilling] = useState<BillingResponse>({ business: null, invoices: [] });
  const [stats, setStats] = useState<Stats>({ messages: 0, activeAutomations: 0, leads: 0, connectedChannels: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadBilling() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const headers = { Authorization: `Bearer ${session.access_token}` };
      const [billingResponse, statsResponse] = await Promise.all([
        fetch("/api/dashboard/billing", { headers }),
        fetch("/api/dashboard/stats", { headers }),
      ]);

      if (!mounted) return;

      if (billingResponse.ok) {
        setBilling((await billingResponse.json()) as BillingResponse);
      }
      if (statsResponse.ok) {
        setStats((await statsResponse.json()) as Stats);
      }
      setIsLoading(false);
    }

    void loadBilling();

    return () => {
      mounted = false;
    };
  }, []);

  const currentPlan = billing.business?.plan ?? "starter";
  const currentPlanData = plans.find((plan) => plan.name === currentPlan) ?? plans[0];
  const renewalDate = getNextRenewalDate(billing.business?.created_at);
  const usage = useMemo(
    () => [
      ["Messages used", `${stats.messages} / 10,000`, `${usagePercent(stats.messages, 10000)}%`],
      ["Prepared channels", `${stats.connectedChannels} / 5`, `${usagePercent(stats.connectedChannels, 5)}%`],
      ["Active automations", `${stats.activeAutomations} / 25`, `${usagePercent(stats.activeAutomations, 25)}%`],
      ["Captured leads", `${stats.leads} / 500`, `${usagePercent(stats.leads, 500)}%`],
    ],
    [stats],
  );

  const invoices = billing.invoices.length
    ? billing.invoices
    : [
        {
          id: "preview",
          plan: currentPlan,
          amount: currentPlan === "starter" ? 1499 : currentPlan === "pro" ? 2999 : 5999,
          currency: "INR",
          status: "upcoming",
          billing_period: "Preview",
          invoice_url: null,
          created_at: new Date().toISOString(),
        },
      ];

  return (
    <>
      {isLoading && <p className="mt-5 text-sm text-slate-500">Loading billing...</p>}

      <section className="mt-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-400/10">
                <HiOutlineCreditCard className="h-7 w-7 text-blue-300" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Current Plan</p>
                <h2 className="text-2xl font-black">{currentPlanData.label} Plan</h2>
              </div>
            </div>
            <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-200">{billing.business?.status ?? "Active"}</span>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-400">
          Your billing workspace is prepared for subscription tracking. Next renewal is scheduled for {renewalDate}.
          </p>
          <div className="mt-5 grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm">
            {[
              ["Workspace", billing.business?.name ?? "Pasnex.ai Workspace"],
              ["Billing cycle", "Monthly"],
              ["Renewal date", renewalDate],
              ["Payment mode", "Manual invoice"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500">{label}</span>
                <span className="font-bold text-slate-200">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3">
            {usage.map(([label, value, width]) => (
              <div key={label}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-300">{label}</span>
                  <span className="text-slate-500">{value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500" style={{ width }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <h2 className="text-xl font-black">Upgrade Options</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <article key={plan.name} className={`rounded-lg border p-4 ${plan.name === currentPlan ? "border-blue-400/50 bg-blue-400/10" : "border-white/10 bg-white/[0.035]"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">{plan.label}</h3>
                  {plan.name === currentPlan && <span className="rounded-full bg-blue-400/10 px-2 py-1 text-[10px] font-bold text-blue-200">Current</span>}
                </div>
                <p className="mt-3 text-2xl font-black">{plan.price}</p>
                <p className="text-sm text-slate-500">/month</p>
                <p className="mt-2 text-xs font-semibold text-slate-500">{plan.audience}</p>
                <div className="mt-5 grid gap-2 text-sm text-slate-300">
                  {[plan.accounts, plan.messages, "AI automations", "Priority support"].map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <HiOutlineCheckBadge className="h-4 w-4 text-blue-300" />
                      {feature}
                    </div>
                  ))}
                </div>
                {plan.name === currentPlan ? (
                  <button disabled className="mt-5 w-full cursor-not-allowed rounded-lg border border-blue-300/20 bg-blue-400/10 py-2.5 text-sm font-bold text-blue-100 opacity-80">
                    Current Plan
                  </button>
                ) : (
                  <a
                    href={`mailto:pasnexai@gmail.com?subject=${encodeURIComponent(`Pasnex.ai ${plan.label} plan request`)}&body=${encodeURIComponent(`Hi Pasnex.ai, I want to ${plan.name === "enterprise" ? "talk to sales about" : "request"} the ${plan.label} plan for my workspace.`)}`}
                    className="mt-5 block w-full rounded-lg border border-white/10 bg-white/[0.04] py-2.5 text-center text-sm font-bold transition hover:border-blue-300/50"
                  >
                    {plan.name === "enterprise" ? "Talk to Sales" : "Request Upgrade"}
                  </a>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <h2 className="text-xl font-black">Invoice History</h2>
          <div className="mt-5 grid gap-3">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-center">
                <div className="flex items-center gap-3">
                  <HiOutlineDocumentText className="h-5 w-5 text-blue-300" />
                  <span className="font-bold">{invoice.id === "preview" ? "Next invoice preview" : invoice.id.slice(0, 8)}</span>
                </div>
                <span className="text-sm text-slate-400">{planLabel(invoice.plan)} Plan</span>
                <span className="font-bold">{formatMoney(invoice.amount, invoice.currency)}</span>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${invoice.status === "paid" ? "bg-blue-400/10 text-blue-300" : "bg-amber-400/10 text-amber-300"}`}>{invoice.status}</span>
                  <a
                    href={invoice.invoice_url ?? `mailto:pasnexai@gmail.com?subject=${encodeURIComponent("Pasnex.ai invoice request")}`}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-300 transition hover:border-blue-300/50"
                  >
                    {invoice.invoice_url ? "View" : "Pending"}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="grid gap-5">
          <section className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <h2 className="text-xl font-black">Payment Method</h2>
            <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-400/10">
                  <HiOutlineReceiptPercent className="h-6 w-6 text-blue-300" />
                </span>
                <div>
                  <p className="font-bold">Manual billing</p>
                  <p className="text-xs text-slate-500">UPI / bank transfer supported</p>
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Razorpay or Stripe can be connected later for automatic payments. Current billing is kept manual for early client onboarding.
              </p>
              <a href="mailto:pasnexai@gmail.com?subject=Pasnex.ai%20Invoice%20Request" className="mt-4 block w-full rounded-lg border border-white/10 bg-white/[0.04] py-2.5 text-center text-sm font-bold transition hover:border-blue-300/50">
                Request invoice
              </a>
            </div>
          </section>

          <section className="rounded-lg border border-violet-400/20 bg-violet-400/10 p-5">
            <HiOutlineSparkles className="h-7 w-7 text-violet-300" />
            <h2 className="mt-4 text-lg font-black text-violet-100">Billing support</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              For plan changes, invoices, or enterprise billing, contact pasnexai@gmail.com or +91 8919052808.
            </p>
          </section>
        </aside>
      </section>
    </>
  );
}
