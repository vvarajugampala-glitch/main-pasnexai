"use client";

import { useEffect, useState } from "react";
import { HiOutlineTicket } from "react-icons/hi2";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Ticket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  message: string;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function SupportTicketsPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("setup");
  const [priority, setPriority] = useState("normal");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadTickets = async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return [];

    const response = await fetch("/api/dashboard/support-tickets", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { tickets?: Ticket[] };
    return data.tickets ?? [];
  };

  useEffect(() => {
    let mounted = true;
    loadTickets().then((nextTickets) => {
      if (!mounted) return;
      setTickets(nextTickets);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const createTicket = async () => {
    setIsSaving(true);
    setNotice("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) throw new Error("Please login again.");

      const response = await fetch("/api/dashboard/support-tickets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subject, category, priority, message }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Could not create ticket.");

      setSubject("");
      setMessage("");
      setTickets(await loadTickets());
      setNotice("Support ticket created successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create ticket.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
        <HiOutlineTicket className="h-7 w-7 text-blue-300" />
        <h2 className="mt-4 text-xl font-black">Create Support Ticket</h2>
        <div className="mt-5 grid gap-3">
          <input value={subject} onChange={(event) => setSubject(event.target.value)} className="rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-400" placeholder="Subject" />
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm outline-none focus:border-blue-400">
              <option value="setup">Setup</option>
              <option value="billing">Billing</option>
              <option value="api">API Integration</option>
              <option value="account">Account</option>
            </select>
            <select value={priority} onChange={(event) => setPriority(event.target.value)} className="rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm outline-none focus:border-blue-400">
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} className="resize-none rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-400" placeholder="Describe your issue or request" />
          <button onClick={createTicket} disabled={isSaving} className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
            {isSaving ? "Creating..." : "Create Ticket"}
          </button>
          {notice && <p className="rounded-lg border border-blue-400/20 bg-blue-400/10 p-3 text-sm font-semibold text-blue-100">{notice}</p>}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
        <h2 className="text-xl font-black">Ticket History</h2>
        <div className="mt-5 grid gap-3">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{ticket.subject}</p>
                <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-200">{ticket.status}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{ticket.message}</p>
              <p className="mt-3 text-xs text-slate-500">{ticket.category} - {ticket.priority} - {formatDate(ticket.created_at)}</p>
            </article>
          ))}
          {tickets.length === 0 && <p className="rounded-lg bg-white/[0.035] p-4 text-sm text-slate-500">No support tickets yet.</p>}
        </div>
      </div>
    </section>
  );
}
