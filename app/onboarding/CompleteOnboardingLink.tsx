"use client";

import Link from "next/link";

export default function CompleteOnboardingLink() {
  return (
    <Link
      href="/dashboard"
      onClick={() => {
        window.localStorage.setItem("pasnex_onboarding_complete", "true");
      }}
      className="mt-6 flex w-full justify-center rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-bold"
    >
      Complete Onboarding & Go to Dashboard
    </Link>
  );
}
