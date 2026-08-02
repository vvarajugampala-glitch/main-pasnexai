"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  HiOutlineBell,
  HiOutlineCheckBadge,
  HiOutlineCog6Tooth,
  HiOutlineKey,
  HiOutlineLockClosed,
  HiOutlinePhone,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineWrenchScrewdriver,
} from "react-icons/hi2";
import { SiFacebook, SiInstagram, SiMessenger, SiTelegram, SiWhatsapp } from "react-icons/si";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Channel = {
  id: string;
  type: string;
  display_name: string;
  status: string;
  webhook_status: string | null;
};

type SettingsResponse = {
  profile?: {
    full_name: string;
    email: string;
    role: string;
    status: string;
    onboarding_completed: boolean;
  };
  business?: {
    name: string;
    website: string | null;
    email: string | null;
    phone: string | null;
    country: string | null;
    timezone: string | null;
    status: string;
    plan: string;
  };
  channels?: Channel[];
  security?: {
    emailConfirmed: boolean;
    googleLinked: boolean;
  };
};

const channelIcons = {
  instagram: { Icon: SiInstagram, className: "bg-gradient-to-br from-yellow-300 via-pink-500 to-violet-600 text-white" },
  whatsapp: { Icon: SiWhatsapp, className: "bg-[#25D366] text-white" },
  facebook: { Icon: SiFacebook, className: "bg-[#1877F2] text-white" },
  messenger: { Icon: SiMessenger, className: "bg-[#00B2FF] text-white" },
  telegram: { Icon: SiTelegram, className: "bg-[#26A5E4] text-white" },
};

const pasnexSupport = {
  email: "pasnexai@gmail.com",
  phone: "+91 8919052808",
};

function getChannelIcon(type: string) {
  return channelIcons[type as keyof typeof channelIcons] ?? channelIcons.instagram;
}

export function SettingsLiveWorkspace() {
  const [settings, setSettings] = useState<SettingsResponse>({});
  const [form, setForm] = useState({
    businessName: "",
    website: "",
    supportEmail: "",
    supportPhone: "",
    country: "India",
    timezone: "Asia/Kolkata",
    ownerName: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const loadSettings = async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return null;

    const response = await fetch("/api/dashboard/settings", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!response.ok) return null;

    return (await response.json()) as SettingsResponse;
  };

  useEffect(() => {
    let mounted = true;

    loadSettings().then((data) => {
      if (!mounted) return;
      if (data) {
        setSettings(data);
        setForm({
          businessName: data.business?.name ?? "",
          website: data.business?.website ?? "",
          supportEmail: data.business?.email ?? data.profile?.email ?? "",
          supportPhone: data.business?.phone ?? "",
          country: data.business?.country ?? "India",
          timezone: data.business?.timezone ?? "Asia/Kolkata",
          ownerName: data.profile?.full_name ?? "",
        });
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const preparedChannels = useMemo(
    () => (settings.channels ?? []).filter((channel) => channel.status === "ready_to_connect" || channel.status === "connected"),
    [settings.channels],
  );

  const saveSettings = async () => {
    setIsSaving(true);
    setNotice("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please login again to save settings.");
      }

      const response = await fetch("/api/dashboard/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not save settings.");
      }

      const nextSettings = await loadSettings();
      if (nextSettings) setSettings(nextSettings);
      setNotice("Workspace settings saved successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {isLoading && <p className="mt-5 text-sm text-slate-500">Loading settings...</p>}
      {notice && <div className="mt-5 rounded-lg border border-blue-400/20 bg-blue-400/10 p-4 text-sm font-semibold text-blue-100">{notice}</div>}

      <section className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <div className="flex items-center gap-3">
            <HiOutlineCog6Tooth className="h-7 w-7 text-blue-300" />
            <h2 className="text-xl font-black">Business Profile</h2>
          </div>
          <div className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} className="rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-400" placeholder="Owner name" />
              <input value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} className="rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-400" placeholder="Business name" />
            </div>
            <input value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} className="rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-400" placeholder="Website" />
            <div className="grid gap-4 sm:grid-cols-2">
              <input value={form.supportEmail} onChange={(event) => setForm({ ...form, supportEmail: event.target.value })} className="rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-400" placeholder="Business email" />
              <input value={form.supportPhone} onChange={(event) => setForm({ ...form, supportPhone: event.target.value })} className="rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-400" placeholder="Business phone" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className="rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-400" placeholder="Country" />
              <select value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} className="rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm outline-none focus:border-blue-400">
                <option>Asia/Kolkata</option>
                <option>UTC</option>
                <option>America/New_York</option>
                <option>Europe/London</option>
                <option>Asia/Dubai</option>
                <option>Asia/Singapore</option>
              </select>
            </div>
            <button onClick={saveSettings} disabled={isSaving} className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-bold shadow-[0_0_28px_rgba(37,99,235,.3)] disabled:cursor-not-allowed disabled:opacity-60">
              {isSaving ? "Saving..." : "Save Workspace Settings"}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <div className="flex items-center gap-3">
            <HiOutlineUserGroup className="h-7 w-7 text-blue-300" />
            <h2 className="text-xl font-black">Account & Security</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {[
              ["Owner email", settings.profile?.email ?? "Loading"],
              ["Role", settings.profile?.role ?? "owner"],
              ["Email verification", settings.security?.emailConfirmed ? "Verified" : "Pending"],
              ["Google login", settings.security?.googleLinked ? "Linked" : "Available"],
              ["Onboarding", settings.profile?.onboarding_completed ? "Completed" : "Pending"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="font-bold text-slate-200">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href="/forgot-password" className="rounded-lg border border-white/10 bg-white/[0.04] py-3 text-center text-sm font-bold transition hover:border-blue-300/50">
              Reset Password
            </Link>
            <Link href="/dashboard/channels" className="rounded-lg border border-white/10 bg-white/[0.04] py-3 text-center text-sm font-bold transition hover:border-blue-300/50">
              Manage Channels
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <HiOutlineBell className="h-7 w-7 text-violet-300" />
          <h2 className="mt-4 text-xl font-black">Workspace Preferences</h2>
          <div className="mt-5 grid gap-4">
            {["New lead alerts", "AI reply review", "Daily performance summary", "Billing reminders"].map((item) => (
              <label key={item} className="flex items-center justify-between rounded-lg bg-white/[0.035] p-4 text-sm font-semibold text-slate-300">
                {item}
                <input type="checkbox" defaultChecked className="h-5 w-5 cursor-pointer accent-blue-500" />
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <HiOutlineKey className="h-7 w-7 text-amber-300" />
          <h2 className="mt-4 text-xl font-black">Integration Readiness</h2>
          <div className="mt-5 grid gap-3">
            {(preparedChannels.length ? preparedChannels : [{ id: "empty", type: "instagram", display_name: "No channel prepared", status: "not_started", webhook_status: "api_pending" }]).map((channel) => {
              const meta = getChannelIcon(channel.type);
              const Icon = meta.Icon;
              return (
                <div key={channel.id} className="flex items-center justify-between rounded-lg bg-white/[0.035] p-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.className}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold capitalize">{channel.type}</p>
                      <p className="mt-1 text-xs text-slate-500">{channel.webhook_status ?? "api_pending"}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-200">Prepared</span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 rounded-lg border border-amber-300/15 bg-amber-300/10 p-3 text-xs leading-6 text-amber-50">
            Real Meta, WhatsApp, Messenger, and Telegram APIs start only after provider approval and token setup.
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <HiOutlineShieldCheck className="h-7 w-7 text-blue-300" />
          <h2 className="mt-4 text-xl font-black">Pasnex Support</h2>
          <div className="mt-5 grid gap-3 text-sm">
            {[
              ["Email", pasnexSupport.email],
              ["Phone", pasnexSupport.phone],
              ["Workspace plan", settings.business?.plan ?? "starter"],
              ["Business status", settings.business?.status ?? "approved"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between rounded-lg bg-white/[0.035] p-4">
                <span className="text-slate-400">{label}</span>
                <span className="font-bold text-slate-200">{value}</span>
              </div>
            ))}
          </div>
          <a href={`mailto:${pasnexSupport.email}?subject=Pasnex.ai%20Support%20Request`} className="mt-5 block rounded-lg border border-white/10 bg-white/[0.04] py-3 text-center text-sm font-bold transition hover:border-blue-300/50">
            Contact Pasnex Support
          </a>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-3">
        {[
          { label: "Workspace status", value: "Ready", text: "Core dashboard modules are connected to live workspace data.", Icon: HiOutlineCheckBadge },
          { label: "Privacy mode", value: "Protected", text: "Client data stays scoped to the authenticated business workspace.", Icon: HiOutlineLockClosed },
          { label: "Launch readiness", value: `${preparedChannels.length}/5 channels`, text: "Prepare remaining channels before provider API integration.", Icon: HiOutlinePhone },
        ].map(({ label, value, text, Icon }) => (
          <article key={label} className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <Icon className="h-7 w-7 text-blue-300" />
            <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
            <h2 className="mt-1 text-xl font-black">{value}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-red-400/20 bg-red-400/10 p-5">
        <div className="flex gap-3">
          <HiOutlineWrenchScrewdriver className="h-7 w-7 shrink-0 text-red-300" />
          <div>
            <h2 className="text-xl font-black text-red-100">Protected Admin Actions</h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Workspace deletion, ownership transfer, and production API key changes will stay locked behind admin confirmation before launch.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
