"use client";

import React from "react";
import { X, Calendar, Tag, TrendingUp, TrendingDown, User } from "lucide-react";
import { TransactionItemProps } from "@/features/dashboard/types";

interface TransactionModalProps {
  transaction: TransactionItemProps | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionModal({
  transaction,
  isOpen,
  onClose,
}: TransactionModalProps) {
  if (!isOpen || !transaction) return null;

  const isFixedExpense = transaction.itemType === "fixed_expense";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">
              Detalhes {isFixedExpense ? "do Gasto Fixo" : "da Transação"}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  transaction.type === "expense"
                    ? "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                    : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                }`}
              >
                {transaction.type === "expense" ? (
                  <TrendingDown size={24} />
                ) : (
                  <TrendingUp size={24} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-foreground text-lg">
                    {transaction.title}
                  </h4>
                  <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                    {isFixedExpense ? "Gasto Fixo" : "Recibo"}
                  </span>
                </div>
                <p className="text-muted-foreground">{transaction.group}</p>
                {transaction.category && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {transaction.category === "assinatura"
                      ? "📺 Assinatura"
                      : transaction.category === "servico"
                        ? "🔧 Serviço"
                        : "💰 Gasto Fixo"}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {transaction.date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground capitalize">
                  {transaction.type === "expense" ? "Despesa" : "Receita"}
                </span>
              </div>
            </div>

            {transaction.description && (
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                  {transaction.description}
                </p>
              </div>
            )}

            {transaction.created_by && (
              <div className="flex items-center gap-2 pt-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Criado por {transaction.created_by}
                </span>
              </div>
            )}

            {isFixedExpense && transaction.status && (
              <div className="pt-2">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    transaction.status === "ativo"
                      ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                      : transaction.status === "pausado"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                        : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                  }`}
                >
                  {transaction.status === "ativo"
                    ? "✅ Ativo"
                    : transaction.status === "pausado"
                      ? "⏸️ Pausado"
                      : "❌ Cancelado"}
                </span>
              </div>
            )}

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {isFixedExpense ? "Valor da Parcela" : "Valor"}
                </span>
                <span
                  className={`text-2xl font-bold ${
                    transaction.type === "expense"
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {transaction.type === "expense" ? "-" : "+"}
                  {transaction.amount}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              Fechar
            </button>
            <a
              href={
                isFixedExpense
                  ? "/dashboard/fixed-expenses"
                  : "/dashboard/receipts"
              }
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center"
            >
              Ver {isFixedExpense ? "Gastos Fixos" : "Todos"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
