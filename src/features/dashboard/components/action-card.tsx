"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ActionCardProps } from "../types";
import { cn } from "@/shared/lib/utils";

const accentMap = {
  blue: {
    glow: "from-sky-500/10 via-transparent to-transparent",
    icon: "bg-sky-500/10 text-sky-600",
  },
  emerald: {
    glow: "from-emerald-500/10 via-transparent to-transparent",
    icon: "bg-emerald-500/10 text-emerald-600",
  },
  purple: {
    glow: "from-violet-500/10 via-transparent to-transparent",
    icon: "bg-violet-500/10 text-violet-600",
  },
};

export function ActionCard({
  title,
  description,
  icon: Icon,
  color,
  href,
  onClick,
}: ActionCardProps) {
  const accent = accentMap[color];

  const content = (
    <div className="group relative flex w-full items-center gap-4 overflow-hidden rounded-3xl border border-border/70 bg-card/90 p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-border">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          accent.glow,
        )}
      />
      <div
        className={cn(
          "relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl",
          accent.icon,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="relative z-10 flex flex-col">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="relative z-10 ml-auto h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full">
        {content}
      </button>
    );
  }

  if (!href) return null;

  return (
    <Link href={href} className="w-full">
      {content}
    </Link>
  );
}
