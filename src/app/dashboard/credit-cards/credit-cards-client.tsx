"use client";

import {
  deleteCreditCardAction,
  getCreditCardsAction,
} from "@/features/credit-cards/actions/credit-card-actions";
import { CreditCardForm } from "@/features/credit-cards/components/credit-card-form";
import { CreditCardVisual } from "@/features/credit-cards/components/credit-card-visual";
import type { CreditCard } from "@/features/credit-cards/types";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { CreditCard as CreditCardIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface CreditCardsClientProps {
  initialCards: CreditCard[];
}

export function CreditCardsClient({ initialCards }: CreditCardsClientProps) {
  const [cards, setCards] = useState<CreditCard[]>(initialCards);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | undefined>();

  const refresh = async () => {
    const result = await getCreditCardsAction();
    if (result.success && result.data) setCards(result.data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este cartão?")) return;
    const result = await deleteCreditCardAction(id);
    if (result.success) setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const openNew = () => {
    setEditingCard(undefined);
    setIsFormOpen(true);
  };

  const openEdit = (card: CreditCard) => {
    setEditingCard(card);
    setIsFormOpen(true);
  };

  const handleSuccess = async () => {
    setIsFormOpen(false);
    setEditingCard(undefined);
    await refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
            <CreditCardIcon className="h-8 w-8 text-indigo-500" />
            Cartões de Crédito
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus cartões e acompanhe os gastos por fatura
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cartão
        </Button>
      </div>

      {/* Grid de cartões */}
      {cards.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border/60 py-16 text-center">
          <CreditCardIcon className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <p className="font-medium text-foreground">Nenhum cartão cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Adicione seus cartões para acompanhar os gastos por fatura
            </p>
          </div>
          <Button onClick={openNew} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar primeiro cartão
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div key={card.id} className="group relative">
              <CreditCardVisual card={card} />

              {/* Ações — aparecem no hover */}
              <div className="mt-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => openEdit(card)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(card.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover
                </Button>
              </div>

              {/* Info abaixo do cartão */}
              <div className="mt-2 px-1">
                <p className="text-xs text-muted-foreground">
                  {card.dia_fechamento
                    ? `Fecha dia ${card.dia_fechamento}`
                    : "Sem data de fechamento"}
                  {card.dia_vencimento
                    ? ` · Vence dia ${card.dia_vencimento}`
                    : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCard ? "Editar cartão" : "Novo cartão"}
            </DialogTitle>
          </DialogHeader>
          <CreditCardForm
            card={editingCard}
            onSuccess={handleSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
