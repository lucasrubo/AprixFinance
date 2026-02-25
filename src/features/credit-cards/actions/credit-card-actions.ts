"use server";

import { createClient } from "@/shared/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { CreateCreditCardData, CreditCard, CreditCardStats } from "../types";

export async function getCreditCardsAction(): Promise<{
  success: boolean;
  data?: CreditCard[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const { data, error } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as CreditCard[] };
}

export async function getCreditCardStatsAction(): Promise<{
  success: boolean;
  data?: CreditCardStats[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const { data: cards, error: cardsError } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("created_at", { ascending: false });

  if (cardsError) return { success: false, error: cardsError.message };
  if (!cards?.length) return { success: true, data: [] };

  // Buscar gastos do mês atual por cartão
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const { data: receipts } = await supabase
    .from("receipts")
    .select("credit_card_id, valor")
    .eq("user_id", user.id)
    .eq("tipo", "saida")
    .gte("data", firstDay)
    .lte("data", lastDay)
    .not("credit_card_id", "is", null);

  // Agrupar gastos por cartão
  const spendByCard: Record<string, number> = {};
  for (const r of receipts ?? []) {
    if (r.credit_card_id) {
      spendByCard[r.credit_card_id] =
        (spendByCard[r.credit_card_id] || 0) + r.valor;
    }
  }

  const stats: CreditCardStats[] = (cards as CreditCard[]).map((card) => {
    const total_mes = spendByCard[card.id] || 0;
    const percentual_limite =
      card.limite && card.limite > 0
        ? Math.min((total_mes / card.limite) * 100, 100)
        : null;
    return { ...card, total_mes, percentual_limite };
  });

  return { success: true, data: stats };
}

export async function createCreditCardAction(
  data: CreateCreditCardData,
): Promise<{ success: boolean; data?: CreditCard; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const { data: card, error } = await supabase
    .from("credit_cards")
    .insert({
      user_id: user.id,
      nome: data.nome.trim(),
      bandeira: data.bandeira,
      ultimos_4_digitos: data.ultimos_4_digitos,
      limite: data.limite ?? null,
      dia_fechamento: data.dia_fechamento ?? null,
      dia_vencimento: data.dia_vencimento ?? null,
      cor: data.cor ?? "#6366f1",
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  return { success: true, data: card as CreditCard };
}

export async function updateCreditCardAction(
  id: string,
  data: Partial<CreateCreditCardData>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const { error } = await supabase
    .from("credit_cards")
    .update({ ...data })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/credit-cards");
  return { success: true };
}

// ─── Helpers de ciclo de faturamento ─────────────────────────────────────────

function getBillingCycleEnd(diaFechamento: number, today: Date): Date {
  const day = today.getDate();
  if (day < diaFechamento) {
    // Fechamento ainda este mês
    return new Date(today.getFullYear(), today.getMonth(), diaFechamento);
  }
  // Fechamento no próximo mês
  return new Date(today.getFullYear(), today.getMonth() + 1, diaFechamento);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export interface InvoicePeriod {
  label: string;
  startDate: string;
  endDate: string;
  /** Fatura ainda não fechada (acumulando) */
  isOpen: boolean;
  /** Fatura futura (parcela ainda não chegou) */
  isFuture: boolean;
  total: number;
  receipts: {
    id: string;
    titulo: string;
    /** Para parcelados: valor da parcela. Para à vista: valor total. */
    valor: number;
    parcelas_total: number;
    parcelas_valor: number;
    /** Data original da compra */
    data: string;
    categoria_pagamento: string | null;
  }[];
}

export interface CardInvoice {
  card: CreditCard;
  periods: InvoicePeriod[];
}

export async function getInvoicesAction(monthsBack = 3): Promise<{
  success: boolean;
  data?: CardInvoice[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const { data: cards, error: cardsError } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("created_at", { ascending: false });

  if (cardsError) return { success: false, error: cardsError.message };
  if (!cards?.length) return { success: true, data: [] };

  const today = new Date();
  // Buscar compras dos últimos 24 meses para pegar parcelamentos ainda ativos
  const lookback = new Date(today.getFullYear(), today.getMonth() - 24, 1);

  const { data: allReceipts, error: receiptsError } = await supabase
    .from("receipts")
    .select(
      "id, titulo, valor, parcelas_total, parcelas_valor, data, categoria_pagamento, credit_card_id",
    )
    .eq("user_id", user.id)
    .eq("tipo", "saida")
    .not("credit_card_id", "is", null)
    .gte("data", toDateStr(lookback))
    .order("data", { ascending: false });

  if (receiptsError) return { success: false, error: receiptsError.message };

  const invoices: CardInvoice[] = (cards as CreditCard[]).map((card) => {
    const diaFechamento = card.dia_fechamento ?? 1;
    const openEnd = getBillingCycleEnd(diaFechamento, today);
    const openEndStr = toDateStr(openEnd);

    // Mapa de períodos: chave = endDate string
    const periodsMap = new Map<
      string,
      InvoicePeriod
    >();

    function makePeriodLabel(periodEnd: Date): string {
      // Label = mês de vencimento (mês seguinte ao fechamento)
      const vencimentoMes = new Date(
        periodEnd.getFullYear(),
        periodEnd.getMonth() + 1,
        1,
      );
      const label = vencimentoMes.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      return label.charAt(0).toUpperCase() + label.slice(1);
    }

    function getOrCreatePeriod(periodEnd: Date): InvoicePeriod {
      const key = toDateStr(periodEnd);
      if (!periodsMap.has(key)) {
        const periodStart = new Date(
          periodEnd.getFullYear(),
          periodEnd.getMonth() - 1,
          diaFechamento + 1,
        );
        periodsMap.set(key, {
          label: makePeriodLabel(periodEnd),
          startDate: toDateStr(periodStart),
          endDate: key,
          isOpen: key === openEndStr,
          isFuture: periodEnd > openEnd,
          total: 0,
          receipts: [],
        });
      }
      return periodsMap.get(key) as InvoicePeriod;
    }

    // Garantir criação dos períodos padrão (histórico + atual)
    for (let i = 0; i <= monthsBack; i++) {
      getOrCreatePeriod(addMonths(openEnd, -i));
    }

    // Encontra em qual período de faturamento cai uma data de compra
    function findPurchasePeriodEnd(purchaseDateStr: string): Date | null {
      const purchaseDate = new Date(`${purchaseDateStr}T12:00:00`);
      for (let i = 0; i <= 36; i++) {
        const pEnd = addMonths(openEnd, -i);
        const pStart = new Date(
          pEnd.getFullYear(),
          pEnd.getMonth() - 1,
          diaFechamento + 1,
        );
        if (purchaseDate >= pStart && purchaseDate <= pEnd) {
          return pEnd;
        }
      }
      return null;
    }

    // Distribuir cada recibo nos períodos corretos
    const cardReceipts = (allReceipts ?? []).filter(
      (r) => r.credit_card_id === card.id,
    );

    for (const r of cardReceipts) {
      const parcelas = r.parcelas_total ?? 1;
      const parcelaValor =
        parcelas > 1
          ? (r.parcelas_valor ?? Math.round((r.valor / parcelas) * 100) / 100)
          : r.valor;

      const purchasePeriodEnd = findPurchasePeriodEnd(r.data);
      if (!purchasePeriodEnd) continue; // compra muito antiga

      if (parcelas <= 1) {
        // À vista: valor total no período da compra
        const period = getOrCreatePeriod(purchasePeriodEnd);
        period.receipts.push({
          id: r.id,
          titulo: r.titulo,
          valor: r.valor,
          parcelas_total: 1,
          parcelas_valor: r.valor,
          data: r.data,
          categoria_pagamento: r.categoria_pagamento ?? null,
        });
        period.total += r.valor;
      } else {
        // Parcelado: distribui parcelas_valor em N meses consecutivos
        for (let installment = 0; installment < parcelas; installment++) {
          const installmentPeriodEnd = addMonths(
            purchasePeriodEnd,
            installment,
          );

          // Mostrar até 12 meses no futuro
          if (installmentPeriodEnd > addMonths(openEnd, 12)) continue;

          const period = getOrCreatePeriod(installmentPeriodEnd);
          period.receipts.push({
            id: `${r.id}-p${installment + 1}`,
            titulo: `${r.titulo} (${installment + 1}/${parcelas})`,
            valor: parcelaValor,
            parcelas_total: parcelas,
            parcelas_valor: parcelaValor,
            data: r.data,
            categoria_pagamento: r.categoria_pagamento ?? null,
          });
          period.total += parcelaValor;
        }
      }
    }

    // Ordenar: aberta → futuros (asc, mais próximo primeiro) → fechados (desc mais recentes primeiro)
    const sortedPeriods = Array.from(periodsMap.values()).sort((a, b) => {
      if (a.isOpen) return -1;
      if (b.isOpen) return 1;
      if (a.isFuture && b.isFuture) return a.endDate.localeCompare(b.endDate); // asc: próximo primeiro
      if (a.isFuture && !b.isFuture) return -1; // futuros antes dos fechados
      if (!a.isFuture && b.isFuture) return 1;
      return b.endDate.localeCompare(a.endDate); // desc para fechadas
    });

    return { card, periods: sortedPeriods };
  });

  return { success: true, data: invoices };
}

export async function deleteCreditCardAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  // Soft delete: marca como inativo
  const { error } = await supabase
    .from("credit_cards")
    .update({ ativo: false })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/credit-cards");
  return { success: true };
}
