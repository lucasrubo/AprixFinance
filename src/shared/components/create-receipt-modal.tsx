"use client";

import { getGroups } from "@/features/admin/actions/group-actions";
import { getCreditCardsAction } from "@/features/credit-cards/actions/credit-card-actions";
import { CreditCardSelector } from "@/features/credit-cards/components/credit-card-selector";
import type { CreditCard } from "@/features/credit-cards/types";
import {
  createReceiptAction,
  uploadReceiptImageAction,
} from "@/features/receipts/actions/receipt-actions";
import { CameraCapture } from "@/features/receipts/components/camera-capture";
import { Button } from "@/shared/components/ui/button";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import type { Group } from "@/shared/types";
import { createClient } from "@/shared/utils/supabase/client";
import { Camera, CheckCircle, FileText, Plus } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

interface CreateReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const INITIAL_FORM = {
  titulo: "",
  valor: "",
  descricao: "",
  data: new Date().toISOString().split("T")[0],
  groupId: "",
  tipo: "saida" as "entrada" | "saida",
  categoria_pagamento: "debito" as "credito" | "debito" | "dinheiro" | "pix",
  parcelas_total: 1,
  credit_card_id: "",
};

export function CreateReceiptModal({
  isOpen,
  onClose,
  onSuccess,
  trigger,
}: CreateReceiptModalProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [open, setOpen] = useState(isOpen);
  const [activeTab, setActiveTab] = useState("camera");
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  // Valor por parcela (calculado em tempo real)
  const valorNum = Number.parseFloat(formData.valor.replace(",", ".")) || 0;
  const parcelaValor =
    formData.parcelas_total > 1 ? valorNum / formData.parcelas_total : valorNum;

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (open) {
      Promise.all([getGroups(), getCreditCardsAction()]).then(
        ([groupsResult, cardsResult]) => {
          if (groupsResult.success && groupsResult.groups)
            setGroups(groupsResult.groups);
          if (cardsResult.success && cardsResult.data)
            setCreditCards(cardsResult.data);
        },
      );
    }
  }, [open]);

  const processReceiptOcr = async (imageBase64: string) => {
    setCapturedImage(imageBase64);
    setIsProcessingOcr(true);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const apiUrl =
        process.env.NEXT_PUBLIC_FINANCE_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/receipts/ocr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ image: imageBase64 }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        const { ultimos_4_digitos, bandeira } = result.data;

        // Tenta encontrar o cartão pelo últimos 4 dígitos; se não, tenta pela bandeira
        let matchedCardId: string | undefined;
        if (ultimos_4_digitos) {
          const byDigits = creditCards.find(
            (c) => c.ultimos_4_digitos === ultimos_4_digitos,
          );
          matchedCardId = byDigits?.id;
        }
        if (!matchedCardId && bandeira) {
          const byBandeira = creditCards.find((c) => c.bandeira === bandeira);
          matchedCardId = byBandeira?.id;
        }

        setFormData((prev) => ({
          ...prev,
          titulo: result.data.titulo || prev.titulo,
          valor: result.data.valor ? String(result.data.valor) : prev.valor,
          descricao: result.data.descricao || prev.descricao,
          data: result.data.data || prev.data,
          categoria_pagamento:
            result.data.categoria_pagamento || prev.categoria_pagamento,
          credit_card_id: matchedCardId ?? prev.credit_card_id,
        }));
      }
    } catch (_err) {
      // OCR falhou — usuário preenche manualmente
    }

    setActiveTab("manual");
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
    data.append("parcelas_total", String(formData.parcelas_total));
    if (formData.groupId) data.append("groupId", formData.groupId);
    if (formData.credit_card_id)
      data.append("credit_card_id", formData.credit_card_id);

    const result = await createReceiptAction(data);

    if (result.success && result.data) {
      // Upload da imagem em background — não bloqueia o feedback de sucesso
      if (capturedImage) {
        uploadReceiptImageAction(capturedImage, result.data.id).catch(() => {});
      }

      setShowSuccess(true);
      setFormData({ ...INITIAL_FORM, data: new Date().toISOString().split("T")[0] });
      setCapturedImage(null);

      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
        handleClose();
      }, 1500);
    } else {
      alert(`Erro ao criar recibo: ${result.error || "Erro desconhecido"}`);
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    setOpen(false);
    setActiveTab("camera");
    setIsProcessingOcr(false);
    setCapturedImage(null);
    onClose();
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setActiveTab("camera");
      setIsProcessingOcr(false);
      setCapturedImage(null);
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

            {/* ── Aba Câmera ── */}
            <TabsContent value="camera">
              {isProcessingOcr ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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

            {/* ── Aba Manual ── */}
            <TabsContent value="manual">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Prévia da imagem capturada */}
                {capturedImage && (
                  <div className="relative overflow-hidden rounded-lg border border-border">
                    <img
                      src={capturedImage}
                      alt="Prévia do recibo capturado"
                      className="w-full max-h-32 object-cover"
                    />
                    <button
                      type="button"
                      className="absolute right-1 top-1 rounded-full bg-background/80 px-2 py-0.5 text-xs text-muted-foreground hover:bg-background"
                      onClick={() => setCapturedImage(null)}
                    >
                      remover
                    </button>
                  </div>
                )}

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
                  <Label htmlFor="valor">Valor total *</Label>
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

                {/* Parcelamento */}
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Parcelamento</Label>
                    <span className="text-xs text-muted-foreground">
                      {formData.parcelas_total > 1
                        ? `${formData.parcelas_total}× de R$ ${parcelaValor.toFixed(2).replace(".", ",")}`
                        : "À vista"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={48}
                      value={formData.parcelas_total}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parcelas_total: Math.max(
                            1,
                            Number.parseInt(e.target.value, 10) || 1,
                          ),
                        })
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.parcelas_total === 1 ? "parcela (à vista)" : "parcelas"}
                    </span>
                  </div>
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
                  <Label>Tipo *</Label>
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
                  <Label>Forma de pagamento *</Label>
                  <Select
                    value={formData.categoria_pagamento}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        categoria_pagamento:
                          value as typeof formData.categoria_pagamento,
                        credit_card_id: value === "credito" ? formData.credit_card_id : "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debito">Cartão de Débito</SelectItem>
                      <SelectItem value="credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Seletor de cartão — só aparece quando pagamento = crédito e há cartões */}
                {formData.categoria_pagamento === "credito" &&
                  creditCards.length > 0 && (
                    <div>
                      <Label>Cartão de crédito</Label>
                      <CreditCardSelector
                        cards={creditCards}
                        value={formData.credit_card_id || undefined}
                        onChange={(id) =>
                          setFormData({ ...formData, credit_card_id: id ?? "" })
                        }
                      />
                    </div>
                  )}

                <div>
                  <Label>Grupo (Opcional)</Label>
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
