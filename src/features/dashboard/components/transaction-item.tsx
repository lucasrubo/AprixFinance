"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { TransactionItemComponentProps } from "../types";

export function TransactionItem({
  title,
  group,
  date,
  amount,
  type,
  description,
  onClick,
}: TransactionItemComponentProps) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl transition-colors cursor-pointer group hover:bg-accent"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            type === "expense"
              ? "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
              : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
          }`}
        >
          {type === "expense" ? (
            <TrendingDown size={18} />
          ) : (
            <TrendingUp size={18} />
          )}
        </div>
        <div>
          <h4 className="font-semibold text-foreground">{title}</h4>
          <div className="flex items-center gap-2 text-xs mt-0.5 text-muted-foreground">
            <span className="px-1.5 py-0.5 rounded font-medium bg-muted text-muted-foreground">
              {group}
            </span>
            <span>•</span>
            <span>{date}</span>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p
          className={`font-bold ${
            type === "expense"
              ? "text-rose-600 dark:text-rose-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {type === "expense" ? "-" : "+"} {amount}
        </p>
        <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground">
          Ver detalhes
        </span>
      </div>
    </div>
  );
}
