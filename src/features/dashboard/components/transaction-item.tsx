"use client";
import { Badge } from "@/shared/components/ui/badge";
import { TrendingDown, TrendingUp, User } from "lucide-react";
import type { TransactionItemComponentProps } from "../types";

const CURRENCY = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function TransactionItem({
  title,
  group,
  date,
  amount,
  type,
  description,
  created_by,
  parcelas_total,
  parcelas_valor,
  installment_number,
  duracao,
  itemType,
  onClick,
}: TransactionItemComponentProps) {
  const isExpense = type === "expense";
  const isParcelado = (parcelas_total ?? 1) > 1;
  const isFixedExpense = itemType === "fixed_expense";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-2xl border border-transparent bg-transparent p-4 text-left transition-colors hover:border-border hover:bg-muted/30"
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${
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
            {isFixedExpense && duracao && installment_number && (
              <Badge className="rounded-full text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                Parcela {installment_number}/{duracao}
              </Badge>
            )}
            {isFixedExpense && !duracao && (
              <Badge className="rounded-full text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Recorrente
              </Badge>
            )}
            {!isFixedExpense && isParcelado && installment_number && (
              <Badge className="rounded-full text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                Parcela {installment_number}/{parcelas_total}
              </Badge>
            )}
            {!isFixedExpense && isParcelado && !installment_number && (
              <Badge className="rounded-full text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                {parcelas_total}x de {CURRENCY.format(parcelas_valor ?? 0)}
              </Badge>
            )}
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
      <div className="text-right shrink-0">
        <p
          className={`text-sm font-semibold ${
            isExpense ? "text-rose-500" : "text-emerald-500"
          }`}
        >
          {isExpense ? "-" : "+"}
          {amount}
        </p>
        {!isFixedExpense && isParcelado && isExpense && (
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {CURRENCY.format(parcelas_valor ?? 0)}/mês
          </p>
        )}
        <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          Ver detalhes
        </span>
      </div>
    </button>
  );
}
