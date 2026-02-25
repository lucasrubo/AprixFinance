"use server";

import { createClient } from "@/shared/utils/supabase/server";

export interface FinancialDataPoint {
  date: string;
  income: number;
  expenses: number;
}

export async function getFinancialChartData(period: "30d" | "2m" | "1y") {
  try {
    const supabase = await createClient();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "2m":
        startDate.setMonth(endDate.getMonth() - 2);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Get user for RLS-safe queries
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Não autenticado" };

    // Receipts dentro do período (inclui campos de parcela)
    const { data: receipts, error: receiptsError } = await supabase
      .from("receipts")
      .select("valor, data, tipo, parcelas_total, parcelas_valor")
      .eq("user_id", user.id)
      .gte("data", startDateStr)
      .lte("data", endDateStr);

    if (receiptsError) {
      console.error("Error fetching receipts:", receiptsError);
      return { success: false, error: receiptsError.message };
    }

    // Parcelados de antes do período com parcelas ainda ativas nele
    const prevLookback = new Date(startDate);
    prevLookback.setMonth(prevLookback.getMonth() - 24);
    const { data: prevParcelados } = await supabase
      .from("receipts")
      .select("valor, data, parcelas_total, parcelas_valor")
      .eq("user_id", user.id)
      .eq("tipo", "saida")
      .gt("parcelas_total", 1)
      .lt("data", startDateStr)
      .gte("data", prevLookback.toISOString().split("T")[0]);

    // Gastos fixos criados no período
    const { data: fixedExpenses, error: fixedError } = await supabase
      .from("fixed_expenses")
      .select("valor_parcela, data_inicio, user_id")
      .eq("user_id", user.id)
      .gte("data_inicio", startDateStr)
      .lte("data_inicio", endDateStr);

    if (fixedError) {
      console.error("Error fetching fixed expenses:", fixedError);
      return { success: false, error: fixedError.message };
    }

    // Process data by date
    const dataMap = new Map<string, { income: number; expenses: number }>();

    // Initialize all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      dataMap.set(dateStr, { income: 0, expenses: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Adicionar receitas do período
    // Para parcelados: usar parcelas_valor (não valor total) no dia da compra
    for (const receipt of receipts ?? []) {
      const date = receipt.data;
      if (dataMap.has(date)) {
        // biome-ignore lint/style/noNonNullAssertion: dataMap.has(date) garante que o valor existe
        const current = dataMap.get(date)!;
        if (receipt.tipo === "entrada") {
          current.income += receipt.valor;
        } else {
          const parcelas = receipt.parcelas_total ?? 1;
          const parcelaValor =
            parcelas > 1
              ? (receipt.parcelas_valor ??
                Math.round((receipt.valor / parcelas) * 100) / 100)
              : receipt.valor;
          current.expenses += parcelaValor;
        }
      }
    }

    // Distribuir parcelas de compras anteriores cujos vencimentos caem no período
    for (const r of prevParcelados ?? []) {
      const parcelas = r.parcelas_total ?? 1;
      const parcelaValor =
        r.parcelas_valor ??
        Math.round((r.valor / parcelas) * 100) / 100;
      const purchaseDate = new Date(`${r.data}T12:00:00`);

      for (let i = 1; i < parcelas; i++) {
        // Cada parcela cai no mesmo dia do mês, n meses após a compra
        const installmentDate = new Date(
          purchaseDate.getFullYear(),
          purchaseDate.getMonth() + i,
          purchaseDate.getDate(),
        );
        const installmentStr = installmentDate.toISOString().split("T")[0];

        if (dataMap.has(installmentStr)) {
          // biome-ignore lint/style/noNonNullAssertion: dataMap.has(installmentStr) garante que o valor existe
          dataMap.get(installmentStr)!.expenses += parcelaValor;
        }
      }
    }

    // Add fixed expenses
    for (const expense of fixedExpenses ?? []) {
      const date = expense.data_inicio;
      if (dataMap.has(date)) {
        // biome-ignore lint/style/noNonNullAssertion: dataMap.has(date) garante que o valor existe
        const current = dataMap.get(date)!;
        current.expenses += expense.valor_parcela;
      }
    }

    // Convert to array and sort by date
    const result: FinancialDataPoint[] = Array.from(dataMap.entries())
      .map(([date, values]) => ({
        date,
        income: values.income,
        expenses: values.expenses,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error in getFinancialChartData:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
