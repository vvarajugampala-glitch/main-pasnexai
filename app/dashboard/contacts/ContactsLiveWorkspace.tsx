"use client";

import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass,
  HiOutlinePhone,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { SiFacebook, SiInstagram, SiMessenger, SiTelegram, SiWhatsapp } from "react-icons/si";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Lead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  status: string;
  score: number;
  interest: string | null;
  next_action: string | null;
  created_at: string;
};

const channelIcon = {
  instagram: SiInstagram,
  whatsapp: SiWhatsapp,
  facebook: SiFacebook,
  messenger: SiMessenger,
  telegram: SiTelegram,
};

const channelStyles = {
  instagram: "bg-gradient-to-br from-yellow-300 via-pink-500 to-violet-600 text-white",
  whatsapp: "bg-[#25D366] text-white",
  facebook: "bg-[#1877F2] text-white",
  messenger: "bg-[#00B2FF] text-white",
  telegram: "bg-[#26A5E4] text-white",
};

function formatSource(source?: string | null) {
  if (!source) return "Workspace";
  return source.charAt(0).toUpperCase() + source.slice(1);
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date));
}

export function ContactsLiveWorkspace() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchLeads = async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return [];
    }

    const response = await fetch("/api/dashboard/leads", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { leads?: Lead[] };
    return data.leads ?? [];
  };

  useEffect(() => {
    let mounted = true;

    fetchLeads().then((nextLeads) => {
      if (mounted) {
        setLeads(nextLeads);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const createSampleLead = async () => {
    setIsCreating(true);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please login again to create a lead.");
      }

      const response = await fetch("/api/dashboard/leads", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not create lead.");
      }

      setMessage("Sample lead created successfully.");
      setLeads(await fetchLeads());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create lead.");
    } finally {
      setIsCreating(false);
    }
  };

  const updateLead = async (leadId: string, action = "qualify") => {
    setIsUpdatingId(leadId);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please login again to update this lead.");
      }

      const response = await fetch("/api/dashboard/leads", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leadId, action }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not update lead.");
      }

      setLeads(await fetchLeads());
      setMessage(action === "convert" ? "Lead marked as converted." : "Lead qualified successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update lead.");
    } finally {
      setIsUpdatingId("");
    }
  };

  const metrics = useMemo(() => {
    const total = leads.length;
    const qualified = leads.filter((lead) => lead.status === "qualified").length;
    const followUps = leads.filter((lead) => lead.status === "follow_up").length;
    const converted = leads.filter((lead) => lead.status === "converted").length;
    return { total, qualified, followUps, converted };
  }, [leads]);

  const visibleLeads = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        !normalizedSearch ||
        `${lead.name} ${lead.email ?? ""} ${lead.phone ?? ""} ${lead.interest ?? ""}`.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  return (
    <>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Leads", metrics.total],
          ["Qualified", metrics.qualified],
          ["Follow-ups", metrics.followUps],
          ["Converted", metrics.converted],
        ].map(([label, value]) => (
          <article key={label} className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black">{value}</p>
            <p className="mt-1 text-xs font-bold text-blue-300">Live CRM data</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-black">Captured Leads</h2>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-white/10 bg-[#030712] py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-blue-400" placeholder="Search leads..." />
              </div>
              <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold">
                <HiOutlineFunnel className="h-5 w-5 text-blue-300" />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="bg-transparent text-sm font-bold outline-none">
                  <option className="bg-[#030712]" value="all">All</option>
                  <option className="bg-[#030712]" value="new">New</option>
                  <option className="bg-[#030712]" value="qualified">Qualified</option>
                  <option className="bg-[#030712]" value="follow_up">Follow-up</option>
                  <option className="bg-[#030712]" value="converted">Converted</option>
                </select>
              </label>
              <button onClick={createSampleLead} disabled={isCreating} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
                <HiOutlineUserGroup className="h-5 w-5" />
                {isCreating ? "Creating..." : "Create Test Lead"}
              </button>
            </div>
          </div>
          {message && (
            <div className="mt-4 rounded-lg border border-blue-400/20 bg-blue-400/10 p-3 text-sm font-semibold text-blue-100">
              {message}
            </div>
          )}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="py-3">Lead</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Interest</th>
                  <th>Next Action</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="py-5 text-slate-400">Loading leads...</td>
                  </tr>
                )}
                {!isLoading && leads.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-5 text-slate-400">No leads yet. Create a test lead or connect a real capture source later.</td>
                  </tr>
                )}
                {!isLoading && leads.length > 0 && visibleLeads.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-5 text-slate-400">No leads match this search or filter.</td>
                  </tr>
                )}
                {visibleLeads.map((lead) => {
                  const source = lead.source ?? "workspace";
                  const Icon = channelIcon[source as keyof typeof channelIcon] ?? HiOutlineUserGroup;
                  const style = channelStyles[source as keyof typeof channelStyles] ?? "bg-blue-500/15 text-blue-300";

                  return (
                    <tr key={lead.id} className="text-slate-300">
                      <td className="py-4 font-bold text-white">{lead.name}</td>
                      <td>
                        <span className="inline-flex items-center gap-2">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${style}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          {formatSource(lead.source)}
                        </span>
                      </td>
                      <td>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${lead.status === "converted" ? "bg-blue-400/10 text-blue-300" : lead.status === "qualified" ? "bg-violet-400/10 text-violet-300" : lead.status === "follow_up" ? "bg-amber-400/10 text-amber-300" : "bg-slate-400/10 text-slate-300"}`}>
                          {formatStatus(lead.status)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="w-8 font-bold text-white">{lead.score}</span>
                          <span className="h-2 w-20 rounded-full bg-white/[0.06]">
                            <span className="block h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500" style={{ width: `${lead.score}%` }} />
                          </span>
                        </div>
                      </td>
                      <td>{lead.interest ?? "Not set"}</td>
                      <td>
                        <button
                          onClick={() => void updateLead(lead.id)}
                          disabled={isUpdatingId === lead.id || lead.status === "qualified" || lead.status === "converted"}
                          className="rounded-full bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-slate-300 transition hover:bg-blue-400/15 hover:text-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdatingId === lead.id ? "Updating..." : lead.next_action ?? "Review"}
                        </button>
                      </td>
                      <td>{formatTime(lead.created_at)}</td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => void updateLead(lead.id)} disabled={isUpdatingId === lead.id || lead.status === "qualified" || lead.status === "converted"} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-blue-300 transition hover:border-blue-300/50 disabled:cursor-not-allowed disabled:opacity-50" title="Qualify lead">
                            <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
                          </button>
                          <button onClick={() => void updateLead(lead.id, "convert")} disabled={isUpdatingId === lead.id || lead.status === "converted"} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-violet-300 transition hover:border-violet-300/50 disabled:cursor-not-allowed disabled:opacity-50" title="Mark converted">
                            <HiOutlinePhone className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="grid gap-5">
          <section className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <h2 className="text-xl font-black">Lead Pipeline</h2>
            <div className="mt-5 grid gap-3">
              {[
                ["New", metrics.total ? `${Math.round((leads.filter((lead) => lead.status === "new").length / metrics.total) * 100)}%` : "0%", "bg-slate-400"],
                ["Qualified", metrics.total ? `${Math.round((metrics.qualified / metrics.total) * 100)}%` : "0%", "bg-violet-400"],
                ["Follow-up", metrics.total ? `${Math.round((metrics.followUps / metrics.total) * 100)}%` : "0%", "bg-amber-400"],
                ["Converted", metrics.total ? `${Math.round((metrics.converted / metrics.total) * 100)}%` : "0%", "bg-blue-400"],
              ].map(([label, width, color]) => (
                <div key={label}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-300">{label}</span>
                    <span className="text-slate-500">{width}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/[0.06]">
                    <div className={`h-full rounded-full ${color}`} style={{ width }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-blue-400/15 bg-blue-400/10 p-5">
            <h2 className="text-lg font-black text-blue-100">Next best action</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              When real capture APIs are connected, Pasnex.ai will score and route leads from prepared channels into this CRM automatically.
            </p>
          </section>
        </aside>
      </section>
    </>
  );
}
