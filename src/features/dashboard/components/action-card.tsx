"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, LucideIcon } from "lucide-react";
import { ActionCardProps } from "../types";

export function ActionCard({
  title,
  description,
  icon: Icon,
  color,
  href,
  onClick,
}: ActionCardProps) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-500/10 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white",
    emerald:
      "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400 dark:group-hover:bg-emerald-600 dark:group-hover:text-white",
    purple:
      "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white dark:bg-purple-500/10 dark:text-purple-400 dark:group-hover:bg-purple-600 dark:group-hover:text-white",
  };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="group text-left w-full p-5 rounded-2xl shadow-sm border hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 bg-card border-border hover:border-border/80"
      >
        <div
          className={`p-4 rounded-xl transition-colors duration-300 ${colorMap[color]}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold transition-colors text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {title}
          </h3>
          <p className="text-xs mt-0.5 text-muted-foreground">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform text-muted-foreground" />
      </button>
    );
  }

  if (!href) {
    return null; // Ou poderia mostrar um erro, mas isso não deveria acontecer
  }

  return (
    <Link href={href}>
      <button className="group text-left w-full p-5 rounded-2xl shadow-sm border hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 bg-card border-border hover:border-border/80">
        <div
          className={`p-4 rounded-xl transition-colors duration-300 ${colorMap[color]}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold transition-colors text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {title}
          </h3>
          <p className="text-xs mt-0.5 text-muted-foreground">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform text-muted-foreground" />
      </button>
    </Link>
  );
}
