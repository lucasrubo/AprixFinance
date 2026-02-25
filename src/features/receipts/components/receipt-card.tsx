"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import type { Receipt } from "@/shared/types";
import type { ReactNode } from "react";
import {
  Banknote,
  Calendar,
  CreditCard,
  Edit,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";

interface ReceiptCardProps {
  receipt: Receipt & { groups?: { nome: string } | null };
  onEdit?: (receipt: Receipt) => void;
  onDelete?: (receiptId: string) => void;
}

const CURRENCY = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatDate(dateString: string) {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function formatCurrency(amount: number) {
  return CURRENCY.format(amount);
}

const PAYMENT_INFO: Record<
  string,
  { label: string; icon: ReactNode; color: string }
> = {
  debito: {
    label: "Débito",
    icon: <CreditCard className="h-3 w-3" />,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  credito: {
    label: "Crédito",
    icon: <CreditCard className="h-3 w-3" />,
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
  dinheiro: {
    label: "Dinheiro",
    icon: <Banknote className="h-3 w-3" />,
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  pix: {
    label: "PIX",
    icon: <Zap className="h-3 w-3" />,
    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  },
};

export function ReceiptCard({ receipt, onEdit, onDelete }: ReceiptCardProps) {
  const isEntrada = receipt.tipo === "entrada";
  const payment = receipt.categoria_pagamento
    ? PAYMENT_INFO[receipt.categoria_pagamento]
    : null;

  return (
    <Card
      className={
        "relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
      }
    >
      {/* Barra lateral colorida indicando tipo */}
      <div
        className={`absolute left-0 top-0 h-full w-1 ${isEntrada ? "bg-emerald-500" : "bg-rose-500"}`}
      />

      <CardHeader className="pl-5 pb-2 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className="font-semibold text-sm leading-tight truncate"
              title={receipt.titulo}
            >
              {receipt.titulo}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>{formatDate(receipt.data)}</span>
            </div>
          </div>

          <Badge
            className={`shrink-0 text-xs ${
              isEntrada
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
            }`}
          >
            {isEntrada ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {isEntrada ? "Entrada" : "Saída"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pl-5 space-y-3 pb-4">
        {/* Valor destacado */}
        <p
          className={`text-xl font-bold tabular-nums ${
            isEntrada
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {isEntrada ? "+" : "-"}
          {formatCurrency(receipt.valor)}
        </p>

        {/* Badges de metadados */}
        {(payment || receipt.groups || (receipt.parcelas_total ?? 1) > 1) && (
          <div className="flex flex-wrap gap-1.5">
            {payment && (
              <Badge
                variant="secondary"
                className={`text-xs gap-1 ${payment.color}`}
              >
                {payment.icon}
                {payment.label}
              </Badge>
            )}
            {(receipt.parcelas_total ?? 1) > 1 && (
              <Badge
                variant="secondary"
                className="text-xs gap-1 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
              >
                {receipt.parcelas_total}x de {formatCurrency(receipt.parcelas_valor ?? receipt.valor / (receipt.parcelas_total ?? 1))}
              </Badge>
            )}
            {receipt.groups && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Users className="h-3 w-3" />
                {receipt.groups.nome}
              </Badge>
            )}
          </div>
        )}

        {/* Descrição */}
        {receipt.descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {receipt.descricao}
          </p>
        )}

        {/* Criado por */}
        {receipt.created_by && (
          <>
            <Separator />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{receipt.created_by.nome}</span>
            </div>
          </>
        )}

        {/* Ações */}
        {(onEdit || onDelete) && (
          <div className="flex gap-2 pt-1">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(receipt)}
                className="flex-1 h-8 text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Editar
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(receipt.id)}
                className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
