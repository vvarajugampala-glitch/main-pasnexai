"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineBolt,
  HiOutlineBuildingOffice2,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCreditCard,
  HiOutlineGlobeAlt,
  HiOutlinePencilSquare,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { SiFacebook, SiInstagram, SiMessenger, SiTelegram, SiWhatsapp } from "react-icons/si";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { AdminTicketStatusSelect } from "../../AdminTicketStatusSelect";

type Business = {
  id: string;
  name: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  timezone: string | null;
  status: string;
  plan: string;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  onboarding_completed: boolean;
  last_login_at: string | null;
};

type Channel = {
  id: string;
  type: string;
  display_name: string;
  handle: string | null;
  status: string;
  webhook_status: string | null;
};

type Automation = {
  id: string;
  name: string;
  trigger_type: string;
  status: string;
  channels: { type: string; display_name: string } | null;
};

type Invoice = {
  id: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  billing_period: string | null;
  created_at: string;
};

type DetailResponse = {
  business?: Business;
  profiles?: Profile[];
  channels?: Channel[];
  automations?: Automation[];
  invoices?: Invoice[];
  tickets?: Array<{
    id: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    message: string;
    created_at: string;
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
  stats?: {
    leads: number;
    conversations: number;
  };
};

type AdminNote = {
  id: string;
  note: string;
  admin_email: string;
  created_at: string;
};

type ApiSetup = {
  id: string;
  provider: string;
  status: string;
  next_step: string | null;
  updated_by: string | null;
  updated_at: string;
};

const channelIcons = {
  instagram: { Icon: SiInstagram, className: "bg-gradient-to-br from-yellow-300 via-pink-500 to-violet-600 text-white" },
  whatsapp: { Icon: SiWhatsapp, className: "bg-[#25D366] text-white" },
  facebook: { Icon: SiFacebook, className: "bg-[#1877F2] text-white" },
  messenger: { Icon: SiMessenger, className: "bg-[#00B2FF] text-white" },
  telegram: { Icon: SiTelegram, className: "bg-[#26A5E4] text-white" },
};

const setupProviders = ["instagram", "whatsapp", "facebook", "messenger", "telegram"];
const setupStatuses = [
  ["pending", "Pending"],
  ["docs_received", "Docs received"],
  ["submitted", "Submitted"],
  ["approved", "Approved"],
  ["live", "Live"],
  ["blocked", "Blocked"],
];

function formatDate(value?: string | null) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatMoney(value: number, currency = "INR") {
  return `${currency} ${new Intl.NumberFormat("en-US").format(value)}`;
}

function addDays(value?: string | null, days = 30) {
  if (!value) return null;
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString();
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

function getChannelMeta(type: string) {
  return channelIcons[type as keyof typeof channelIcons] ?? channelIcons.instagram;
}

export function ClientBusinessDetail({ businessId }: { businessId: string }) {
  const [data, setData] = useState<DetailResponse>({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [noteMessage, setNoteMessage] = useState("");
  const [notesSetupRequired, setNotesSetupRequired] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [apiSetups, setApiSetups] = useState<ApiSetup[]>([]);
  const [apiSetupMessage, setApiSetupMessage] = useState("");
  const [apiSetupRequired, setApiSetupRequired] = useState(false);
  const [busyProvider, setBusyProvider] = useState("");

  const loadDetail = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return { error: "Admin login required." };

    const response = await fetch(`/api/admin/business/${businessId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const result = (await response.json()) as DetailResponse & { error?: string };

    if (!response.ok) return { error: result.error ?? "Could not load client." };
    return { data: result };
  }, [businessId]);

  const loadNotes = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return;

    const response = await fetch(`/api/admin/business/${businessId}/notes`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const result = (await response.json()) as { notes?: AdminNote[]; setupRequired?: boolean; error?: string };

    if (!response.ok) {
      setNoteMessage(result.error ?? "Could not load admin notes.");
      return;
    }

    setNotes(result.notes ?? []);
    setNotesSetupRequired(Boolean(result.setupRequired));
  }, [businessId]);

  const loadApiSetups = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return;

    const response = await fetch(`/api/admin/business/${businessId}/api-setup`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const result = (await response.json()) as { setups?: ApiSetup[]; setupRequired?: boolean; error?: string };

    if (!response.ok) {
      setApiSetupMessage(result.error ?? "Could not load API setup tracker.");
      return;
    }

    setApiSetups(result.setups ?? []);
    setApiSetupRequired(Boolean(result.setupRequired));
  }, [businessId]);

  useEffect(() => {
    let mounted = true;

    loadDetail().then((result) => {
      if (!mounted) return;
      if (result.error) setError(result.error);
      if (result.data) setData(result.data);
      setIsLoading(false);
    });
    void Promise.resolve().then(() => loadNotes());
    void Promise.resolve().then(() => loadApiSetups());

    return () => {
      mounted = false;
    };
  }, [loadApiSetups, loadDetail, loadNotes]);

  const updateClient = async (payload: { status?: string; plan?: string }) => {
    setBusyAction(payload.status ? `status-${payload.status}` : `plan-${payload.plan ?? ""}`);
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

      const nextData = await loadDetail();
      if (nextData.error) throw new Error(nextData.error);
      if (nextData.data) setData(nextData.data);
      setActionMessage("Client updated successfully.");
    } catch (updateError) {
      setActionMessage(updateError instanceof Error ? updateError.message : "Could not update client.");
    } finally {
      setBusyAction("");
    }
  };

  const saveNote = async () => {
    const cleanNote = noteText.trim();
    if (!cleanNote) {
      setNoteMessage("Please enter a note.");
      return;
    }

    setIsSavingNote(true);
    setNoteMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Admin session expired. Please login again.");
      }

      const response = await fetch(`/api/admin/business/${businessId}/notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note: cleanNote }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not save admin note.");
      }

      setNoteText("");
      setNoteMessage("Internal note saved.");
      await loadNotes();
      const nextData = await loadDetail();
      if (nextData.data) setData(nextData.data);
    } catch (noteError) {
      setNoteMessage(noteError instanceof Error ? noteError.message : "Could not save admin note.");
    } finally {
      setIsSavingNote(false);
    }
  };

  const updateApiSetup = async (provider: string, status: string, nextStep: string | null) => {
    setBusyProvider(provider);
    setApiSetupMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Admin session expired. Please login again.");
      }

      const response = await fetch(`/api/admin/business/${businessId}/api-setup`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider, status, nextStep }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not update API setup tracker.");
      }

      setApiSetupMessage(`${provider} setup updated.`);
      await loadApiSetups();
      const nextData = await loadDetail();
      if (nextData.data) setData(nextData.data);
    } catch (setupError) {
      setApiSetupMessage(setupError instanceof Error ? setupError.message : "Could not update API setup tracker.");
    } finally {
      setBusyProvider("");
    }
  };

  const business = data.business;
  const profiles = data.profiles ?? [];
  const channels = data.channels ?? [];
  const automations = data.automations ?? [];
  const invoices = data.invoices ?? [];
  const tickets = data.tickets ?? [];
  const auditLogs = data.auditLogs ?? [];
  const ticketCounts = {
    open: tickets.filter((ticket) => ticket.status === "open").length,
    inProgress: tickets.filter((ticket) => ticket.status === "in_progress").length,
    resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
  };
  const latestInvoice = invoices[0];
  const pendingInvoices = invoices.filter((invoice) => invoice.status !== "paid");
  const invoiceRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0);
  const renewalDate = addDays(latestInvoice?.created_at ?? business?.created_at, 30);
  const billingStatus = pendingInvoices.length > 0 ? "follow-up needed" : latestInvoice ? "current" : "not started";

  if (error) {
    return (
      <main className="min-h-screen bg-[#030712] px-4 py-8 text-white">
        <div className="mx-auto max-w-2xl rounded-lg border border-red-400/20 bg-red-400/10 p-6">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-blue-300">
            <HiOutlineArrowLeft className="h-5 w-5" />
            Back to Admin
          </Link>
          <h1 className="mt-6 text-3xl font-black">Client detail unavailable</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 transition hover:text-white">
              <HiOutlineArrowLeft className="h-5 w-5" />
              Back to Admin
            </Link>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Client Detail</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">{business?.name ?? "Loading client..."}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              Review profile, users, channels, automations, billing signals, and API setup readiness for this client.
            </p>
          </div>
          {business && (
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-400/10 px-3 py-2 text-xs font-bold text-blue-200">{business.plan}</span>
              <span className={`rounded-full px-3 py-2 text-xs font-bold ${business.status === "approved" ? "bg-blue-400/10 text-blue-200" : business.status === "suspended" ? "bg-red-400/10 text-red-200" : "bg-amber-400/10 text-amber-200"}`}>
                {business.status}
              </span>
            </div>
          )}
        </header>

        {isLoading && <p className="mt-5 text-sm text-slate-500">Loading client details...</p>}
        {actionMessage && (
          <div className="mt-5 rounded-lg border border-blue-400/20 bg-blue-400/10 p-4 text-sm font-semibold text-blue-100">
            {actionMessage}
          </div>
        )}

        {business && (
          <section className="mt-6 rounded-lg border border-blue-300/15 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-cyan-500/10 p-5">
            <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="min-w-0">
                <HiOutlineShieldCheck className="h-7 w-7 text-blue-300" />
                <h2 className="mt-4 text-xl font-black">Admin Client Actions</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Change approval status or plan directly from this client workspace. Every action is saved in audit history.
                </p>
              </div>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[180px_auto_auto]">
                <select
                  value={business.plan}
                  onChange={(event) => void updateClient({ plan: event.target.value })}
                  disabled={Boolean(busyAction)}
                  className="h-11 min-w-0 rounded-lg border border-white/10 bg-[#030712] px-3 text-sm font-bold text-slate-100 outline-none transition hover:border-blue-300/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="starter">starter plan</option>
                  <option value="pro">pro plan</option>
                  <option value="business">business plan</option>
                  <option value="enterprise">enterprise plan</option>
                </select>
                <button
                  onClick={() => void updateClient({ status: business.status === "suspended" ? "approved" : "suspended" })}
                  disabled={Boolean(busyAction)}
                  className="h-11 rounded-lg border border-red-300/20 bg-red-400/10 px-4 text-sm font-bold text-red-100 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {business.status === "suspended" ? "Reactivate Client" : "Suspend Client"}
                </button>
                <button
                  onClick={() => void updateClient({ status: "approved" })}
                  disabled={Boolean(busyAction) || business.status === "approved"}
                  className="h-11 rounded-lg border border-blue-300/20 bg-blue-400/10 px-4 text-sm font-bold text-blue-100 transition hover:bg-blue-400/15 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 xl:col-span-1"
                >
                  Approve Client
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Users", value: profiles.length, Icon: HiOutlineUserGroup },
            { label: "Channels", value: channels.length, Icon: HiOutlineGlobeAlt },
            { label: "Automations", value: automations.length, Icon: HiOutlineBolt },
            { label: "Conversations", value: data.stats?.conversations ?? 0, Icon: HiOutlineChatBubbleLeftRight },
          ].map(({ label, value, Icon }) => (
            <article key={label} className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
              <Icon className="h-7 w-7 text-blue-300" />
              <p className="mt-4 text-3xl font-black">{value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-400">{label}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid min-w-0 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <HiOutlineBuildingOffice2 className="h-7 w-7 text-blue-300" />
            <h2 className="mt-4 text-xl font-black">Business Profile</h2>
            <div className="mt-5 grid gap-3 text-sm">
              {[
                ["Email", business?.email ?? "Not set"],
                ["Phone", business?.phone ?? "Not set"],
                ["Website", business?.website ?? "Not set"],
                ["Country", business?.country ?? "Not set"],
                ["Timezone", business?.timezone ?? "Not set"],
                ["Created", formatDate(business?.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between rounded-lg bg-white/[0.035] p-4">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-bold text-slate-200">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <HiOutlineUserGroup className="h-7 w-7 text-violet-300" />
            <h2 className="mt-4 text-xl font-black">Users</h2>
            <div className="mt-5 grid gap-3">
              {profiles.map((profile) => (
                <div key={profile.id} className="grid gap-3 rounded-lg bg-white/[0.035] p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="font-bold">{profile.full_name}</p>
                    <p className="mt-1 text-sm text-slate-500">{profile.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-bold text-slate-300">{profile.role}</span>
                    <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-200">{profile.onboarding_completed ? "Onboarded" : "Pending"}</span>
                    <span className="text-xs text-slate-500">Login: {formatDate(profile.last_login_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid min-w-0 gap-5 xl:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <HiOutlineGlobeAlt className="h-7 w-7 text-cyan-300" />
            <h2 className="mt-4 text-xl font-black">Channels</h2>
            <div className="mt-5 grid gap-3">
              {channels.map((channel) => {
                const meta = getChannelMeta(channel.type);
                const Icon = meta.Icon;
                return (
                  <div key={channel.id} className="flex flex-col gap-3 rounded-lg bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.className}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold capitalize">{channel.type}</p>
                        <p className="text-xs text-slate-500">{channel.webhook_status ?? "api_pending"}</p>
                      </div>
                    </div>
                    <span className="w-fit rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-200">{channel.status}</span>
                  </div>
                );
              })}
              {channels.length === 0 && <p className="rounded-lg bg-white/[0.035] p-4 text-sm text-slate-500">No channels prepared.</p>}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <HiOutlineBolt className="h-7 w-7 text-blue-300" />
            <h2 className="mt-4 text-xl font-black">Automations</h2>
            <div className="mt-5 grid gap-3">
              {automations.map((automation) => (
                <div key={automation.id} className="rounded-lg bg-white/[0.035] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">{automation.name}</p>
                    <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-200">{automation.status}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{automation.channels?.display_name ?? "Workspace"} - {automation.trigger_type}</p>
                </div>
              ))}
              {automations.length === 0 && <p className="rounded-lg bg-white/[0.035] p-4 text-sm text-slate-500">No automations prepared.</p>}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <HiOutlineCreditCard className="h-7 w-7 text-amber-300" />
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Billing Operations</h2>
                <p className="mt-1 text-sm text-slate-500">Plan, renewal, and payment follow-up.</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${pendingInvoices.length ? "bg-amber-300/10 text-amber-100" : "bg-blue-400/10 text-blue-200"}`}>
                {billingStatus}
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Current plan", business?.plan ?? "Not set"],
                ["Renewal estimate", formatDate(renewalDate)],
                ["Pending invoices", pendingInvoices.length],
                ["Invoice value", formatMoney(invoiceRevenue, latestInvoice?.currency ?? "INR")],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <p className="text-xs font-semibold text-slate-500">{label}</p>
                  <p className="mt-2 text-sm font-black text-slate-100">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3">
              {invoices.slice(0, 4).map((invoice) => (
                <div key={invoice.id} className="rounded-lg bg-white/[0.035] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">{formatMoney(invoice.amount, invoice.currency)}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${invoice.status === "paid" ? "bg-blue-400/10 text-blue-200" : "bg-amber-300/10 text-amber-100"}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{invoice.plan} - {invoice.billing_period ?? formatDate(invoice.created_at)}</p>
                </div>
              ))}
              {invoices.length === 0 && (
                <p className="rounded-lg bg-white/[0.035] p-4 text-sm leading-6 text-slate-500">
                  No invoices yet. Add a private note for payment follow-up until payment gateway integration is ready.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-blue-300/15 bg-blue-400/10">
                <HiOutlineChatBubbleLeftRight className="h-6 w-6 text-blue-300" />
              </span>
              <div>
                <h2 className="text-xl font-black">Support Tickets</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">Client-specific requests and team follow-up status.</p>
              </div>
            </div>
            <div className="grid w-full grid-cols-3 gap-2 rounded-lg border border-white/10 bg-[#030712]/60 p-3 text-center sm:w-[280px]">
              {[
                ["Open", ticketCounts.open],
                ["Progress", ticketCounts.inProgress],
                ["Resolved", ticketCounts.resolved],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-white/[0.025] px-2 py-2">
                  <p className="text-base font-black text-slate-100">{value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">{ticket.subject}</p>
                  <AdminTicketStatusSelect ticketId={ticket.id} status={ticket.status} onUpdated={() => void loadDetail().then((result) => result.data && setData(result.data))} />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{ticket.message}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${getPriorityClass(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase text-slate-300">
                    {ticket.category}
                  </span>
                  <span className="text-xs text-slate-500">{formatDate(ticket.created_at)}</span>
                </div>
              </article>
            ))}
            {tickets.length === 0 && <p className="rounded-lg bg-white/[0.035] p-4 text-sm text-slate-500 md:col-span-2">No support tickets for this client.</p>}
          </div>
        </section>


        <section className="mt-6 rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <HiOutlineShieldCheck className="h-7 w-7 text-amber-200" />
          <h2 className="mt-4 text-xl font-black">Provider API Setup Tracker</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Track real provider approval stages before a channel is marked production-ready. This avoids false promises while keeping setup work moving.
          </p>
          {apiSetupMessage && (
            <p className="mt-4 rounded-lg border border-blue-400/20 bg-blue-400/10 p-3 text-sm font-semibold text-blue-100">
              {apiSetupMessage}
            </p>
          )}
          {apiSetupRequired && (
            <p className="mt-4 rounded-lg border border-amber-300/15 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50">
              API setup tracker table is not created yet. Run the SQL setup once in Supabase, then refresh this page.
            </p>
          )}
          <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-5">
            {setupProviders.map((provider) => {
              const setup = apiSetups.find((item) => item.provider === provider);
              const status = setup?.status ?? "pending";
              const meta = getChannelMeta(provider);
              const Icon = meta.Icon;
              const isLive = status === "live";
              const isBlocked = status === "blocked";

              return (
                <article key={provider} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${meta.className}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-black capitalize">{provider}</p>
                      <p className={`text-xs font-bold ${isLive ? "text-blue-200" : isBlocked ? "text-red-200" : "text-amber-200"}`}>
                        {status.replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>
                  <select
                    value={status}
                    onChange={(event) => void updateApiSetup(provider, event.target.value, setup?.next_step ?? null)}
                    disabled={apiSetupRequired || busyProvider === provider}
                    className="mt-4 h-10 w-full rounded-lg border border-white/10 bg-[#030712] px-3 text-xs font-bold text-slate-100 outline-none transition hover:border-blue-300/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {setupStatuses.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    defaultValue={setup?.next_step ?? ""}
                    onBlur={(event) => {
                      const nextStep = event.target.value.trim();
                      if (nextStep !== (setup?.next_step ?? "")) {
                        void updateApiSetup(provider, status, nextStep || null);
                      }
                    }}
                    disabled={apiSetupRequired || busyProvider === provider}
                    placeholder="Next step"
                    className="mt-3 h-10 w-full rounded-lg border border-white/10 bg-[#030712] px-3 text-xs text-slate-100 outline-none transition placeholder:text-slate-600 hover:border-blue-300/40 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <p className="mt-3 text-[11px] leading-5 text-slate-500">
                    Updated {formatDate(setup?.updated_at)}{setup?.updated_by ? ` by ${setup.updated_by}` : ""}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <HiOutlinePencilSquare className="h-7 w-7 text-violet-300" />
          <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="text-xl font-black">Private Admin Notes</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Internal notes for Pasnex.ai team only. Clients cannot see these notes.
              </p>
              <div className="mt-5 grid gap-3">
                <textarea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  rows={5}
                  placeholder="Add a private note about API setup, payment, demo call, or client requirement..."
                  className="resize-none rounded-lg border border-white/10 bg-[#030712] p-4 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 hover:border-blue-300/30 focus:border-blue-300/60"
                />
                <button
                  onClick={() => void saveNote()}
                  disabled={isSavingNote || notesSetupRequired}
                  className="h-11 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingNote ? "Saving Note..." : "Save Private Note"}
                </button>
                {noteMessage && (
                  <p className="rounded-lg border border-blue-400/20 bg-blue-400/10 p-3 text-sm font-semibold text-blue-100">
                    {noteMessage}
                  </p>
                )}
                {notesSetupRequired && (
                  <p className="rounded-lg border border-amber-300/15 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50">
                    Admin notes table is not created yet. Run the SQL setup once in Supabase, then refresh this page.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-3">
              {notes.map((note) => (
                <article key={note.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-sm leading-6 text-slate-200">{note.note}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span>{note.admin_email}</span>
                    <span>{formatDate(note.created_at)}</span>
                  </div>
                </article>
              ))}
              {!notesSetupRequired && notes.length === 0 && (
                <p className="rounded-lg bg-white/[0.035] p-4 text-sm text-slate-500">
                  No private admin notes yet.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <HiOutlineShieldCheck className="h-7 w-7 text-blue-300" />
          <h2 className="mt-4 text-xl font-black">Admin Activity History</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Track every admin-side status, plan, and support action connected to this client.
          </p>
          <div className="mt-5 grid gap-3">
            {auditLogs.map((log) => {
              const changedPlan = log.metadata.old_plan && log.metadata.new_plan && log.metadata.old_plan !== log.metadata.new_plan;
              const changedStatus =
                log.metadata.old_status && log.metadata.new_status && log.metadata.old_status !== log.metadata.new_status;

              return (
                <article key={log.id} className={`grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_auto] md:items-center ${getActionClass(log.action)}`}>
                  <div>
                    <p className="font-bold">{formatAction(log.action)}</p>
                    <p className="mt-1 text-sm opacity-75">{log.admin_email} updated this client</p>
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
                          {log.target_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs opacity-70">{formatDate(log.created_at)}</span>
                </article>
              );
            })}
            {auditLogs.length === 0 && (
              <p className="rounded-lg bg-white/[0.035] p-4 text-sm text-slate-500">
                No admin activity recorded for this client yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
