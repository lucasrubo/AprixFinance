"use client";

import { Button } from "@/shared/components/ui/button";
import { CreditCard, Plus } from "lucide-react";
import Link from "next/link";
import type { CreditCardStats } from "../types";
import { CardBrandIcon } from "./card-brand-icon";

interface CreditCardWidgetProps {
  cards: CreditCardStats[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function CreditCardWidget({ cards }: CreditCardWidgetProps) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card/95 shadow-lg shadow-black/5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/70 px-6 py-4">
        <h3 className="flex items-center gap-2 font-bold text-lg text-foreground">
          <CreditCard className="h-5 w-5 text-indigo-500" />
          Cartões de Crédito
        </h3>
        <Link href="/dashboard/credit-cards">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Gerenciar
          </Button>
        </Link>
      </div>

      {/* Lista */}
      <div className="divide-y divide-border/50">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Nenhum cartão cadastrado
              </p>
              <p className="text-xs text-muted-foreground/70">
                Adicione para acompanhar seus gastos por cartão
              </p>
            </div>
            <Link href="/dashboard/credit-cards">
              <Button size="sm" variant="outline" className="mt-1 gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Adicionar cartão
              </Button>
            </Link>
          </div>
        ) : (
          cards.map((card) => (
            <div key={card.id} className="flex items-center gap-4 px-6 py-4">
              {/* Ícone bandeira com cor */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${card.cor}22` }}
              >
                <CardBrandIcon bandeira={card.bandeira} size={22} />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {card.nome}
                  </p>
                  <p className="shrink-0 text-sm font-semibold text-foreground">
                    {formatCurrency(card.total_mes)}
                  </p>
                </div>

                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    •••• {card.ultimos_4_digitos}
                  </p>
                  {card.limite ? (
                    <p className="text-xs text-muted-foreground">
                      de {formatCurrency(card.limite)}
                    </p>
                  ) : null}
                </div>

                {/* Barra de limite */}
                {card.percentual_limite !== null && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${card.percentual_limite}%`,
                        backgroundColor:
                          card.percentual_limite > 85
                            ? "#f43f5e"
                            : card.percentual_limite > 60
                              ? "#f97316"
                              : card.cor,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
