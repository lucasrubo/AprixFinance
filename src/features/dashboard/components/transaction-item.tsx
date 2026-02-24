"use client";
import { Badge } from "@/shared/components/ui/badge";
import { TrendingDown, TrendingUp, User } from "lucide-react";
import type { TransactionItemComponentProps } from "../types";

export function TransactionItem({
  title,
  group,
  date,
  amount,
  type,
  description,
  created_by,
  onClick,
}: TransactionItemComponentProps) {
  const isExpense = type === "expense";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-2xl border border-transparent bg-transparent p-4 text-left transition-colors hover:border-border hover:bg-muted/30"
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold ${
            isExpense
              ? "bg-rose-500/10 text-rose-500"
              : "bg-emerald-500/10 text-emerald-500"
          }`}
        >
          {isExpense ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-foreground">{title}</h4>
            <Badge variant="secondary" className="rounded-full text-[11px]">
              {group}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{date}</p>
          {description && (
            <p className="text-xs text-muted-foreground/80 line-clamp-1">
              {description}
            </p>
          )}
          {created_by && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{created_by}</span>
            </div>
          )}
        </div>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-semibold ${
            isExpense ? "text-rose-500" : "text-emerald-500"
          }`}
        >
          {isExpense ? "-" : "+"}
          {amount}
        </p>
        <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          Ver detalhes
        </span>
      </div>
    </button>
  );
}
