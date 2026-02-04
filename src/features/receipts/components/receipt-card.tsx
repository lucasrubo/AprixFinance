"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Receipt } from "@/shared/types";
import { Calendar, Store, DollarSign, Edit, Trash2, User } from "lucide-react";

interface ReceiptCardProps {
  receipt: Receipt;
  onEdit?: (receipt: Receipt) => void;
  onDelete?: (receiptId: string) => void;
}

export function ReceiptCard({ receipt, onEdit, onDelete }: ReceiptCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    // Assumir que a string está no formato YYYY-MM-DD e formatar diretamente
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "validated":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "processed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "saida":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTypeText = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return "Entrada";
      case "saida":
        return "Saída";
      default:
        return "Desconhecido";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{receipt.titulo}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(receipt.data)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <DollarSign
              className={`h-5 w-5 ${receipt.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}
            />
            {formatCurrency(receipt.valor)}
          </div>
          <Badge className={getTypeColor(receipt.tipo)}>
            {getTypeText(receipt.tipo)}
          </Badge>
        </div>

        {receipt.descricao && (
          <p className="text-sm text-muted-foreground">{receipt.descricao}</p>
        )}

        {receipt.created_by && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>Criado por {receipt.created_by.nome}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(receipt)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete?.(receipt.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
