"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { CreditCard } from "../types";
import { CardBrandIcon } from "./card-brand-icon";

interface CreditCardSelectorProps {
  cards: CreditCard[];
  value?: string;
  onChange: (cardId: string | undefined) => void;
  placeholder?: string;
}

export function CreditCardSelector({
  cards,
  value,
  onChange,
  placeholder = "Selecione o cartão",
}: CreditCardSelectorProps) {
  if (!cards.length) return null;

  return (
    <Select
      value={value ?? "__none__"}
      onValueChange={(v) => onChange(v === "__none__" ? undefined : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">
          <span className="text-muted-foreground">Nenhum</span>
        </SelectItem>
        {cards.map((card) => (
          <SelectItem key={card.id} value={card.id}>
            <span className="flex items-center gap-2">
              <CardBrandIcon bandeira={card.bandeira} size={18} />
              <span>{card.nome}</span>
              <span className="text-xs text-muted-foreground">
                •••• {card.ultimos_4_digitos}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
