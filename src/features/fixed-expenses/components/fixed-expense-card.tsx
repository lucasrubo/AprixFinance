"use client";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import {
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Pause,
  Play,
  Trash2,
  User,
} from "lucide-react";
import type { FixedExpenseCardProps } from "../types";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (dateString: string) => {
  // Assumir que a string está no formato YYYY-MM-DD e formatar diretamente
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

const formatFullDate = (date: Date) => {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getCategoryLabel = (categoria: string) => {
  const labels = {
    gasto_fixo: "Gasto Fixo",
    assinatura: "Assinatura",
    servico: "Serviço",
  };
  return labels[categoria as keyof typeof labels] || categoria;
};

const getStatusColor = (status: string) => {
  const colors = {
    ativo: "bg-green-500/10 text-green-700 dark:text-green-400",
    pausado: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    cancelado: "bg-red-500/10 text-red-700 dark:text-red-400",
  };
  return colors[status as keyof typeof colors] || "";
};

export function FixedExpenseCard({
  expense,
  onEdit,
  onDelete,
  onToggleStatus,
}: FixedExpenseCardProps) {
  const nextPaymentDate = new Date();
  nextPaymentDate.setDate(expense.data_pagamento);
  if (nextPaymentDate < new Date()) {
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
  }

  const isActive = expense.status === "ativo";
  const _isPaused = expense.status === "pausado";

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                {expense.titulo}
              </h3>
              <Badge className={getStatusColor(expense.status)}>
                {expense.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {getCategoryLabel(expense.categoria)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(expense)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onToggleStatus(expense.id, isActive ? "pausado" : "ativo")
              }
              className="h-8 w-8 p-0"
            >
              {isActive ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(expense.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {expense.descricao && (
          <p className="text-sm text-muted-foreground">{expense.descricao}</p>
        )}

        {expense.created_by && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Criado por {expense.created_by.nome}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {formatCurrency(expense.valor_parcela)}
              </p>
              <p className="text-xs text-muted-foreground">Valor mensal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Dia {expense.data_pagamento}
              </p>
              <p className="text-xs text-muted-foreground">Todo mês</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Início</p>
            <p className="text-sm font-medium">
              {formatDate(expense.data_inicio)}
            </p>
          </div>

          {expense.duracao && (
            <div>
              <p className="text-xs text-muted-foreground">Duração</p>
              <p className="text-sm font-medium">{expense.duracao} meses</p>
            </div>
          )}
        </div>

        {isActive && (
          <div className="flex items-center gap-2 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
            <Clock className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Próximo pagamento
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {formatFullDate(nextPaymentDate)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
