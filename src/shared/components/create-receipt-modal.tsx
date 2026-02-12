"use client";

import React, { useState, useEffect } from "react";
import { Plus, CheckCircle, FileText, Camera } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { Label } from "@/shared/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { createReceiptAction } from "@/features/receipts/actions/receipt-actions";
import { getGroups } from "@/features/admin/actions/group-actions";
import { CameraCapture } from "@/features/receipts/components/camera-capture";
import { Group } from "@/shared/types";

interface CreateReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateReceiptModal({
  isOpen,
  onClose,
  onSuccess,
  trigger,
}: CreateReceiptModalProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [open, setOpen] = useState(isOpen);
  const [activeTab, setActiveTab] = useState("camera");
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  
  const [formData, setFormData] = useState({
    titulo: "",
    valor: "",
    descricao: "",
    data: new Date().toISOString().split("T")[0],
    groupId: "",
    tipo: "saida" as "entrada" | "saida",
    categoria_pagamento: "debito" as "credito" | "debito" | "dinheiro" | "pix",
  });

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (open) {
      loadGroups();
    }
  }, [open]);

  const loadGroups = async () => {
    try {
      const result = await getGroups();
      if (result.success && result.groups) {
        setGroups(result.groups);
      }
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
    }
  };

  const processReceiptOcr = async (imageBase64: string) => {
    setIsProcessingOcr(true);
    
    try {
      // Aqui você vai fazer a chamada para a API de OCR
      const response = await fetch('/api/receipts/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
          group_id: formData.groupId || undefined,
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Atualizar formulário com dados extraídos
        setFormData(prev => ({
          ...prev,
          titulo: result.data.titulo || prev.titulo,
          valor: result.data.valor ? String(result.data.valor) : prev.valor,
          data: result.data.data || prev.data,
          categoria_pagamento: result.data.categoria_pagamento || prev.categoria_pagamento,
        }));
        
        // Mudar para aba manual para usuário revisar os dados
        setActiveTab("manual");
      } else {
        alert("Erro ao processar imagem: " + (result.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Erro ao processar OCR:", error);
      alert("Erro ao processar imagem. Tente novamente.");
    }
    
    setIsProcessingOcr(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo || !formData.valor) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsLoading(true);

    const data = new FormData();
    data.append("titulo", formData.titulo);
    data.append("valor", formData.valor.replace(",", "."));
    data.append("descricao", formData.descricao);
    data.append("data", formData.data);
    data.append("tipo", formData.tipo);
    data.append("categoria_pagamento", formData.categoria_pagamento);
    if (formData.groupId) {
      data.append("groupId", formData.groupId);
    }

    const result = await createReceiptAction(data);

    if (result.success) {
      setShowSuccess(true);
      setFormData({
        titulo: "",
        valor: "",
        descricao: "",
        data: new Date().toISOString().split("T")[0],
        groupId: "",
        tipo: "saida",
        categoria_pagamento: "debito",
      });

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
    setOpen(false);
    setActiveTab("camera");
    setIsProcessingOcr(false);
    onClose();
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setActiveTab("camera");
      setIsProcessingOcr(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Novo Recibo
          </DialogTitle>
          <DialogDescription>
            Capture uma foto do recibo ou adicione manualmente.
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Câmera
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="camera">
              {isProcessingOcr ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <div className="text-center">
                    <h3 className="font-medium">Processando recibo...</h3>
                    <p className="text-sm text-muted-foreground">
                      Extraindo informações da imagem
                    </p>
                  </div>
                </div>
              ) : (
                <CameraCapture
                  onCapture={processReceiptOcr}
                  onCancel={handleClose}
                />
              )}
            </TabsContent>

            <TabsContent value="manual">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
                    }
                    placeholder="Ex: Supermercado XYZ..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="valor">Valor *</Label>
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
                  <Label htmlFor="data">Data *</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) =>
                      setFormData({ ...formData, data: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        tipo: value as "entrada" | "saida",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saida">Saída (Despesa)</SelectItem>
                      <SelectItem value="entrada">Entrada (Receita)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="categoria_pagamento">Categoria de Pagamento *</Label>
                  <Select
                    value={formData.categoria_pagamento}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        categoria_pagamento: value as "credito" | "debito" | "dinheiro" | "pix",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debito">Cartão de Débito</SelectItem>
                      <SelectItem value="credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
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
                    <SelectTrigger>
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
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
