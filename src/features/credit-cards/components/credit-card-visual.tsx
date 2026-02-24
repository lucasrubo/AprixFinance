"use client";

import type { CreditCard } from "../types";
import { CardBrandIcon } from "./card-brand-icon";

interface CreditCardVisualProps {
  card: CreditCard;
  compact?: boolean;
}

export function CreditCardVisual({ card, compact = false }: CreditCardVisualProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <CardBrandIcon bandeira={card.bandeira} size={18} />
        <span className="text-sm font-medium text-foreground">{card.nome}</span>
        <span className="text-xs text-muted-foreground">•••• {card.ultimos_4_digitos}</span>
      </div>
    );
  }

  return (
    <div
      className="relative h-36 w-full max-w-xs overflow-hidden rounded-2xl p-5 text-white shadow-xl"
      style={{ background: `linear-gradient(135deg, ${card.cor}dd, ${card.cor}88)` }}
    >
      {/* Círculos decorativos */}
      <div
        className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-20"
        style={{ backgroundColor: card.cor }}
      />
      <div
        className="absolute -bottom-8 -right-2 h-24 w-24 rounded-full opacity-15"
        style={{ backgroundColor: "#fff" }}
      />

      <div className="relative flex h-full flex-col justify-between">
        {/* Topo */}
        <div className="flex items-start justify-between">
          <p className="text-sm font-semibold opacity-90 drop-shadow">{card.nome}</p>
          <CardBrandIcon bandeira={card.bandeira} size={28} />
        </div>

        {/* Dígitos */}
        <div>
          <p className="font-mono text-lg tracking-widest drop-shadow">
            •••• •••• •••• {card.ultimos_4_digitos}
          </p>
          {card.dia_vencimento && (
            <p className="mt-0.5 text-xs opacity-75">
              Venc. dia {card.dia_vencimento}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
