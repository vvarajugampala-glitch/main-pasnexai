import Link from "next/link";
import { DashboardLogoutButton } from "../DashboardLogoutButton";
import { AnalyticsLiveWorkspace } from "./AnalyticsLiveWorkspace";
import { HiOutlineArrowLeft } from "react-icons/hi2";

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 transition hover:text-white">
              <HiOutlineArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Analytics</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Measure automation performance</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              Track real message volume, lead quality, response readiness, channel coverage, and automation performance from your workspace data.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button disabled className="cursor-not-allowed rounded-lg border border-blue-300/20 bg-blue-400/10 px-5 py-3 text-sm font-bold text-blue-100 opacity-80">
              Last 7 days
            </button>
            <DashboardLogoutButton />
          </div>
        </header>

        <AnalyticsLiveWorkspace />
      </div>
    </main>
  );
}
