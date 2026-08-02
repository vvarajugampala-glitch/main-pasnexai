"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HiOutlineArrowLeft, HiOutlineBolt, HiOutlineShieldCheck } from "react-icons/hi2";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProviderEvent = {
  id: string;
  provider: string;
  event_type: string;
  provider_account_id: string | null;
  signature_verified: boolean;
  processed_at: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ProviderEventsViewer() {
  const [events, setEvents] = useState<ProviderEvent[]>([]);
  const [setupRequired, setSetupRequired] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadInitialEvents = async () => {
      setIsLoading(true);
      setError("");

      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Admin login required.");
        }

        const response = await fetch("/api/admin/provider-events", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const result = (await response.json()) as { events?: ProviderEvent[]; setupRequired?: boolean; error?: string };

        if (!response.ok) {
          throw new Error(result.error ?? "Could not load provider events.");
        }

        if (!mounted) return;
        setEvents(result.events ?? []);
        setSetupRequired(Boolean(result.setupRequired));
      } catch (eventError) {
        if (!mounted) return;
        setError(eventError instanceof Error ? eventError.message : "Could not load provider events.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadInitialEvents();

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 transition hover:text-white">
              <HiOutlineArrowLeft className="h-5 w-5" />
              Back to Admin
            </Link>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Provider Events</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Webhook event monitor</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              Confirm real Meta, Instagram, Messenger, and WhatsApp webhooks are reaching Pasnex.ai during provider testing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-bold shadow-[0_0_28px_rgba(37,99,235,.3)]"
          >
            Refresh Events
          </button>
        </header>

        {isLoading && <p className="mt-5 text-sm text-slate-500">Loading provider events...</p>}
        {error && <p className="mt-5 rounded-lg border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</p>}
        {setupRequired && (
          <div className="mt-5 rounded-lg border border-amber-300/15 bg-amber-300/10 p-4 text-sm leading-7 text-amber-50">
            Run <span className="font-bold">docs/supabase-provider-webhook-events.sql</span> in Supabase SQL editor, then refresh this page.
          </div>
        )}

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Total events", events.length],
            ["Signature verified", events.filter((event) => event.signature_verified).length],
            ["Unprocessed", events.filter((event) => !event.processed_at).length],
          ].map(([label, value]) => (
            <article key={String(label)} className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
              <HiOutlineBolt className="h-7 w-7 text-blue-300" />
              <p className="mt-4 text-3xl font-black">{value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-400">{label}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <HiOutlineShieldCheck className="h-7 w-7 text-blue-300" />
          <h2 className="mt-4 text-xl font-black">Latest webhook payloads</h2>
          <div className="mt-5 grid gap-3">
            {events.map((event) => (
              <article key={event.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black capitalize">{event.provider} - {event.event_type}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {event.provider_account_id ?? "No provider account id"} - {formatDate(event.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${event.signature_verified ? "bg-blue-400/10 text-blue-200" : "bg-amber-300/10 text-amber-100"}`}>
                      {event.signature_verified ? "signature verified" : "signature not configured"}
                    </span>
                    <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-bold text-slate-300">
                      {event.processed_at ? "processed" : "raw stored"}
                    </span>
                  </div>
                </div>
                <pre className="mt-4 max-h-56 overflow-auto rounded-lg border border-white/10 bg-[#030712] p-3 text-xs leading-5 text-slate-300">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </article>
            ))}
            {!isLoading && !setupRequired && events.length === 0 && (
              <p className="rounded-lg bg-white/[0.035] p-4 text-sm text-slate-500">
                No provider webhook events yet. After Meta sends a test event, it will appear here.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
