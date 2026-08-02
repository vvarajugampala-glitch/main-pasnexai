"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { HiCheckBadge, HiOutlineArrowLeft, HiOutlineEnvelope, HiOutlineShieldCheck } from "react-icons/hi2";
import { SiWhatsapp } from "react-icons/si";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const whatsappLink =
  "https://wa.me/918919052808?text=Hi%20Pasnex.ai%2C%20I%20need%20help%20with%20my%20client%20portal%20access.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const sendResetLink = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setMessage("");

    if (!email) {
      setStatus("error");
      setMessage("Please enter your work email.");
      return;
    }

    setStatus("sending");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }

      setStatus("sent");
      setMessage("Password reset link sent. Please check your inbox or spam folder.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not send reset link.");
    }
  };

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-10 text-white">
      <div className="pointer-events-none fixed left-1/2 top-0 h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[145px]" />
      <div className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-xl items-center justify-center">
        <section className="relative w-full overflow-hidden rounded-lg border border-white/10 bg-[#07101d]/92 p-6 text-center shadow-[0_24px_90px_rgba(37,99,235,.24)] sm:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400" />
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 transition hover:text-white">
            <HiOutlineArrowLeft className="h-5 w-5" />
            Back to login
          </Link>
          <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-[0_0_35px_rgba(37,99,235,.42)]">
            <HiOutlineEnvelope className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-black">Reset your password</h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Enter the email linked to your Pasnex.ai account. We will send a secure reset link.
          </p>

          <div className="mt-6 grid gap-3 text-left">
            {[
              "Enter your verified work email.",
              "Open the reset link sent to your inbox.",
              "Create a new password and login again.",
            ].map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-black text-white">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-slate-200">{step}</span>
              </div>
            ))}
          </div>

          <form onSubmit={sendResetLink} className="mt-8 grid gap-4">
            <input className="w-full rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15" type="email" placeholder="Work email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            {message && (
              <div className={`rounded-lg border p-3 text-sm leading-6 ${status === "error" ? "border-red-400/25 bg-red-400/10 text-red-100" : "border-blue-400/25 bg-blue-400/10 text-blue-100"}`}>
                {message}
              </div>
            )}
            <button type="submit" disabled={status === "sending"} className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_30px_rgba(37,99,235,.3)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60">
              {status === "sending" ? "Sending..." : "Send Secure Reset Link"}
            </button>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-center">
              <p className="text-sm text-slate-400">Didn&apos;t receive the link?</p>
              <button type="button" onClick={() => sendResetLink()} disabled={status === "sending"} className="mt-2 text-sm font-bold text-blue-300 transition hover:text-white disabled:opacity-60">
                Resend reset link
              </button>
            </div>
          </form>

          <div className="mt-6 rounded-lg border border-blue-400/15 bg-blue-400/10 p-4 text-left">
            <div className="flex gap-3">
              <HiOutlineShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
              <p className="text-sm leading-6 text-blue-100">
                Reset links are handled by Supabase auth and expire automatically for security.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-400/20 bg-violet-400/10 px-5 py-3 text-sm font-bold text-violet-100 transition hover:-translate-y-1 hover:border-violet-300/50 hover:bg-violet-400/15">
              <SiWhatsapp className="h-5 w-5" />
              WhatsApp Support
            </a>
            <a href="mailto:pasnexai@gmail.com?subject=Pasnex.ai%20Portal%20Access%20Help" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-1 hover:border-blue-300/50">
              <span className="relative inline-flex">
                <HiOutlineEnvelope className="h-5 w-5 text-blue-300" />
                <HiCheckBadge className="absolute -right-2 -top-2 h-4 w-4 text-violet-300" />
              </span>
              Email Support
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
