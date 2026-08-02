"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { HiOutlineArrowLeft, HiOutlineLockClosed, HiOutlineSparkles } from "react-icons/hi2";
import { FcGoogle } from "react-icons/fc";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const fieldClass =
  "w-full rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15";
const registrationDraftKey = "pasnex_registration_draft";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "pending">("idle");
  const [message, setMessage] = useState("");

  const handleGoogleLogin = async () => {
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
      setMessage(error instanceof Error ? error.message : "Could not start Google login.");
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error || !data.user) {
        throw new Error(error?.message ?? "Login failed.");
      }

      if (!data.session?.access_token) {
        throw new Error("Login session could not be verified.");
      }

      const profileResponse = await fetch("/api/auth/login-profile", {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      });
      const profileResult = (await profileResponse.json()) as {
        profile?: {
          status: string;
          onboarding_completed: boolean;
        };
        code?: string;
        error?: string;
      };

      if (profileResponse.status === 404 && profileResult.code === "PROFILE_MISSING") {
        window.localStorage.setItem(
          registrationDraftKey,
          JSON.stringify({
            email: data.user.email ?? email.trim().toLowerCase(),
          }),
        );
        window.location.href = "/register?verified=1&completeProfile=1";
        return;
      }

      if (!profileResponse.ok || !profileResult.profile) {
        throw new Error(profileResult.error ?? "Could not load your workspace profile.");
      }

      const profile = profileResult.profile;

      if (profile.status !== "approved") {
        await supabase.auth.signOut();
        setStatus("pending");
        setMessage("Please verify your email first. After verification, login will continue to onboarding automatically.");
        return;
      }

      window.localStorage.setItem("pasnex_onboarding_complete", String(profile.onboarding_completed));
      window.location.href = profile.onboarding_completed ? "/dashboard" : "/onboarding";
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Login failed.");
    }
  };

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-10 text-white">
      <div className="pointer-events-none fixed left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[150px]" />
      <div className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-6xl items-center justify-center">
        <section className="relative grid w-full overflow-hidden rounded-lg border border-white/10 bg-[#07101d]/92 shadow-[0_24px_90px_rgba(37,99,235,.24)] lg:grid-cols-[0.9fr_1.1fr]">
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
              <p className="mt-8 text-sm font-bold uppercase tracking-[0.3em] text-blue-300">Client Portal</p>
              <h1 className="mt-4 max-w-md text-5xl font-black leading-tight">
                Manage automation from one secure workspace.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
                Access dashboards, workflows, leads, channels, support and billing when your Pasnex.ai account is activated.
              </p>
            </div>

            <div className="relative mt-10 grid gap-3 text-sm font-semibold text-slate-300">
              {["Secure team access", "Automation dashboard", "Lead and conversation insights"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <HiOutlineSparkles className="h-5 w-5 text-violet-300" />
                  <span>{item}</span>
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
              <h2 className="mt-6 text-center text-3xl font-black">Welcome back</h2>
              <p className="mt-3 text-center text-sm leading-6 text-slate-400">
                Login is available after first-time registration and email verification.
              </p>

              <form onSubmit={handleLogin} className="mt-8 grid gap-4">
                <input className={fieldClass} type="email" placeholder="Work email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                <input className={fieldClass} type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-400">
                    <input type="checkbox" className="h-4 w-4 rounded border-white/10 bg-[#030712]" />
                    Remember me
                  </label>
                  <Link href="/forgot-password" className="font-semibold text-blue-300 transition hover:text-white">
                    Forgot password?
                  </Link>
                </div>
                {message && (
                  <div className={`rounded-lg border p-3 text-sm leading-6 ${status === "pending" ? "border-amber-400/25 bg-amber-400/10 text-amber-100" : "border-red-400/25 bg-red-400/10 text-red-100"}`}>
                    {message}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-center text-sm font-bold text-white shadow-[0_0_30px_rgba(37,99,235,.3)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "loading" ? "Checking access..." : "Login to Dashboard"}
                </button>
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <span className="h-px flex-1 bg-white/10" />
                  or
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                <button type="button" onClick={handleGoogleLogin} disabled={status === "loading"} className="inline-flex items-center justify-center gap-3 rounded-lg border border-white/10 bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-[0_14px_35px_rgba(0,0,0,.18)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(37,99,235,.18)] disabled:cursor-not-allowed disabled:opacity-70">
                  <FcGoogle className="h-5 w-5" />
                  Continue with Google
                </button>
              </form>

              <div className="mt-6 rounded-lg border border-blue-400/15 bg-blue-400/10 p-4 text-sm leading-6 text-blue-100">
                First-time login opens onboarding. After onboarding is completed, future logins open your dashboard.
              </div>

              <p className="mt-6 text-center text-sm text-slate-400">
                New to Pasnex.ai?{" "}
                <Link href="/register" className="font-bold text-blue-300 transition hover:text-white">
                  Create an account
                </Link>
              </p>
              <p className="mt-3 text-center text-sm text-slate-400">
                Platform admin?{" "}
                <Link href="/admin/login" className="font-bold text-blue-300 transition hover:text-white">
                  Open admin login
                </Link>
              </p>
              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                Need access help? Contact pasnexai@gmail.com or +91 8919052808.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
