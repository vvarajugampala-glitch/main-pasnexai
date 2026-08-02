"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { HiOutlineArrowLeft, HiOutlineLockClosed } from "react-icons/hi2";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const fieldClass =
  "w-full rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"checking" | "idle" | "loading" | "success" | "error">("checking");
  const [message, setMessage] = useState("");
  const [hasResetSession, setHasResetSession] = useState(false);

  useEffect(() => {
    async function prepareResetSession() {
      const supabase = createSupabaseBrowserClient();
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session) {
            setStatus("error");
            setMessage("Reset link could not be verified. Please request a new reset link.");
            return;
          }
        }

        window.history.replaceState({}, "", "/reset-password");
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setStatus("error");
          setMessage("Reset link could not be verified. Please request a new reset link.");
          return;
        }

        window.history.replaceState({}, "", "/reset-password");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setStatus("error");
        setMessage("Reset link expired or auth session is missing. Please request a new reset link.");
        return;
      }

      setHasResetSession(true);
      setStatus("idle");
    }

    prepareResetSession();
  }, []);

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Reset link expired or auth session is missing. Please request a new reset link.");
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw new Error(error.message);
      }

      setStatus("success");
      setMessage("Password updated successfully. Redirecting to login...");
      window.setTimeout(() => {
        window.location.href = "/login";
      }, 1200);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not update password.");
    }
  };

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-md items-center justify-center">
        <section className="w-full rounded-lg border border-white/10 bg-[#07101d]/92 p-6 text-center shadow-[0_24px_90px_rgba(37,99,235,.24)] sm:p-8">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 transition hover:text-white">
            <HiOutlineArrowLeft className="h-5 w-5" />
            Back to login
          </Link>
          <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-[0_0_35px_rgba(37,99,235,.42)]">
            <HiOutlineLockClosed className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-black">Create new password</h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Enter a strong new password for your Pasnex.ai account.
          </p>

          <form onSubmit={updatePassword} className="mt-8 grid gap-4">
            <input className={fieldClass} type="password" placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
            <input className={fieldClass} type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required />
            {message && (
              <div className={`rounded-lg border p-3 text-sm leading-6 ${status === "error" ? "border-red-400/25 bg-red-400/10 text-red-100" : "border-blue-400/25 bg-blue-400/10 text-blue-100"}`}>
                {message}
              </div>
            )}
            <button type="submit" disabled={status === "checking" || status === "loading" || !hasResetSession} className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_30px_rgba(37,99,235,.3)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60">
              {status === "checking" ? "Verifying reset link..." : status === "loading" ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
