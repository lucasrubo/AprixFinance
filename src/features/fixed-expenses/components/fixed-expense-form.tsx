"use client";

import React, { useState, useEffect } from "react";
import { X, DollarSign, Calendar, Tag, FileText } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { FixedExpenseFormProps, CreateFixedExpenseData } from "../types";

export function FixedExpenseForm({
  expense,
  isOpen,
  onClose,
  onSubmit,
}: FixedExpenseFormProps) {
  const [formData, setFormData] = useState<CreateFixedExpenseData>({
    titulo: "",
    descricao: "",
    categoria: "gasto_fixo",
    valor_parcela: 0,
    data_inicio: new Date().toISOString().slice(0, 10),
    data_pagamento: 1,
    duracao: undefined,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (expense) {
      setFormData({
        titulo: expense.titulo,
        descricao: expense.descricao || "",
        categoria: expense.categoria,
        valor_parcela: expense.valor_parcela,
        data_inicio: expense.data_inicio,
        data_pagamento: expense.data_pagamento,
        duracao: expense.duracao,
      });
    } else {
      setFormData({
        titulo: "",
        descricao: "",
        categoria: "gasto_fixo",
        valor_parcela: 0,
        data_inicio: new Date().toISOString().slice(0, 10),
        data_pagamento: 1,
        duracao: undefined,
      });
    }
  }, [expense]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar gasto fixo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof CreateFixedExpenseData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {expense ? "Editar Gasto Fixo" : "Novo Gasto Fixo"}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="titulo">Título*</Label>
              <Input
                id="titulo"
                placeholder="Ex: Netflix, Aluguel, Internet..."
                value={formData.titulo}
                onChange={(e) => updateFormData("titulo", e.target.value)}
                required
              />
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria*</Label>
              <select
                id="categoria"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={formData.categoria}
                onChange={(e) => updateFormData("categoria", e.target.value)}
                required
              >
                <option value="gasto_fixo">Gasto Fixo</option>
                <option value="assinatura">Assinatura</option>
                <option value="servico">Serviço</option>
              </select>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="valor">Valor mensal (R$)*</Label>
              <CurrencyInput
                id="valor"
                value={formData.valor_parcela.toString()}
                onValueChange={(value) =>
                  updateFormData("valor_parcela", parseFloat(value) || 0)
                }
                placeholder="0,00"
                required
              />
            </div>

            {/* Data de pagamento */}
            <div className="space-y-2">
              <Label htmlFor="data_pagamento">Dia do vencimento*</Label>
              <Input
                id="data_pagamento"
                type="number"
                min="1"
                max="31"
                placeholder="1"
                value={formData.data_pagamento}
                onChange={(e) =>
                  updateFormData(
                    "data_pagamento",
                    parseInt(e.target.value) || 1,
                  )
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Dia do mês em que o pagamento vence (1-31)
              </p>
            </div>

            {/* Data de início */}
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de início*</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => updateFormData("data_inicio", e.target.value)}
                required
              />
            </div>

            {/* Duração (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="duracao">Duração (meses)</Label>
              <Input
                id="duracao"
                type="number"
                min="1"
                placeholder="Deixe vazio para duração indefinida"
                value={formData.duracao || ""}
                onChange={(e) =>
                  updateFormData(
                    "duracao",
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Opcional. Se não informado, o gasto será indefinido
              </p>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <textarea
                id="descricao"
                className="w-full px-3 py-2 border border-border rounded-md bg-background resize-none"
                placeholder="Informações adicionais..."
                value={formData.descricao}
                onChange={(e) => updateFormData("descricao", e.target.value)}
                rows={3}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  isLoading || !formData.titulo || formData.valor_parcela <= 0
                }
              >
                {isLoading ? "Salvando..." : expense ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
