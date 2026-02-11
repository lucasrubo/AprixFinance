"use client";

import React from "react";
import { StatCardProps } from "../types";

const accentMap = {
  emerald: {
    icon: "bg-emerald-500/15 text-emerald-600",
    glow: "from-emerald-500/20 via-transparent to-transparent",
    accent: "text-emerald-600",
  },
  rose: {
    icon: "bg-rose-500/15 text-rose-600",
    glow: "from-rose-500/15 via-transparent to-transparent",
    accent: "text-rose-600",
  },
  indigo: {
    icon: "bg-indigo-500/15 text-indigo-600",
    glow: "from-indigo-500/15 via-transparent to-transparent",
    accent: "text-indigo-600",
  },
  slate: {
    icon: "bg-slate-500/15 text-slate-600",
    glow: "from-slate-500/15 via-transparent to-transparent",
    accent: "text-slate-600",
  },
};

export function StatCard({
  title,
  value,
  subtext,
  trend,
  trendValue,
  icon: Icon,
  accent,
}: StatCardProps) {
  const accentStyles = accentMap[accent];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/95 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-border">
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-6 top-4 h-32 rounded-[2rem] bg-gradient-to-br ${accentStyles.glow} blur-3xl`}
      />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <p className="text-3xl font-semibold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{subtext}</p>
        </div>
        <div
          className={`rounded-2xl p-3 text-sm font-medium ${accentStyles.icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && trendValue && (
        <div className="relative z-10 mt-4 flex items-center text-xs font-semibold">
          <span
            className={
              trend === "up"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }
          >
            {trend === "up" ? "▲" : "▼"} {trendValue}
          </span>
          <span className="ml-2 text-muted-foreground">vs. mês anterior</span>
        </div>
      )}
    </div>
  );
}
