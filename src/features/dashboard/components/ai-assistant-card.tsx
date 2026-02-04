"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Sparkles } from "lucide-react";

export function AIAssistantCard() {
  return (
    <div className="rounded-2xl shadow-sm border p-6 flex flex-col h-full relative overflow-hidden transition-colors bg-card border-border">
      {/* Background Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 bg-indigo-500/5 dark:bg-indigo-500/10"></div>

      <div className="flex items-center gap-2 mb-6 relative z-10">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <Sparkles className="text-white w-4 h-4" />
        </div>
        <h3 className="font-bold text-lg text-foreground">AI Assistant</h3>
      </div>

      <div className="space-y-4 flex-1 relative z-10">
        <div className="p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-default bg-card border-border">
          <div className="flex gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-xs font-bold uppercase mb-1 text-indigo-600 dark:text-indigo-400">
                Insight
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Mantenha seus recibos organizados. A IA detectou um padrão de
                gastos em transporte.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-default bg-card border-border">
          <div className="flex gap-3">
            <span className="text-xl">📊</span>
            <div>
              <p className="text-xs font-bold uppercase mb-1 text-emerald-600 dark:text-emerald-400">
                Análise
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Use grupos para compartilhar despesas familiares e economizar
                até 15%.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Link href="/ai-chat">
        <button className="mt-6 w-full font-medium py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20">
          <MessageSquare size={18} />
          Chat com IA
        </button>
      </Link>
    </div>
  );
}
