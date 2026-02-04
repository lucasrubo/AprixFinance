"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, DollarSign, Calendar } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { createReceiptAction } from "@/features/receipts/actions/receipt-actions";
import { getGroups } from "@/features/admin/actions/group-actions";
import { Group } from "@/shared/types";

interface CreateReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateReceiptModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateReceiptModalProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    valor: "",
    descricao: "",
    data: new Date().toISOString().split("T")[0],
    groupId: "",
    tipo: "saida" as "entrada" | "saida",
  });

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  const loadGroups = async () => {
    const groupsResult = await getGroups();
    if (groupsResult.success) {
      setGroups(groupsResult.groups || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const data = new FormData();
    data.append("titulo", formData.titulo);
    data.append("valor", formData.valor);
    data.append("descricao", formData.descricao);
    data.append("data", formData.data);
    data.append("tipo", formData.tipo);
    if (formData.groupId) {
      data.append("groupId", formData.groupId);
    }

    const result = await createReceiptAction(data);

    if (result.success) {
      setShowSuccess(true);
      // Aguardar 1.5 segundos para mostrar a mensagem de sucesso
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
        handleClose();
      }, 1500);
    } else {
      alert("Erro ao criar recibo: " + (result.error || "Erro desconhecido"));
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    setFormData({
      titulo: "",
      valor: "",
      descricao: "",
      data: new Date().toISOString().split("T")[0],
      groupId: "",
      tipo: "saida",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Novo Recibo
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-green-800">
                  Recibo criado com sucesso!
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  O recibo foi adicionado à sua lista.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                  placeholder="Ex: Conta de luz"
                  required
                />
              </div>

              <div>
                <Label htmlFor="valor">Valor</Label>
                <CurrencyInput
                  id="valor"
                  value={formData.valor}
                  onValueChange={(value) =>
                    setFormData({ ...formData, valor: value })
                  }
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="data">Data</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) =>
                      setFormData({ ...formData, data: e.target.value })
                    }
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      tipo: value as "entrada" | "saida",
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saida">Saída (Despesa)</SelectItem>
                    <SelectItem value="entrada">Entrada (Receita)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="groupId">Grupo (Opcional)</Label>
                <Select
                  value={formData.groupId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, groupId: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecionar grupo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição (Opcional)</Label>
                <textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  placeholder="Detalhes adicionais..."
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm min-h-[80px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Criando..." : "Criar Recibo"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
