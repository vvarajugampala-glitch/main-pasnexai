"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type GrowthPoint = {
  key: string;
  label: string;
  value: number;
};

function buildPath(points: GrowthPoint[]) {
  const values = points.map((point) => point.value);
  const maxValue = Math.max(...values, 1);
  const stepX = 560 / Math.max(points.length - 1, 1);

  return points
    .map((point, index) => {
      const x = index * stepX;
      const y = 86 - (point.value / maxValue) * 62;
      return `${x},${Number.isFinite(y) ? y : 86}`;
    })
    .join(" ");
}

export function DashboardGrowthOverview() {
  const [points, setPoints] = useState<GrowthPoint[]>([]);

  useEffect(() => {
    async function loadGrowth() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch("/api/dashboard/growth", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) return;

      const data = (await response.json()) as { points?: GrowthPoint[] };
      setPoints(data.points ?? []);
    }

    void loadGrowth();
  }, []);

  const displayPoints = points.length
    ? points
    : Array.from({ length: 7 }, (_, index) => ({ key: String(index), label: "--", value: 0 }));
  const path = useMemo(() => buildPath(displayPoints), [displayPoints]);
  const totalActivity = displayPoints.reduce((sum, point) => sum + point.value, 0);

  return (
    <section className="self-start rounded-lg border border-white/10 bg-[#07101d]/90 p-4 shadow-[0_18px_60px_rgba(0,0,0,.22)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black">Growth Overview</h2>
          <p className="mt-1 text-xs text-slate-500">
            {totalActivity ? `${totalActivity} activity points this week` : "No activity yet this week"}
          </p>
        </div>
        <span className="rounded-lg border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-bold text-blue-100">This week</span>
      </div>
      <div className="mt-4 h-48 rounded-lg border border-white/10 bg-[#030712] p-4">
        <div className="relative grid h-full grid-rows-[1fr_auto] gap-3">
          <div className="absolute inset-0 grid grid-rows-4">
            {[0, 1, 2, 3].map((line) => (
              <span key={line} className="border-t border-white/5" />
            ))}
          </div>
          <svg viewBox="0 0 560 100" className="relative h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="growthFill" x1="0" x2="0" y1="0" y2="1">
                <stop stopColor="#60a5fa" stopOpacity="0.35" />
                <stop offset="1" stopColor="#7c3aed" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="growthLine" x1="0" x2="1" y1="0" y2="0">
                <stop stopColor="#22d3ee" />
                <stop offset="0.55" stopColor="#60a5fa" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <polyline points={`${path} 560,100 0,100`} fill="url(#growthFill)" stroke="none" />
            <polyline points={path} fill="none" stroke="url(#growthLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {path.split(" ").map((point) => {
              const [x, y] = point.split(",");
              return <circle key={point} cx={x} cy={y} r="5" fill="#60a5fa" stroke="#030712" strokeWidth="3" />;
            })}
          </svg>
          <div className="grid grid-cols-7 text-center text-[10px] text-slate-600">
            {displayPoints.map((point) => (
              <span key={point.key}>{point.label}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
