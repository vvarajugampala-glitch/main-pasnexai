"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineBellAlert,
  HiOutlineChartBar,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { FcGoogle } from "react-icons/fc";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const fieldClass =
  "w-full rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15";

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleGoogleAdminLogin = async () => {
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/admin`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not start Google admin login.");
    }
  };

  const handleAdminLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error || !data.session?.access_token) {
        throw new Error(error?.message ?? "Admin login failed.");
      }

      const response = await fetch("/api/admin/session", {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        await supabase.auth.signOut();
        throw new Error(result.error ?? "Platform admin access required.");
      }

      window.location.href = "/admin";
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not login as admin.");
    }
  };

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-10 text-white">
      <div className="pointer-events-none fixed left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[150px]" />
      <div className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-6xl items-center justify-center">
        <section className="relative grid w-full overflow-hidden rounded-lg border border-white/10 bg-[#07101d]/92 shadow-[0_24px_90px_rgba(37,99,235,.24)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#07101d] via-[#0b1730] to-[#111827] p-10 lg:block">
            <div className="absolute right-[-120px] top-[-120px] h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />
            <div className="absolute bottom-[-80px] left-[-80px] h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
            <Link href="/" className="relative inline-flex items-center gap-2 text-sm font-semibold text-blue-300 transition hover:text-white">
              <HiOutlineArrowLeft className="h-5 w-5" />
              Back to Pasnex.ai
            </Link>

            <div className="relative mt-24">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563eb] via-[#7c3aed] to-[#22d3ee] text-2xl font-black shadow-[0_0_34px_rgba(37,99,235,.45)]">
                P
              </div>
              <p className="mt-8 text-sm font-bold uppercase tracking-[0.3em] text-blue-300">Platform Admin</p>
              <h1 className="mt-4 max-w-md text-5xl font-black leading-tight">
                Control clients, launch readiness, and support from one secure room.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
                Admin access is restricted to approved Pasnex.ai operators. Client accounts should use the normal login portal.
              </p>
            </div>

            <div className="relative mt-10 grid gap-3 text-sm font-semibold text-slate-300">
              {[
                { label: "Client approvals and plans", Icon: HiOutlineShieldCheck },
                { label: "Support tickets and notifications", Icon: HiOutlineBellAlert },
                { label: "Platform usage and launch QA", Icon: HiOutlineChartBar },
              ].map(({ label, Icon }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-violet-300" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 transition hover:text-white lg:hidden">
              <HiOutlineArrowLeft className="h-5 w-5" />
              Back to Pasnex.ai
            </Link>

            <div className="mx-auto mt-8 w-full max-w-md lg:mt-0">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-[0_0_35px_rgba(37,99,235,.42)]">
                <HiOutlineLockClosed className="h-8 w-8 text-white" />
              </div>
              <h2 className="mt-6 text-center text-3xl font-black">Admin login</h2>
              <p className="mt-3 text-center text-sm leading-6 text-slate-400">
                Sign in with the Pasnex.ai platform admin account.
              </p>
              {searchParams.get("error") === "admin_access_required" && (
                <div className="mt-5 rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-sm leading-6 text-red-100">
                  This Google account is not allowed for platform admin access. Please use an authorized platform admin account.
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="mt-8 grid gap-4">
                <input className={fieldClass} type="email" placeholder="Admin email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                <input className={fieldClass} type="password" placeholder="Admin password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                {message && (
                  <div className="rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-sm leading-6 text-red-100">
                    {message}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-center text-sm font-bold text-white shadow-[0_0_30px_rgba(37,99,235,.3)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "loading" ? "Verifying admin..." : "Login to Admin Panel"}
                </button>
              </form>

              <div className="mt-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span className="h-px flex-1 bg-white/10" />
                or
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <button
                type="button"
                onClick={handleGoogleAdminLogin}
                disabled={status === "loading"}
                className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-[0_14px_35px_rgba(0,0,0,.18)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(37,99,235,.18)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <FcGoogle className="h-5 w-5" />
                Continue with Google Admin
              </button>

              <div className="mt-6 rounded-lg border border-amber-300/15 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
                Only platform admin emails can enter this panel. Other users are signed out automatically.
              </div>

              <p className="mt-6 text-center text-sm text-slate-400">
                Client workspace?{" "}
                <Link href="/login" className="font-bold text-blue-300 transition hover:text-white">
                  Use client login
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginContent />
    </Suspense>
  );
}
