import Link from "next/link";
import { DashboardLogoutButton } from "../DashboardLogoutButton";
import { SettingsLiveWorkspace } from "./SettingsLiveWorkspace";
import { HiOutlineArrowLeft } from "react-icons/hi2";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 transition hover:text-white">
              <HiOutlineArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Settings</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Workspace settings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              Manage business profile, account security, notification preferences, support details, and integration readiness.
            </p>
          </div>
          <DashboardLogoutButton />
        </header>

        <SettingsLiveWorkspace />
      </div>
    </main>
  );
}
