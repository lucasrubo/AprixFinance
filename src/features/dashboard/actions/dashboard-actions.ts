"use server";

import { createClient } from "@/shared/utils/supabase/server";
import { revalidatePath } from "next/cache";

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

    // Get receipts data
    const { data: receipts, error: receiptsError } = await supabase
      .from("receipts")
      .select("valor, data, tipo, user_id")
      .gte("data", startDateStr)
      .lte("data", endDateStr);

    if (receiptsError) {
      console.error("Error fetching receipts:", receiptsError);
      return { success: false, error: receiptsError.message };
    }

    // Get fixed expenses data - for chart, we need to get occurrences
    // For simplicity, get fixed expenses created in the period
    const { data: fixedExpenses, error: fixedError } = await supabase
      .from("fixed_expenses")
      .select("valor_parcela, data_inicio, user_id")
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

    // Add receipts (income if tipo = 'entrada', expenses if 'saida')
    receipts?.forEach((receipt) => {
      const date = receipt.data;
      if (dataMap.has(date)) {
        const current = dataMap.get(date)!;
        if (receipt.tipo === "entrada") {
          current.income += receipt.valor;
        } else {
          current.expenses += receipt.valor;
        }
      }
    });

    // Add fixed expenses
    fixedExpenses?.forEach((expense) => {
      const date = expense.data_inicio;
      if (dataMap.has(date)) {
        const current = dataMap.get(date)!;
        current.expenses += expense.valor_parcela;
      }
    });

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
