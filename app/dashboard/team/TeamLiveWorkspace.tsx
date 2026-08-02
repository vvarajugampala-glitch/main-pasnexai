"use client";

import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlineEnvelope,
  HiOutlineShieldCheck,
  HiOutlineUser,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Member = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  onboarding_completed: boolean;
  last_login_at: string | null;
  created_at: string;
};

type TeamResponse = {
  members?: Member[];
  currentRole?: string;
  invitesEnabled?: boolean;
};

const roleMeta = {
  owner: { label: "Owner", text: "Full workspace, billing, and settings control.", className: "bg-blue-400/10 text-blue-200" },
  admin: { label: "Admin", text: "Manage channels, automations, team, and reports.", className: "bg-violet-400/10 text-violet-200" },
  agent: { label: "Agent", text: "Handle inbox, contacts, and lead follow-ups.", className: "bg-cyan-400/10 text-cyan-200" },
  viewer: { label: "Viewer", text: "Read-only access for reports and monitoring.", className: "bg-slate-400/10 text-slate-200" },
};

function getRoleMeta(role: string) {
  return roleMeta[role as keyof typeof roleMeta] ?? roleMeta.viewer;
}

function formatDate(value?: string | null) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function TeamLiveWorkspace() {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentRole, setCurrentRole] = useState("viewer");
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");
  const [notice, setNotice] = useState("");

  const loadTeam = async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return null;

    const response = await fetch("/api/dashboard/team", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!response.ok) return null;
    return (await response.json()) as TeamResponse;
  };

  useEffect(() => {
    let mounted = true;

    loadTeam().then((data) => {
      if (!mounted) return;
      setMembers(data?.members ?? []);
      setCurrentRole(data?.currentRole ?? "viewer");
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const counts = useMemo(
    () => ({
      total: members.length,
      active: members.filter((member) => member.status === "approved").length,
      owners: members.filter((member) => member.role === "owner").length,
      agents: members.filter((member) => member.role === "agent" || member.role === "admin").length,
    }),
    [members],
  );

  const prepareInvite = async () => {
    setIsInviting(true);
    setNotice("");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please login again to prepare an invite.");
      }

      const response = await fetch("/api/dashboard/team", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not prepare invite.");
      }

      setInviteEmail("");
      setNotice(result.message ?? "Invite prepared.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not prepare invite.");
    } finally {
      setIsInviting(false);
    }
  };

  const canInvite = currentRole === "owner" || currentRole === "admin";

  return (
    <>
      {isLoading && <p className="mt-5 text-sm text-slate-500">Loading team...</p>}
      {notice && <div className="mt-5 rounded-lg border border-blue-400/20 bg-blue-400/10 p-4 text-sm font-semibold text-blue-100">{notice}</div>}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Members", value: counts.total, Icon: HiOutlineUserGroup },
          { label: "Active", value: counts.active, Icon: HiOutlineCheckBadge },
          { label: "Owners", value: counts.owners, Icon: HiOutlineShieldCheck },
          { label: "Operators", value: counts.agents, Icon: HiOutlineUser },
        ].map(({ label, value, Icon }) => (
          <article key={label} className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <Icon className="h-7 w-7 text-blue-300" />
            <p className="mt-4 text-3xl font-black">{value}</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">{label}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">Team Members</h2>
            <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-200">Business scoped</span>
          </div>
          <div className="mt-5 grid gap-3">
            {members.map((member) => {
              const meta = getRoleMeta(member.role);
              return (
                <article key={member.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-sm font-black">
                      {member.full_name.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-black">{member.full_name}</p>
                      <p className="mt-1 text-sm text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>
                    <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-bold text-slate-300">
                      {member.onboarding_completed ? "Onboarded" : "Pending"}
                    </span>
                    <span className="text-xs text-slate-500">Last login: {formatDate(member.last_login_at)}</span>
                  </div>
                </article>
              );
            })}
            {!isLoading && members.length === 0 && (
              <p className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-400">
                No team members found for this workspace.
              </p>
            )}
          </div>
        </div>

        <aside className="grid gap-5">
          <section className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <div className="flex items-center gap-3">
              <HiOutlineEnvelope className="h-7 w-7 text-blue-300" />
              <h2 className="text-xl font-black">Prepare Invite</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Invite email delivery will be enabled in the production email phase. For now this validates role flow and owner/admin access.
            </p>
            <div className="mt-5 grid gap-3">
              <input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} disabled={!canInvite} className="rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60" placeholder="member@company.com" />
              <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)} disabled={!canInvite} className="rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60">
                <option value="admin">Admin</option>
                <option value="agent">Agent</option>
                <option value="viewer">Viewer</option>
              </select>
              <button onClick={prepareInvite} disabled={!canInvite || isInviting} className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
                {isInviting ? "Preparing..." : "Prepare Invite"}
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
            <h2 className="text-xl font-black">Role Access</h2>
            <div className="mt-5 grid gap-3">
              {Object.entries(roleMeta).map(([role, meta]) => (
                <div key={role} className="rounded-lg bg-white/[0.035] p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{meta.label}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}>{role}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{meta.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-amber-300/15 bg-amber-300/10 p-5">
            <HiOutlineClock className="h-7 w-7 text-amber-200" />
            <h2 className="mt-4 text-lg font-black text-amber-50">Production note</h2>
            <p className="mt-3 text-sm leading-7 text-amber-50">
              Real email invites and permission enforcement will be connected before launch. Current page prepares the team experience and role model.
            </p>
          </section>
        </aside>
      </section>
    </>
  );
}
