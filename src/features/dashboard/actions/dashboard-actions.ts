"use server";

import { createClient } from "@/shared/utils/supabase/server";

export interface FinancialDataPoint {
  date: string; // "YYYY-MM" — agregação mensal
  income: number;
  expenses: number;
}

/**
 * Retorna dados financeiros agregados por MÊS CALENDÁRIO completo.
 * - "30d" → últimos 3 meses
 * - "2m"  → últimos 6 meses
 * - "1y"  → últimos 12 meses
 *
 * Cada ponto representa o mês inteiro, incluindo gastos fixos futuros
 * do mesmo mês — igual ao comportamento do dashboard de estatísticas.
 */
export async function getFinancialChartData(period: "30d" | "2m" | "1y") {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const now = new Date();

    // Meses a exibir (mais antigo primeiro)
    const monthCount = period === "1y" ? 12 : period === "2m" ? 6 : 3;

    const months = Array.from({ length: monthCount }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - i), 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      return {
        year: y,
        month: m,
        key: `${y}-${String(m + 1).padStart(2, "0")}`,
        startStr: `${y}-${String(m + 1).padStart(2, "0")}-01`,
        endStr: new Date(y, m + 1, 0).toISOString().split("T")[0],
      };
    });

    const startDate = months[0].startStr;
    const endDate = months[months.length - 1].endStr;

    // Buscar os 3 conjuntos de dados em paralelo
    const prevLookback = new Date(months[0].year, months[0].month - 24, 1)
      .toISOString()
      .split("T")[0];

    const [receiptsResult, prevParceladosResult, fixedExpensesResult] =
      await Promise.all([
        supabase
          .from("receipts")
          .select("valor, data, tipo, parcelas_total, parcelas_valor")
          .eq("user_id", user.id)
          .gte("data", startDate)
          .lte("data", endDate),

        supabase
          .from("receipts")
          .select("valor, data, parcelas_total, parcelas_valor")
          .eq("user_id", user.id)
          .eq("tipo", "saida")
          .gt("parcelas_total", 1)
          .lt("data", startDate)
          .gte("data", prevLookback),

        supabase
          .from("fixed_expenses")
          .select("id, valor_parcela, data_inicio, data_pagamento, duracao, status")
          .eq("user_id", user.id)
          .eq("status", "ativo")
          .lte("data_inicio", endDate),
      ]);

    const receipts = receiptsResult.data ?? [];
    const prevParcelados = prevParceladosResult.data ?? [];
    const fixedExpenses = fixedExpensesResult.data ?? [];

    // Inicializar mapa mensal
    const dataMap = new Map<string, { income: number; expenses: number }>();
    for (const m of months) dataMap.set(m.key, { income: 0, expenses: 0 });

    // ── Receitas e despesas variáveis dentro do período ───────────────────────
    for (const receipt of receipts) {
      const key = receipt.data.slice(0, 7); // "YYYY-MM"
      if (!dataMap.has(key)) continue;
      const entry = dataMap.get(key)!;

      if (receipt.tipo === "entrada") {
        entry.income += receipt.valor;
      } else {
        const parcelas = receipt.parcelas_total ?? 1;
        const parcelaValor =
          parcelas > 1
            ? (receipt.parcelas_valor ??
                Math.round((receipt.valor / parcelas) * 100) / 100)
            : receipt.valor;
        entry.expenses += parcelaValor;
      }
    }

    // ── Parcelas de compras anteriores ainda ativas no período ────────────────
    for (const r of prevParcelados) {
      const parcelas = r.parcelas_total ?? 1;
      const parcelaValor =
        r.parcelas_valor ?? Math.round((r.valor / parcelas) * 100) / 100;
      const purchaseDate = new Date(`${r.data}T12:00:00`);

      for (let i = 1; i < parcelas; i++) {
        // Usar dia 1 para evitar overflow de meses (ex: 31 de jan → março)
        const installmentDate = new Date(
          purchaseDate.getFullYear(),
          purchaseDate.getMonth() + i,
          1,
        );
        const key = `${installmentDate.getFullYear()}-${String(installmentDate.getMonth() + 1).padStart(2, "0")}`;
        if (dataMap.has(key)) {
          dataMap.get(key)!.expenses += parcelaValor;
        }
      }
    }

    // ── Gastos fixos: uma ocorrência por mês calendário ───────────────────────
    for (const expense of fixedExpenses) {
      const expenseStart = new Date(`${expense.data_inicio}T12:00:00`);

      for (const m of months) {
        // Verificar se o gasto já havia iniciado neste mês
        if (expenseStart > new Date(m.year, m.month + 1, 0)) continue;

        // Número da parcela (1-based)
        const installmentNumber =
          (m.year - expenseStart.getFullYear()) * 12 +
          (m.month - expenseStart.getMonth()) +
          1;

        if (installmentNumber < 1) continue;
        if (expense.duracao && installmentNumber > expense.duracao) continue;

        dataMap.get(m.key)!.expenses += expense.valor_parcela;
      }
    }

    // Montar resultado com arredondamento
    const result: FinancialDataPoint[] = months.map((m) => ({
      date: m.key,
      income: Math.round(dataMap.get(m.key)!.income * 100) / 100,
      expenses: Math.round(dataMap.get(m.key)!.expenses * 100) / 100,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error in getFinancialChartData:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
