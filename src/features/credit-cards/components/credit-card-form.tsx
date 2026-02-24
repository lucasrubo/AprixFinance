"use client";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useState } from "react";
import {
  createCreditCardAction,
  updateCreditCardAction,
} from "../actions/credit-card-actions";
import type { CardBandeira, CreditCard, CreateCreditCardData } from "../types";
import { BRAND_LABELS, CardBrandIcon } from "./card-brand-icon";

const BANDEIRAS: CardBandeira[] = [
  "visa",
  "mastercard",
  "elo",
  "amex",
  "hipercard",
  "outro",
];

const COR_PRESETS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#64748b",
];

interface CreditCardFormProps {
  card?: CreditCard;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreditCardForm({
  card,
  onSuccess,
  onCancel,
}: CreditCardFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateCreditCardData>({
    nome: card?.nome ?? "",
    bandeira: card?.bandeira ?? "visa",
    ultimos_4_digitos: card?.ultimos_4_digitos ?? "",
    limite: card?.limite ?? undefined,
    dia_fechamento: card?.dia_fechamento ?? undefined,
    dia_vencimento: card?.dia_vencimento ?? undefined,
    cor: card?.cor ?? "#6366f1",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.ultimos_4_digitos.length !== 4 || !/^\d{4}$/.test(form.ultimos_4_digitos)) {
      setError("Os 4 últimos dígitos devem ser numéricos.");
      return;
    }

    setIsLoading(true);
    try {
      const result = card
        ? await updateCreditCardAction(card.id, form)
        : await createCreditCardAction(form);

      if (!result.success) {
        setError(result.error ?? "Erro ao salvar cartão.");
      } else {
        onSuccess();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Nome */}
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome do cartão</Label>
        <Input
          id="nome"
          placeholder="Ex: Nubank Principal"
          value={form.nome}
          onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
          required
        />
      </div>

      {/* Bandeira + 4 dígitos */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Bandeira</Label>
          <Select
            value={form.bandeira}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, bandeira: v as CardBandeira }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BANDEIRAS.map((b) => (
                <SelectItem key={b} value={b}>
                  <span className="flex items-center gap-2">
                    <CardBrandIcon bandeira={b} size={20} />
                    {BRAND_LABELS[b]}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="digitos">Últimos 4 dígitos</Label>
          <Input
            id="digitos"
            placeholder="0000"
            maxLength={4}
            value={form.ultimos_4_digitos}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                ultimos_4_digitos: e.target.value.replace(/\D/g, ""),
              }))
            }
            required
          />
        </div>
      </div>

      {/* Limite */}
      <div className="space-y-1.5">
        <Label htmlFor="limite">Limite (opcional)</Label>
        <Input
          id="limite"
          type="number"
          placeholder="5000,00"
          min={0}
          step={0.01}
          value={form.limite ?? ""}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              limite: e.target.value ? Number(e.target.value) : undefined,
            }))
          }
        />
      </div>

      {/* Datas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="fechamento">Dia fechamento</Label>
          <Input
            id="fechamento"
            type="number"
            placeholder="1–28"
            min={1}
            max={28}
            value={form.dia_fechamento ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                dia_fechamento: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vencimento">Dia vencimento</Label>
          <Input
            id="vencimento"
            type="number"
            placeholder="1–28"
            min={1}
            max={28}
            value={form.dia_vencimento ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                dia_vencimento: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              }))
            }
          />
        </div>
      </div>

      {/* Cor */}
      <div className="space-y-1.5">
        <Label>Cor de identificação</Label>
        <div className="flex flex-wrap gap-2">
          {COR_PRESETS.map((cor) => (
            <button
              key={cor}
              type="button"
              className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: cor,
                borderColor: form.cor === cor ? "#fff" : "transparent",
                outline: form.cor === cor ? `2px solid ${cor}` : "none",
              }}
              onClick={() => setForm((f) => ({ ...f, cor }))}
              aria-label={`Cor ${cor}`}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Salvando…" : card ? "Atualizar" : "Criar cartão"}
        </Button>
      </div>
    </form>
  );
}
