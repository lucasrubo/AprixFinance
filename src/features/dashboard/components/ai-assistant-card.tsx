"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Sparkles } from "lucide-react";

const insights = [
  {
    title: "Padrão detectado",
    body: "Gastos com transporte cresceram 18% na última semana.",
    emoji: "💡",
  },
  {
    title: "Sugestão",
    body: "Mova assinaturas recorrentes para um grupo dedicado e monitore em tempo real.",
    emoji: "📊",
  },
];

export function AIAssistantCard() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-indigo-500/15 via-background to-background p-6 shadow-lg shadow-indigo-500/10">
      <div className="absolute inset-0 opacity-40 blur-3xl" />
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-inner">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            Finance AI
          </h3>
          <p className="text-sm text-muted-foreground">
            Insights sob medida
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-6 space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.title}
            className="rounded-2xl border border-white/20 bg-white/50 p-4 text-sm shadow-sm backdrop-blur dark:bg-white/5"
          >
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
              <span>{insight.emoji}</span>
              {insight.title}
            </div>
            <p className="text-sm text-muted-foreground">{insight.body}</p>
          </div>
        ))}
      </div>

      <Link
        href="/dashboard/agent"
        className="relative z-10 mt-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-sidebar-primary px-4 py-3 text-sm font-semibold text-sidebar-primary-foreground transition hover:brightness-110"
      >
        <MessageSquare className="h-4 w-4" />
        Abrir chat inteligente
      </Link>
    </div>
  );
}
