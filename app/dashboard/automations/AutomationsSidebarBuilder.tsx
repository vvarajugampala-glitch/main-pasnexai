"use client";

import { HiOutlineBolt, HiOutlineClock, HiOutlineSquares2X2 } from "react-icons/hi2";

export function AutomationsSidebarBuilder() {
  const handleOpenEditor = (trigger?: string) => {
    window.dispatchEvent(
      new CustomEvent("pasnex:open-automation-editor", {
        detail: trigger ? { trigger_type: trigger } : undefined,
      })
    );
  };

  return (
    <aside className="grid gap-5">
      <section className="rounded-lg border border-white/10 bg-[#07101d]/90 p-5">
        <h2 className="text-xl font-black">Configure Flow</h2>
        <div className="mt-5 grid gap-3">
          {[
            { label: "Choose trigger", text: "Configure Instagram Comment or Message trigger", trigger: "comment_received", Icon: HiOutlineBolt },
            { label: "Add actions", text: "Set automated Private DM response & lead rules", trigger: "comment_received", Icon: HiOutlineSquares2X2 },
            { label: "Publish schedule", text: "Activate 24/7 automated Graph API execution", trigger: "comment_received", Icon: HiOutlineClock },
          ].map(({ label, text, trigger, Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleOpenEditor(trigger)}
              className="flex gap-3 text-left w-full rounded-lg border border-white/10 bg-white/[0.035] p-4 transition hover:border-blue-400/50 hover:bg-white/[0.06]"
            >
              <Icon className="h-6 w-6 shrink-0 text-blue-300" />
              <div>
                <p className="font-bold text-white group-hover:text-blue-300">{label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-lg border border-blue-400/20 bg-[#030712] p-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            <span>Live flow status</span>
            <span className="text-emerald-400 font-bold">Active Engine</span>
          </div>
          <div className="mt-4 grid gap-3">
            {[
              "1. Instagram comment with 'price'",
              "2. Meta webhook received",
              "3. Pasnex matches keyword & active automation",
              "4. Graph API dispatches Private DM to commenter",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="flex-1 rounded-lg bg-white/[0.035] px-3 py-2 text-xs font-semibold text-slate-300">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-violet-400/20 bg-violet-400/10 p-5">
        <h2 className="text-lg font-black text-violet-100">Automation tip</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Start with <strong>Instagram Comment to DM</strong> using keyword <code className="text-blue-300">price</code>. This flow generates the highest conversion for product posts and reels.
        </p>
      </section>
    </aside>
  );
}
