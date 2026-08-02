"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { HiOutlineArrowLeft, HiOutlineBuildingOffice2, HiOutlineCheckBadge } from "react-icons/hi2";
import { FcGoogle } from "react-icons/fc";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const fieldClass =
  "w-full rounded-lg border border-white/10 bg-[#030712] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15";

const registrationDraftKey = "pasnex_registration_draft";

const getInitialFormState = () => {
  const emptyState = {
    fullName: "",
    businessName: "",
    email: "",
    password: "",
    confirmPassword: "",
    primaryChannel: "",
  };

  if (typeof window === "undefined") {
    return emptyState;
  }

  const savedDraft = window.localStorage.getItem(registrationDraftKey);

  if (!savedDraft) {
    return emptyState;
  }

  try {
    const parsedDraft = JSON.parse(savedDraft) as Partial<typeof emptyState>;
    return {
      ...emptyState,
      ...parsedDraft,
      password: "",
      confirmPassword: "",
    };
  } catch {
    window.localStorage.removeItem(registrationDraftKey);
    return emptyState;
  }
};

export default function RegisterPage() {
  const [formState, setFormState] = useState(getInitialFormState);
  const [status, setStatus] = useState<"idle" | "sending" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [verificationLinkSent, setVerificationLinkSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isGoogleRegistration, setIsGoogleRegistration] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

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

  useEffect(() => {
    const checkVerifiedSession = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token && window.location.search.includes("verified=1")) {
        const isCompletingProfile = window.location.search.includes("completeProfile=1");
        const isGoogleFlow = window.location.search.includes("provider=google");
        setIsGoogleRegistration(isGoogleFlow);
        if (session.user.email) {
          const fullName =
            (typeof session.user.user_metadata.full_name === "string" && session.user.user_metadata.full_name) ||
            (typeof session.user.user_metadata.name === "string" && session.user.user_metadata.name) ||
            "";
          setFormState((current) => ({
            ...current,
            fullName: current.fullName || fullName,
            email: current.email || session.user.email || "",
          }));
        }
        setVerificationLinkSent(false);
        setEmailVerified(true);
        setStatus("idle");
        setMessage(
          isCompletingProfile
            ? isGoogleFlow
              ? "Google verified successfully. Complete your business details to start onboarding."
              : "Your email is verified. Complete your business profile to continue."
            : "Email verified successfully. Set your password and complete registration.",
        );
      }
    };

    void checkVerifiedSession();
  }, []);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const updateField = (field: keyof typeof formState, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }));
    if (field === "email") {
      setVerificationLinkSent(false);
      setEmailVerified(false);
      setResendSeconds(0);
    }
  };

  const sendOtp = async () => {
    setMessage("");

    if (!formState.email) {
      setStatus("error");
      setMessage("Please enter your email first.");
      return;
    }

    if (resendSeconds > 0) {
      setStatus("error");
      setMessage(`Please wait ${resendSeconds}s before resending the code.`);
      return;
    }

    setStatus("sending");
    setVerificationLinkSent(false);
    setMessage("Sending verification link to your email...");
    window.localStorage.setItem(
      registrationDraftKey,
      JSON.stringify({
        fullName: formState.fullName,
        businessName: formState.businessName,
        email: formState.email,
        primaryChannel: formState.primaryChannel,
      }),
    );

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: formState.email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/register?verified=1`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      setStatus("idle");
      setVerificationLinkSent(true);
      setResendSeconds(60);
      setMessage("Verification link sent to your email. Open the email and click the link to continue.");
    } catch (error) {
      setStatus("error");
      const errorMessage = error instanceof Error ? error.message : "Could not send verification code.";
      setMessage(
        errorMessage.toLowerCase().includes("rate limit")
          ? "Email sending limit reached. Please wait a few minutes and try again, or use a different test email."
          : errorMessage,
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setStatus("error");
      setMessage("Please open the verification email and click the link before creating the account.");
      return;
    }

    if (!isGoogleRegistration && formState.password !== formState.confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");

    try {
      if (!isGoogleRegistration) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formState.password,
        });

        if (passwordError) {
          throw new Error(passwordError.message);
        }
      }

      const response = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          fullName: formState.fullName,
          businessName: formState.businessName,
          primaryChannel: formState.primaryChannel,
        }),
      });

      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Registration failed.");
      }

      window.localStorage.removeItem("pasnex_onboarding_complete");
      window.localStorage.removeItem(registrationDraftKey);
      setStatus("success");
      setMessage("Account created. Starting onboarding...");
      window.setTimeout(() => {
        window.location.href = "/onboarding";
      }, 900);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Registration failed.");
    }
  };

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-6xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-lg border border-white/10 bg-[#07101d]/92 shadow-[0_24px_90px_rgba(37,99,235,.24)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="order-1 p-6 sm:p-10 lg:order-2">
            <div className="mx-auto w-full max-w-lg">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-[0_0_35px_rgba(37,99,235,.42)]">
                <HiOutlineBuildingOffice2 className="h-8 w-8 text-white" />
              </div>
              <p className="mt-6 text-sm font-bold uppercase tracking-[0.3em] text-blue-400">First-time registration</p>
              <h1 className="mt-3 text-4xl font-black leading-tight">Create your Pasnex.ai account</h1>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                {isGoogleRegistration
                  ? "Google verified successfully. Tell us your business details so Pasnex.ai can prepare your automation workspace."
                  : "New users register, verify their email, complete onboarding, and enter the Pasnex.ai workspace without waiting for manual approval."}
              </p>

              <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input className={fieldClass} placeholder="Full name" value={formState.fullName} onChange={(event) => updateField("fullName", event.target.value)} required />
                  <input className={fieldClass} placeholder="Business name" value={formState.businessName} onChange={(event) => updateField("businessName", event.target.value)} required />
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input className={fieldClass} type="email" placeholder="Work email" value={formState.email} onChange={(event) => updateField("email", event.target.value)} required />
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={status === "sending" || resendSeconds > 0 || emailVerified}
                    className="rounded-lg border border-blue-400/30 bg-blue-400/10 px-5 py-3 text-sm font-bold text-blue-100 transition hover:border-blue-300/60 hover:bg-blue-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {emailVerified ? "Verified" : status === "sending" ? "Sending..." : resendSeconds > 0 ? `${resendSeconds}s` : "Verify"}
                  </button>
                </div>
                {!isGoogleRegistration && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input className={fieldClass} type="password" placeholder="Password" value={formState.password} onChange={(event) => updateField("password", event.target.value)} minLength={8} required />
                    <input className={fieldClass} type="password" placeholder="Confirm password" value={formState.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} minLength={8} required />
                  </div>
                )}
                <select className={fieldClass} value={formState.primaryChannel} onChange={(event) => updateField("primaryChannel", event.target.value)} required>
                  <option value="" disabled>Primary automation channel</option>
                  <option>Instagram</option>
                  <option>WhatsApp</option>
                  <option>Facebook Messenger</option>
                  <option>Multiple channels</option>
                </select>
                {(message || verificationLinkSent) && (
                  <div className={`rounded-lg border p-3 text-sm leading-6 ${status === "error" ? "border-red-400/25 bg-red-400/10 text-red-100" : emailVerified ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100" : "border-blue-400/25 bg-blue-400/10 text-blue-100"}`}>
                    <p>{message || "Verification link sent to your email."}</p>
                    {verificationLinkSent && (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span className="text-xs text-slate-300">Open the email link. It will bring you back here to finish registration.</span>
                        <button
                          type="button"
                          onClick={sendOtp}
                          disabled={status === "sending" || resendSeconds > 0}
                          className="rounded-lg border border-blue-300/25 bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-blue-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {status === "sending" ? "Resending..." : resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend link"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-center text-sm font-bold text-white shadow-[0_0_30px_rgba(37,99,235,.3)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "loading" ? "Creating account..." : "Register & Start Onboarding"}
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

              <p className="mt-6 text-center text-sm text-slate-400">
                Email already verified?{" "}
                <Link href="/login" className="font-bold text-blue-300 transition hover:text-white">
                  Login
                </Link>
              </p>
              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                Login is enabled after email verification. Onboarding starts on your first verified login.
              </p>
            </div>
          </div>

          <div className="order-2 flex flex-col justify-center bg-gradient-to-br from-[#08111f] via-[#0b1730] to-[#111827] p-6 sm:p-10 lg:order-1 lg:min-h-[680px]">
            <Link href="/" className="mb-12 inline-flex items-center gap-2 text-sm font-semibold text-blue-300 transition hover:text-white">
              <HiOutlineArrowLeft className="h-5 w-5" />
              Back to Pasnex.ai
            </Link>
            <h2 className="text-3xl font-black leading-tight">Built for teams that cannot miss a lead.</h2>
            <div className="mt-8 grid gap-4">
              {[
                "Connect social channels",
                "Build automated reply flows",
                "Capture and qualify leads",
                "Track performance in one dashboard",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <HiOutlineCheckBadge className="h-6 w-6 shrink-0 text-emerald-300" />
                  <span className="text-sm font-semibold text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
