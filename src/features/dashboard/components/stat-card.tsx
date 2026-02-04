"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { StatCardProps } from "../types";

export function StatCard({
  title,
  value,
  subtext,
  trend,
  trendValue,
  icon: Icon,
  colorClass,
}: StatCardProps) {
  const isTrendingIcon = Icon === TrendingUp || Icon === TrendingDown;

  return (
    <div className="p-6 rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-md bg-card border-border">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-opacity-10 ${colorClass}`}>
          <Icon className={`w-6 h-6 ${colorClass.replace("bg-", "text-")}`} />
        </div>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              trend === "up"
                ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10"
                : "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10"
            }`}
          >
            {trendValue}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium mb-1 text-muted-foreground">
        {title}
      </h3>
      <p
        className={`text-2xl font-bold mb-1 text-foreground ${isTrendingIcon ? colorClass.replace("bg-", "text-") : ""}`}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </div>
  );
}
