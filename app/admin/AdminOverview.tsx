"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineBolt,
  HiOutlineBuildingOffice2,
  HiOutlineChartBar,
  HiOutlineCreditCard,
  HiOutlineBell,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineShieldCheck,
  HiOutlineUserCircle,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { AdminTicketStatusSelect } from "./AdminTicketStatusSelect";

type Business = {
  id: string;
  name: string;
  email: string | null;
  country: string | null;
  status: string;
  plan: string;
  created_at: string;
  health?: {
    apiLive: number;
    apiBlocked: number;
    apiPending: number;
    noteCount: number;
    latestNote: string | null;
    openTickets: number;
    latestAction: string | null;
  };
};

type Profile = {
  id: string;
  business_id: string | null;
  full_name: string;
  email: string;
  role: string;
  status: string;
  onboarding_completed: boolean;
  last_login_at: string | null;
};

type Invoice = {
  id: string;
  business_id: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};

type AdminOverview = {
  admin?: { email: string };
  stats?: {
    businesses: number;
    approvedBusinesses: number;
    pendingBusinesses: number;
    todayRegistrations: number;
    totalUsers: number;
    todayLogins: number;
    active24h: number;
    active7d: number;
    active30d: number;
    onboardingCompleted: number;
    uniqueVisitors: number;
    todayUniqueVisitors: number;
    totalPageViews: number;
    todayPageViews: number;
    registerClicks: number;
    pricingClicks: number;
    demoClicks: number;
    channels: number;
    automations: number;
    leads: number;
    conversations: number;
    revenue: number;
  };
  businesses?: Business[];
  profiles?: Profile[];
  invoices?: Invoice[];
  tickets?: Array<{
    id: string;
    business_id: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
    businesses?: { name: string } | { name: string }[] | null;
  }>;
  auditLogs?: Array<{
    id: string;
    admin_email: string;
    action: string;
    target_type: string;
    target_id: string;
    metadata: Record<string, string | number | boolean | null>;
    created_at: string;
  }>;
  topPages?: Array<{ path: string; views: number }>;
  topCtas?: Array<{ label: string; clicks: number }>;
};

function formatDate(value?: string | null) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatMoney(value = 0, currency = "INR") {
  return `${currency} ${new Intl.NumberFormat("en-US").format(value)}`;
}

function csvCell(value: string | number | null | undefined) {
  const cleanValue = String(value ?? "").replaceAll('"', '""');
  return `"${cleanValue}"`;
}

function getPriorityClass(priority: string) {
  if (priority === "urgent") return "bg-red-400/10 text-red-200";
  if (priority === "high") return "bg-amber-300/10 text-amber-100";
  return "bg-blue-400/10 text-blue-200";
}

function formatAction(action: string) {
  const labels: Record<string, string> = {
    client_status_plan_update: "Client status and plan updated",
    client_status_update: "Client status updated",
    client_plan_update: "Client plan updated",
    client_internal_note_added: "Private note added",
    client_api_setup_updated: "API setup updated",
    support_ticket_status_update: "Support ticket updated",
  };

  return labels[action] ?? action.replaceAll("_", " ");
}

function getActionClass(action: string) {
  if (action.includes("api")) return "border-amber-300/20 bg-amber-300/10 text-amber-50";
  if (action.includes("support")) return "border-blue-300/20 bg-blue-400/10 text-blue-100";
  if (action.includes("note")) return "border-violet-300/20 bg-violet-400/10 text-violet-100";
  return "border-white/10 bg-white/[0.035] text-slate-100";
}

export function AdminOverview() {
  const [data, setData] = useState<AdminOverview>({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [busyBusinessId, setBusyBusinessId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [ticketFilter, setTicketFilter] = useState("open");

  const loadAdmin = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return { error: "Admin login required." };
      }

      const response = await fetch("/api/admin/overview", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = (await response.json()) as AdminOverview & { error?: string };

      if (!response.ok) {
        return { error: result.error ?? "Admin access denied." };
      }

      return { data: result };
  };

  useEffect(() => {
    let mounted = true;

    loadAdmin().then((result) => {
      if (!mounted) return;
      if (result?.error) setError(result.error);
      if (result?.data) setData(result.data);
      setHasMounted(true);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const updateClient = async (businessId: string, payload: { status?: string; plan?: string }) => {
    setBusyBusinessId(businessId);
    setActionMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Admin session expired. Please login again.");
      }

      const response = await fetch("/api/admin/overview", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ businessId, ...payload }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not update client.");
      }

      const nextData = await loadAdmin();
      if (nextData?.error) throw new Error(nextData.error);
      if (nextData?.data) setData(nextData.data);
      setActionMessage("Client updated successfully.");
    } catch (updateError) {
      setActionMessage(updateError instanceof Error ? updateError.message : "Could not update client.");
    } finally {
      setBusyBusinessId("");
    }
  };

  const stats = data.stats ?? {
    businesses: 0,
    approvedBusinesses: 0,
    pendingBusinesses: 0,
    todayRegistrations: 0,
    totalUsers: 0,
    todayLogins: 0,
    active24h: 0,
    active7d: 0,
    active30d: 0,
    onboardingCompleted: 0,
    uniqueVisitors: 0,
    todayUniqueVisitors: 0,
    totalPageViews: 0,
    todayPageViews: 0,
    registerClicks: 0,
    pricingClicks: 0,
    demoClicks: 0,
    channels: 0,
    automations: 0,
    leads: 0,
    conversations: 0,
    revenue: 0,
  };
  const filteredBusinesses = (data.businesses ?? []).filter((business) => {
    const search = clientSearch.trim().toLowerCase();
    const matchesSearch =
      !search ||
      business.name.toLowerCase().includes(search) ||
      (business.email ?? "").toLowerCase().includes(search);
    const matchesStatus = statusFilter === "all" || business.status === statusFilter;
    const matchesPlan = planFilter === "all" || business.plan === planFilter;
    const isUrgent =
      business.status === "pending_approval" ||
      Boolean(business.health?.openTickets) ||
      Boolean(business.health?.apiBlocked);

    return matchesSearch && matchesStatus && matchesPlan && (!urgentOnly || isUrgent);
  });
  const pendingApprovalClients = (data.businesses ?? []).filter((business) => business.status === "pending_approval");
  const apiBlockedClients = (data.businesses ?? []).filter((business) => Boolean(business.health?.apiBlocked));
  const clientsWithoutNotes = (data.businesses ?? []).filter((business) => (business.health?.noteCount ?? 0) === 0);
  const urgentTickets = (data.tickets ?? []).filter((ticket) => ticket.status === "open" || ticket.status === "in_progress");
  const filteredTickets = (data.tickets ?? []).filter((ticket) => ticketFilter === "all" || ticket.status === ticketFilter);
  const ticketCounts = {
    open: (data.tickets ?? []).filter((ticket) => ticket.status === "open").length,
    inProgress: (data.tickets ?? []).filter((ticket) => ticket.status === "in_progress").length,
    resolved: (data.tickets ?? []).filter((ticket) => ticket.status === "resolved").length,
  };
  const actionItems = [
    {
      label: "Pending approvals",
      value: pendingApprovalClients.length,
      detail: pendingApprovalClients[0]?.name ?? "No clients waiting",
      tone: pendingApprovalClients.length ? "border-amber-300/20 bg-amber-300/10 text-amber-50" : "border-blue-300/15 bg-blue-400/10 text-blue-100",
    },
    {
      label: "Open support",
      value: urgentTickets.length,
      detail: urgentTickets[0]?.subject ?? "No open tickets",
      tone: urgentTickets.length ? "border-red-300/20 bg-red-400/10 text-red-100" : "border-blue-300/15 bg-blue-400/10 text-blue-100",
    },
    {
      label: "API blocked",
      value: apiBlockedClients.length,
      detail: apiBlockedClients[0]?.name ?? "No blocked setup",
      tone: apiBlockedClients.length ? "border-red-300/20 bg-red-400/10 text-red-100" : "border-blue-300/15 bg-blue-400/10 text-blue-100",
    },
    {
      label: "Need notes",
      value: clientsWithoutNotes.length,
      detail: clientsWithoutNotes[0]?.name ?? "All clients have notes",
      tone: clientsWithoutNotes.length ? "border-violet-300/20 bg-violet-400/10 text-violet-100" : "border-blue-300/15 bg-blue-400/10 text-blue-100",
    },
  ];
  const pendingInvoices = (data.invoices ?? []).filter((invoice) => invoice.status !== "paid");
  const planRevenue = (data.invoices ?? []).reduce<Record<string, number>>((totals, invoice) => {
    totals[invoice.plan] = (totals[invoice.plan] ?? 0) + Number(invoice.amount ?? 0);
    return totals;
  }, {});
  const planCounts = (data.businesses ?? []).reduce<Record<string, number>>((totals, business) => {
    totals[business.plan] = (totals[business.plan] ?? 0) + 1;
    return totals;
  }, {});
  const billingWatchlist = pendingInvoices.slice(0, 4).map((invoice) => {
    const business = (data.businesses ?? []).find((item) => item.id === invoice.business_id);
    return {
      id: invoice.id,
      businessName: business?.name ?? "Unknown client",
      email: business?.email ?? "No email",
      amount: formatMoney(invoice.amount, invoice.currency),
      status: invoice.status,
      createdAt: invoice.created_at,
    };
  });

  const exportClientsCsv = () => {
    const headers = [
      "Business",
      "Email",
      "Country",
      "Plan",
      "Status",
      "Open tickets",
      "API live",
      "API pending",
      "Notes",
      "Latest action",
      "Latest note",
    ];
    const rows = filteredBusinesses.map((business) => [
      business.name,
      business.email ?? "",
      business.country ?? "",
      business.plan,
      business.status,
      business.health?.openTickets ?? 0,
      business.health?.apiLive ?? 0,
      (business.health?.apiPending ?? 0) + (business.health?.apiBlocked ?? 0),
      business.health?.noteCount ?? 0,
      business.health?.latestAction ? formatAction(business.health.latestAction) : "",
      business.health?.latestNote ?? "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pasnexai-clients-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (error) {
    return (
      <main className="min-h-screen bg-[#030712] px-4 py-8 text-white">
        <div className="mx-auto max-w-2xl rounded-lg border border-red-400/20 bg-red-400/10 p-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-blue-300">
            <HiOutlineArrowLeft className="h-5 w-5" />
            Back to Home
          </Link>
          <h1 className="mt-6 text-3xl font-black">Admin access restricted</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">{error}</p>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            This panel is only for Pasnex platform administrators.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 transition hover:text-white">
              <HiOutlineArrowLeft className="h-5 w-5" />
              Back to Home
            </Link>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Platform Admin</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Pasnex.ai control room</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              Monitor clients, workspace readiness, platform usage, billing signals, and setup status from one admin panel.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/launch-checklist"
              className="rounded-lg border border-blue-300/20 bg-blue-400/10 px-4 py-2.5 text-xs font-bold text-blue-100 transition hover:bg-blue-400/15"
            >
              Launch QA
            </Link>
            <Link
              href="/admin/provider-events"
              className="rounded-lg border border-violet-300/20 bg-violet-400/10 px-4 py-2.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/15"
            >
              Provider Events
            </Link>
            <button
              type="button"
              onClick={() => {
                setUrgentOnly(true);
                scrollToSection("admin-action-center");
              }}
              className="relative rounded-lg border border-white/10 bg-[#07101d] p-2.5 text-slate-300 transition hover:border-blue-300/40 hover:text-white"
              title="Show urgent notifications"
            >
              <HiOutlineBell className="h-5 w-5" />
              {actionItems.some((item) => item.value > 0) && (
                <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {Math.min(actionItems.reduce((sum, item) => sum + item.value, 0), 9)}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setTicketFilter("open");
                scrollToSection("admin-support-tickets");
              }}
              className="relative rounded-lg border border-white/10 bg-[#07101d] p-2.5 text-slate-300 transition hover:border-blue-300/40 hover:text-white"
              title="Open support tickets"
            >
              <HiOutlineEnvelope className="h-5 w-5" />
              {ticketCounts.open > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {Math.min(ticketCounts.open, 9)}
                </span>
              )}
            </button>
            <div className="rounded-lg border border-white/10 bg-[#07101d] px-4 py-3 text-sm">
              <p className="text-slate-500">Signed in as</p>
              <p className="font-bold">{data.admin?.email ?? "Admin"}</p>
            </div>
          </div>
        </header>

        {isLoading && <p className="mt-5 text-sm text-slate-500">Loading admin overview...</p>}
        {actionMessage && <div className="mt-5 rounded-lg border border-blue-400/20 bg-blue-400/10 p-4 text-sm font-semibold text-blue-100">{actionMessage}</div>}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Businesses", value: stats.businesses, sub: `${stats.approvedBusinesses} approved`, Icon: HiOutlineBuildingOffice2 },
            { label: "Pending Review", value: stats.pendingBusinesses, sub: "Need admin attention", Icon: HiOutlineShieldCheck },
            { label: "Automations", value: stats.automations, sub: `${stats.channels} channels`, Icon: HiOutlineBolt },
            { label: "Revenue Signal", value: formatMoney(stats.revenue), sub: "Invoice table", Icon: HiOutlineCreditCard },
          ].map(({ label, value, sub, Icon }) => (
            <article key={label} className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
              <Icon className="h-7 w-7 text-blue-300" />
              <p className="mt-4 text-3xl font-black">{value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-400">{label}</p>
              <p className="mt-2 text-xs text-slate-500">{sub}</p>
            </article>
          ))}
        </section>

        <section id="admin-action-center" className="mt-6 scroll-mt-6 rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-blue-400">Action Center</p>
              <h2 className="mt-2 text-xl font-black">What needs attention today</h2>
            </div>
            <button
              type="button"
              onClick={() => setUrgentOnly((value) => !value)}
              className={`h-10 rounded-lg border px-4 text-xs font-bold transition ${
                urgentOnly
                  ? "border-amber-300/30 bg-amber-300/15 text-amber-100 hover:bg-amber-300/20"
                  : "border-blue-300/20 bg-blue-400/10 text-blue-100 hover:bg-blue-400/15"
              }`}
            >
              {urgentOnly ? "Show all clients" : "Show urgent clients"}
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {actionItems.map((item) => (
              <div key={item.label} className={`rounded-lg border p-4 ${item.tone}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{item.label}</p>
                    <p className="mt-2 line-clamp-1 text-xs opacity-75">{item.detail}</p>
                  </div>
                  <p className="text-3xl font-black">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <div className="flex items-center gap-3">
            <HiOutlineCreditCard className="h-7 w-7 text-amber-300" />
            <div>
              <h2 className="text-xl font-black">Billing Watchlist</h2>
              <p className="mt-1 text-sm text-slate-400">Track plan mix, invoice signals, and clients needing payment follow-up.</p>
            </div>
          </div>
          <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              {["starter", "pro", "business", "enterprise"].map((plan) => (
                <div key={plan} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black capitalize">{plan}</p>
                    <span className="rounded-full bg-blue-400/10 px-2.5 py-1 text-xs font-bold text-blue-200">
                      {planCounts[plan] ?? 0} clients
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-300">{formatMoney(planRevenue[plan] ?? 0)}</p>
                  <p className="mt-1 text-xs text-slate-500">Recorded invoices</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-white/10 bg-[#030712]/45 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black">Payment Follow-ups</p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${pendingInvoices.length ? "bg-amber-300/10 text-amber-100" : "bg-blue-400/10 text-blue-200"}`}>
                  {pendingInvoices.length} pending
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {billingWatchlist.map((item) => (
                  <div key={item.id} className="grid gap-2 rounded-lg bg-white/[0.035] p-3 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <p className="font-bold">{item.businessName}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.email} - {formatDate(item.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 md:justify-end">
                      <span className="text-sm font-black text-slate-200">{item.amount}</span>
                      <span className="rounded-full bg-amber-300/10 px-2.5 py-1 text-xs font-bold text-amber-100">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
                {billingWatchlist.length === 0 && (
                  <p className="rounded-lg bg-white/[0.035] p-4 text-sm text-slate-500">
                    No unpaid invoices in the latest billing records.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <div className="flex items-center gap-3">
            <HiOutlineGlobeAlt className="h-7 w-7 text-cyan-300" />
            <div>
              <h2 className="text-xl font-black">Website Visitors</h2>
              <p className="mt-1 text-sm text-slate-400">Unique visitors, page views, and CTA intent from public website activity.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {[
              ["Unique visitors", stats.uniqueVisitors],
              ["Today unique", stats.todayUniqueVisitors],
              ["Page views", stats.totalPageViews],
              ["Today views", stats.todayPageViews],
              ["Register clicks", stats.registerClicks],
              ["Demo clicks", stats.demoClicks],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <p className="text-2xl font-black">{value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-sm font-black text-slate-200">Top Pages</p>
              <div className="mt-3 grid gap-3">
                {(data.topPages ?? []).map((page) => (
                  <div key={page.path} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                    <p className="truncate text-sm font-bold">{page.path}</p>
                    <p className="mt-2 text-xs text-slate-500">{page.views} views</p>
                  </div>
                ))}
                {(data.topPages ?? []).length === 0 && (
                  <p className="rounded-lg border border-amber-300/15 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
                    Visitor table not created yet or no visits recorded. Run the visitor_events SQL from docs, then refresh the site once.
                  </p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-black text-slate-200">Top CTAs</p>
              <div className="mt-3 grid gap-3">
                {(data.topCtas ?? []).map((cta) => (
                  <div key={cta.label} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4">
                    <p className="truncate text-sm font-bold capitalize">{cta.label.replaceAll("_", " ")}</p>
                    <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-200">{cta.clicks} clicks</span>
                  </div>
                ))}
                {(data.topCtas ?? []).length === 0 && (
                  <p className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-500">
                    CTA clicks will appear after visitors use Register, Demo, Pricing, Login, or WhatsApp buttons.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-blue-300/15 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-cyan-500/10 p-5">
          <div className="flex items-center gap-3">
            <HiOutlineUserCircle className="h-7 w-7 text-blue-300" />
            <div>
              <h2 className="text-xl font-black">User Growth & Login Tracking</h2>
              <p className="mt-1 text-sm text-slate-400">Registered clients and logged-in users from Supabase profile activity.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {[
              ["Total users", stats.totalUsers],
              ["Today registrations", stats.todayRegistrations],
              ["Today logins", stats.todayLogins],
              ["Active 24h", stats.active24h],
              ["Active 7d", stats.active7d],
              ["Active 30d", stats.active30d],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-[#07101d]/80 p-4">
                <p className="text-2xl font-black">{value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-[#07101d]/80 p-4">
              <p className="text-sm font-bold">Onboarding completed</p>
              <p className="mt-2 text-3xl font-black">{stats.onboardingCompleted}</p>
              <p className="mt-1 text-xs text-slate-500">Users who finished first-time setup.</p>
            </div>
            <div className="rounded-lg border border-amber-300/15 bg-amber-300/10 p-4">
              <p className="text-sm font-bold text-amber-50">Visitor tracking note</p>
              <p className="mt-2 text-sm leading-6 text-amber-50">
                Page views increase on refresh. Unique visitors use one saved browser ID, so the same device is counted once.
              </p>
            </div>
          </div>
        </section>

        <section id="client-businesses" className="mt-6 scroll-mt-6 grid min-w-0 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">Client Businesses</h2>
              <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-200">
                {filteredBusinesses.length} shown
              </span>
            </div>
            <div className="mt-5 grid min-w-0 gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
              <input
                value={clientSearch}
                onChange={(event) => setClientSearch(event.target.value)}
                placeholder="Search clients by name or email..."
                className="h-11 rounded-lg border border-white/10 bg-[#030712] px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 hover:border-blue-300/40 focus:border-blue-300/60"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-lg border border-white/10 bg-[#030712] px-3 text-sm font-bold text-slate-100 outline-none transition hover:border-blue-300/40"
              >
                <option value="all">All status</option>
                <option value="pending_approval">Pending</option>
                <option value="approved">Approved</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={planFilter}
                onChange={(event) => setPlanFilter(event.target.value)}
                className="h-11 rounded-lg border border-white/10 bg-[#030712] px-3 text-sm font-bold text-slate-100 outline-none transition hover:border-blue-300/40"
              >
                <option value="all">All plans</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <button
                onClick={() => setUrgentOnly((value) => !value)}
                className={`h-11 rounded-lg border px-4 text-sm font-bold transition ${
                  urgentOnly
                    ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
                    : "border-white/10 bg-white/[0.04] text-slate-200 hover:border-blue-300/40"
                }`}
              >
                Urgent only
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#030712]/45 p-3">
              <p className="text-xs font-semibold text-slate-500">
                Export uses the current search and filters.
              </p>
              <button
                onClick={exportClientsCsv}
                disabled={!hasMounted || filteredBusinesses.length === 0}
                className="h-10 rounded-lg border border-blue-300/20 bg-blue-400/10 px-4 text-xs font-bold text-blue-100 transition hover:bg-blue-400/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              {filteredBusinesses.map((business) => (
                <article key={business.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_260px_auto] 2xl:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black">{business.name}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${business.status === "approved" ? "bg-blue-400/10 text-blue-200" : business.status === "suspended" ? "bg-red-400/10 text-red-200" : "bg-amber-400/10 text-amber-200"}`}>
                          {business.status}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-500">{business.email ?? "No email"} - {business.country ?? "Unknown"}</p>
                      {(business.health?.latestNote || business.health?.latestAction) && (
                        <p className="mt-3 line-clamp-1 text-xs text-slate-500">
                          {business.health.latestNote
                            ? `Note: ${business.health.latestNote}`
                            : `Last action: ${business.health?.latestAction ? formatAction(business.health.latestAction) : ""}`}
                        </p>
                      )}
                    </div>

                    <div className="grid min-w-0 grid-cols-2 gap-2 rounded-lg border border-white/10 bg-[#030712]/50 p-2 text-center sm:grid-cols-4">
                      {[
                        ["Tickets", business.health?.openTickets ?? 0, business.health?.openTickets ? "text-red-200" : "text-blue-200"],
                        ["Live", business.health?.apiLive ?? 0, "text-blue-200"],
                        ["Pending", (business.health?.apiPending ?? 0) + (business.health?.apiBlocked ?? 0), business.health?.apiBlocked ? "text-red-200" : "text-amber-200"],
                        ["Notes", business.health?.noteCount ?? 0, "text-slate-200"],
                      ].map(([label, value, color]) => (
                        <div key={label}>
                          <p className={`text-sm font-black ${color}`}>{value}</p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">{label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-[auto_auto_auto_auto] 2xl:items-center 2xl:justify-end">
                    <Link href={`/admin/business/${business.id}`} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-xs font-bold text-slate-200 transition hover:border-blue-300/50">
                      View
                    </Link>
                    <select
                      value={business.plan}
                      onChange={(event) => void updateClient(business.id, { plan: event.target.value })}
                      disabled={busyBusinessId === business.id}
                      className="min-w-0 rounded-lg border border-white/10 bg-[#030712] px-3 py-2 text-xs font-bold text-slate-200 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="starter">starter</option>
                      <option value="pro">pro</option>
                      <option value="business">business</option>
                      <option value="enterprise">enterprise</option>
                    </select>
                    <button
                      onClick={() => void updateClient(business.id, { status: "approved" })}
                      disabled={busyBusinessId === business.id || business.status === "approved"}
                      className="rounded-lg border border-blue-300/20 bg-blue-400/10 px-3 py-2 text-xs font-bold text-blue-100 transition hover:bg-blue-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => void updateClient(business.id, { status: business.status === "suspended" ? "approved" : "suspended" })}
                      disabled={busyBusinessId === business.id}
                      className="rounded-lg border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-100 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {business.status === "suspended" ? "Reactivate" : "Suspend"}
                    </button>
                  </div>
                  </div>
                </article>
              ))}
              {!isLoading && filteredBusinesses.length === 0 && (
                <p className="rounded-lg bg-white/[0.035] p-4 text-sm text-slate-500">No clients match these filters.</p>
              )}
            </div>
          </div>

          <aside className="grid gap-5">
            <section id="admin-support-tickets" className="scroll-mt-6 rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
              <HiOutlineShieldCheck className="h-7 w-7 text-blue-300" />
              <div className="mt-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black">Support Tickets</h2>
                <span className="rounded-full bg-blue-400/10 px-2.5 py-1 text-xs font-bold text-blue-200">
                  {filteredTickets.length}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-[#030712]/50 p-2 text-center">
                {[
                  ["Open", ticketCounts.open],
                  ["Progress", ticketCounts.inProgress],
                  ["Resolved", ticketCounts.resolved],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-sm font-black text-slate-100">{value}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ["open", "Open"],
                  ["in_progress", "In progress"],
                  ["resolved", "Resolved"],
                  ["all", "All"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setTicketFilter(value)}
                    className={`h-9 rounded-lg border text-xs font-bold transition ${
                      ticketFilter === value
                        ? "border-blue-300/30 bg-blue-400/15 text-blue-100"
                        : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-blue-300/30"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-5 grid gap-3">
                {filteredTickets.slice(0, 5).map((ticket) => {
                  const businessName = Array.isArray(ticket.businesses) ? ticket.businesses[0]?.name : ticket.businesses?.name;
                  return (
                    <Link key={ticket.id} href={`/admin/business/${ticket.business_id}`} className="rounded-lg bg-white/[0.035] p-3 transition hover:bg-white/[0.06]">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold">{ticket.subject}</p>
                        <AdminTicketStatusSelect ticketId={ticket.id} status={ticket.status} onUpdated={() => void loadAdmin().then((result) => result.data && setData(result.data))} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-500">{businessName ?? "Client"}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${getPriorityClass(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase text-slate-300">
                          {ticket.category}
                        </span>
                      </div>
                    </Link>
                  );
                })}
                {filteredTickets.length === 0 && <p className="rounded-lg bg-white/[0.035] p-3 text-sm text-slate-500">No tickets in this view.</p>}
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
              <HiOutlineChartBar className="h-7 w-7 text-blue-300" />
              <h2 className="mt-4 text-xl font-black">Platform Usage</h2>
              <div className="mt-5 grid gap-3 text-sm">
                {[
                  ["Leads", stats.leads],
                  ["Conversations", stats.conversations],
                  ["Channels", stats.channels],
                  ["Automations", stats.automations],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between rounded-lg bg-white/[0.035] p-4">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
              <HiOutlineUserGroup className="h-7 w-7 text-violet-300" />
              <h2 className="mt-4 text-xl font-black">Latest Users</h2>
              <div className="mt-5 grid gap-3">
                {(data.profiles ?? []).slice(0, 6).map((profile) => (
                  <div key={profile.id} className="rounded-lg bg-white/[0.035] p-3">
                    <p className="font-bold">{profile.full_name}</p>
                    <p className="mt-1 text-xs text-slate-500">{profile.email}</p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="rounded-full bg-white/[0.05] px-2 py-1 font-bold text-slate-300">{profile.role}</span>
                      <span className="text-slate-500">{formatDate(profile.last_login_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-amber-300/15 bg-amber-300/10 p-5">
              <HiOutlineGlobeAlt className="h-7 w-7 text-amber-200" />
              <h2 className="mt-4 text-lg font-black text-amber-50">Admin Roadmap</h2>
              <p className="mt-3 text-sm leading-7 text-amber-50">
                Next admin upgrades: client approval actions, suspend/reactivate, support tickets, provider API setup tracker, and audit logs.
              </p>
            </section>
          </aside>
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <HiOutlineShieldCheck className="h-7 w-7 text-blue-300" />
          <h2 className="mt-4 text-xl font-black">Admin Audit Logs</h2>
          <div className="mt-5 grid gap-3">
            {(data.auditLogs ?? []).map((log) => {
              const business = (data.businesses ?? []).find((item) => item.id === log.target_id);
              const targetName = String(
                log.metadata.business_name ?? business?.name ?? `${log.target_type} ${log.target_id.slice(0, 8)}`,
              );
              const targetEmail = String(log.metadata.business_email ?? business?.email ?? "");
              const changedPlan = log.metadata.old_plan && log.metadata.new_plan && log.metadata.old_plan !== log.metadata.new_plan;
              const changedStatus =
                log.metadata.old_status && log.metadata.new_status && log.metadata.old_status !== log.metadata.new_status;

              return (
                <article key={log.id} className={`grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_auto] md:items-center ${getActionClass(log.action)}`}>
                  <div>
                    <p className="font-bold">{formatAction(log.action)}</p>
                    <p className="mt-1 text-sm opacity-75">
                      {log.admin_email} changed {targetName}
                    </p>
                    {targetEmail && (
                      <p className="mt-1 text-xs font-semibold opacity-80">
                        Client email: {targetEmail}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {changedPlan && (
                        <span className="rounded-full bg-blue-400/10 px-2.5 py-1 text-xs font-bold text-blue-200">
                          plan: {String(log.metadata.old_plan)} to {String(log.metadata.new_plan)}
                        </span>
                      )}
                      {changedStatus && (
                        <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-200">
                          status: {String(log.metadata.old_status)} to {String(log.metadata.new_status)}
                        </span>
                      )}
                      {!changedPlan && !changedStatus && (
                        <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs font-bold text-slate-300">
                          target: {targetName}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs opacity-70">{formatDate(log.created_at)}</span>
                </article>
              );
            })}
            {(data.auditLogs ?? []).length === 0 && (
              <p className="rounded-lg bg-white/[0.035] p-4 text-sm text-slate-500">
                No admin audit logs yet. Logs will appear after client or ticket actions.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
