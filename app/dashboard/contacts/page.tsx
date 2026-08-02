import Link from "next/link";
import { DashboardLogoutButton } from "../DashboardLogoutButton";
import { ContactsLiveWorkspace } from "./ContactsLiveWorkspace";
import {
  HiOutlineArrowLeft,
  HiOutlineUserGroup,
} from "react-icons/hi2";

export default function ContactsPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 transition hover:text-white">
              <HiOutlineArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Contacts</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Lead and contact management</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              Track captured leads, source channels, status, score, and next action from one workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button disabled className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-blue-300/20 bg-blue-400/10 px-5 py-3 text-sm font-bold text-blue-100 opacity-80 shadow-[0_0_28px_rgba(37,99,235,.18)]" title="CSV lead import will be enabled in the import phase.">
              <HiOutlineUserGroup className="h-5 w-5" />
              Import Leads Soon
            </button>
            <DashboardLogoutButton />
          </div>
        </header>

        <ContactsLiveWorkspace />
      </div>
    </main>
  );
}
