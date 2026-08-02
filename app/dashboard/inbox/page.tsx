import Link from "next/link";
import { DashboardLogoutButton } from "../DashboardLogoutButton";
import { InboxLiveWorkspace } from "./InboxLiveWorkspace";
import {
  HiOutlineArrowLeft,
  HiOutlineSparkles,
} from "react-icons/hi2";

export default function InboxPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 transition hover:text-white">
              <HiOutlineArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Unified Inbox</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Manage every customer conversation</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              Review messages, prepare AI replies, qualify leads, and hand off important conversations to your team.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="#ai-suggested-reply" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-bold shadow-[0_0_28px_rgba(37,99,235,.3)]">
              <HiOutlineSparkles className="h-5 w-5" />
              Train AI Replies
            </a>
            <DashboardLogoutButton />
          </div>
        </header>

        <InboxLiveWorkspace />
      </div>
    </main>
  );
}
