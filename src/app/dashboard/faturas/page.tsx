"use client";

export const dynamic = "force-dynamic";

import {
  getInvoicesAction,
  type CardInvoice,
  type InvoicePeriod,
} from "@/features/credit-cards/actions/credit-card-actions";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  Calendar,
  CreditCard,
  FileText,
  TrendingDown,
} from "lucide-react";
import { useEffect, useState } from "react";

const CURRENCY = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(v: number) {
  return CURRENCY.format(v);
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatDateRange(start: string, end: string) {
  return `${formatDate(start)} → ${formatDate(end)}`;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function InvoiceSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-56 mt-1" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Period Card ─────────────────────────────────────────────────────────────

function PeriodCard({ period }: { period: InvoicePeriod }) {
  const [expanded, setExpanded] = useState(period.isOpen);

  const borderClass = period.isOpen
    ? "border-primary/40 shadow-sm"
    : period.isFuture
      ? "border-blue-200/60 dark:border-blue-900/40"
      : "";

  return (
    <Card className={borderClass}>
      <CardHeader
        className="pb-3 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {period.isOpen ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 shrink-0">
                Aberta
              </Badge>
            ) : period.isFuture ? (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shrink-0">
                A vencer
              </Badge>
            ) : (
              <Badge variant="secondary" className="shrink-0">
                Fechada
              </Badge>
            )}
            <span className="font-semibold text-sm truncate">{period.label}</span>
          </div>
          <span
            className={`text-base font-bold tabular-nums shrink-0 ${
              period.total > 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-muted-foreground"
            }`}
          >
            {formatCurrency(period.total)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDateRange(period.startDate, period.endDate)}
          <span className="ml-1">· {period.receipts.length} lançamento{period.receipts.length !== 1 ? "s" : ""}</span>
        </p>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-4 space-y-2">
          {period.receipts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum lançamento neste período.
            </p>
          ) : (
            period.receipts.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.titulo}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(r.data)}
                    </span>
                    {r.parcelas_total > 1 && (
                      <Badge className="text-[10px] h-4 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                        {r.parcelas_total}x de {formatCurrency(r.parcelas_valor)}
                      </Badge>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 tabular-nums shrink-0">
                  -{formatCurrency(r.valor)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Card Invoice View ────────────────────────────────────────────────────────

function CardInvoiceView({ invoice }: { invoice: CardInvoice }) {
  const { card, periods } = invoice;
  const [showFuture, setShowFuture] = useState(false);

  const openPeriod = periods.find((p) => p.isOpen);
  const futurePeriods = periods.filter((p) => p.isFuture);
  const pastPeriods = periods.filter((p) => !p.isOpen && !p.isFuture);

  const futureTotal = futurePeriods.reduce((s, p) => s + p.total, 0);

  return (
    <div className="space-y-3">
      {/* Card header summary */}
      <div
        className="rounded-xl p-4 text-white flex items-center justify-between"
        style={{ backgroundColor: card.cor ?? "#6366f1" }}
      >
        <div>
          <p className="text-sm font-medium opacity-80">{card.nome}</p>
          <p className="text-xs opacity-60">
            {card.bandeira.toUpperCase()} •••• {card.ultimos_4_digitos}
          </p>
          {card.dia_fechamento && (
            <p className="text-xs opacity-60 mt-0.5">
              Fecha dia {card.dia_fechamento}
              {card.dia_vencimento ? ` · Vence dia ${card.dia_vencimento}` : ""}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs opacity-70">Fatura aberta</p>
          <p className="text-lg font-bold tabular-nums">
            {formatCurrency(openPeriod?.total ?? 0)}
          </p>
          {card.limite && card.limite > 0 && (
            <p className="text-xs opacity-60">
              de {formatCurrency(card.limite)}
            </p>
          )}
        </div>
      </div>

      {/* Fatura atual */}
      {openPeriod && <PeriodCard period={openPeriod} />}

      {/* Próximas faturas — colapsável */}
      {futurePeriods.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowFuture((v) => !v)}
            className="w-full flex items-center justify-between rounded-lg border border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/10 px-4 py-2.5 text-sm font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-950/40 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximas faturas ({futurePeriods.length})
              {futureTotal > 0 && (
                <span className="text-xs font-normal opacity-70">
                  · {formatCurrency(futureTotal)} em parcelas
                </span>
              )}
            </span>
            <span className="text-xs opacity-60">{showFuture ? "▲ Fechar" : "▼ Ver"}</span>
          </button>

          {showFuture && (
            <div className="space-y-2 pl-2 border-l-2 border-blue-200 dark:border-blue-800">
              {futurePeriods.map((period) => (
                <PeriodCard key={period.startDate} period={period} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Histórico */}
      {pastPeriods.length > 0 && (
        <div className="space-y-2">
          {pastPeriods.length > 0 && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 pt-1">
              Histórico
            </p>
          )}
          {pastPeriods.map((period) => (
            <PeriodCard key={period.startDate} period={period} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Geral View ──────────────────────────────────────────────────────────────

function GeralView({ invoices }: { invoices: CardInvoice[] }) {
  // Aggregate open period per card
  const summary = invoices.map((inv) => {
    const open = inv.periods.find((p) => p.isOpen);
    return {
      card: inv.card,
      total: open?.total ?? 0,
      count: open?.receipts.length ?? 0,
    };
  });

  const grandTotal = summary.reduce((s, c) => s + c.total, 0);

  return (
    <div className="space-y-4">
      {/* Grand total */}
      <Card className="border-rose-200 dark:border-rose-900/50">
        <CardContent className="pt-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-rose-500" />
            <div>
              <p className="text-sm font-medium">Total em aberto</p>
              <p className="text-xs text-muted-foreground">Todas as faturas abertas</p>
            </div>
          </div>
          <span className="text-xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
            {formatCurrency(grandTotal)}
          </span>
        </CardContent>
      </Card>

      {/* Per card */}
      {summary.map(({ card, total, count }) => (
        <div
          key={card.id}
          className="flex items-center gap-3 rounded-xl border bg-card p-4"
        >
          <div
            className="h-10 w-10 rounded-full shrink-0 flex items-center justify-center"
            style={{ backgroundColor: card.cor ?? "#6366f1" }}
          >
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{card.nome}</p>
            <p className="text-xs text-muted-foreground">
              {card.bandeira.toUpperCase()} •••• {card.ultimos_4_digitos}
              {count > 0 && ` · ${count} lançamento${count !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p
              className={`text-base font-bold tabular-nums ${
                total > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground"
              }`}
            >
              {formatCurrency(total)}
            </p>
            {card.limite && card.limite > 0 && (
              <p className="text-xs text-muted-foreground">
                {((total / card.limite) * 100).toFixed(0)}% do limite
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FaturasPage() {
  const [invoices, setInvoices] = useState<CardInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getInvoicesAction(3).then((result) => {
      if (result.success && result.data) setInvoices(result.data);
      setIsLoading(false);
    });
  }, []);

  const hasCards = invoices.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Faturas</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe os gastos por cartão e período de faturamento.
        </p>
      </div>

      {isLoading ? (
        <InvoiceSkeleton />
      ) : !hasCards ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="rounded-full bg-muted p-6">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-base">Nenhum cartão cadastrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cadastre um cartão de crédito para visualizar suas faturas.
            </p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue={invoices.length === 1 ? invoices[0].card.id : "geral"}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {invoices.length > 1 && (
              <TabsTrigger value="geral">Geral</TabsTrigger>
            )}
            {invoices.map(({ card }) => (
              <TabsTrigger key={card.id} value={card.id}>
                {card.nome}
              </TabsTrigger>
            ))}
          </TabsList>

          {invoices.length > 1 && (
            <TabsContent value="geral" className="mt-4">
              <GeralView invoices={invoices} />
            </TabsContent>
          )}

          {invoices.map((invoice) => (
            <TabsContent key={invoice.card.id} value={invoice.card.id} className="mt-4">
              <CardInvoiceView invoice={invoice} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
