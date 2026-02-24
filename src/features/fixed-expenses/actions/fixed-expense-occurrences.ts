"use server";

import { createClient } from "@/shared/utils/supabase/server";

export interface FixedExpenseOccurrence {
  id: string;
  titulo: string;
  valor_parcela: number;
  categoria: string;
  data_pagamento: number;
  occurrence_date: string;
  status: string;
  descricao?: string;
  created_by?: string;
}

// Gerar ocorrências de gastos fixos para um período específico
export async function generateFixedExpenseOccurrences(
  startDate: string,
  endDate: string,
): Promise<FixedExpenseOccurrence[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    // Buscar gastos fixos ativos
    const { data: fixedExpenses } = await supabase
      .from("fixed_expenses")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "ativo")
      .lte("data_inicio", endDate); // Só incluir gastos que já começaram

    if (!fixedExpenses || fixedExpenses.length === 0) {
      return [];
    }

    const occurrences: FixedExpenseOccurrence[] = [];

    for (const expense of fixedExpenses) {
      const startPeriod = new Date(
        Math.max(
          new Date(startDate).getTime(),
          new Date(expense.data_inicio).getTime(),
        ),
      );
      const endPeriod = new Date(endDate);

      // Calcular a primeira ocorrência
      const firstPaymentDate = new Date(startPeriod);
      firstPaymentDate.setDate(expense.data_pagamento);

      // Se o dia do pagamento já passou no mês de início, começar no próximo mês
      if (firstPaymentDate < startPeriod) {
        firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
      }

      const currentPaymentDate = new Date(firstPaymentDate);

      // Gerar ocorrências mês a mês até o fim do período
      while (currentPaymentDate <= endPeriod) {
        // Verificar se não ultrapassou a duração (se especificada)
        if (expense.duracao) {
          const monthsDiff =
            (currentPaymentDate.getFullYear() -
              new Date(expense.data_inicio).getFullYear()) *
              12 +
            currentPaymentDate.getMonth() -
            new Date(expense.data_inicio).getMonth();

          if (monthsDiff >= expense.duracao) {
            break;
          }
        }

        occurrences.push({
          id: `${expense.id}_${currentPaymentDate.getFullYear()}_${currentPaymentDate.getMonth() + 1}`,
          titulo: expense.titulo,
          valor_parcela: expense.valor_parcela,
          categoria: expense.categoria,
          data_pagamento: expense.data_pagamento,
          occurrence_date: currentPaymentDate.toISOString().split("T")[0],
          status: expense.status,
          descricao: expense.descricao,
        });

        // Ir para o próximo mês
        currentPaymentDate.setMonth(currentPaymentDate.getMonth() + 1);
      }
    }

    return occurrences.sort(
      (a, b) =>
        new Date(b.occurrence_date).getTime() -
        new Date(a.occurrence_date).getTime(),
    );
  } catch (error) {
    console.error("Erro ao gerar ocorrências de gastos fixos:", error);
    return [];
  }
}

// Obter estatísticas mensais incluindo gastos fixos
export async function getMonthlyStatsWithFixedExpenses(month?: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuário não autenticado" };
    }

    const currentMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM
    const startDate = `${currentMonth}-01`;
    const endDate = new Date(`${currentMonth}-01`);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);
    const endDateStr = endDate.toISOString().slice(0, 10);

    // Buscar receitas normais
    const { data: receipts, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("user_id", user.id)
      .gte("data", startDate)
      .lte("data", endDateStr);

    if (error) {
      console.error("Erro ao buscar receitas:", error);
      return { error: "Erro ao buscar receitas" };
    }

    // Gerar ocorrências de gastos fixos para o mês
    const fixedExpenseOccurrences = await generateFixedExpenseOccurrences(
      startDate,
      endDateStr,
    );

    // Combinar receitas normais com gastos fixos
    const allReceipts = receipts || [];
    const incomeReceipts = allReceipts.filter((r) => r.tipo === "entrada");
    const expenseReceipts = allReceipts.filter((r) => r.tipo === "saida");

    // Calcular valores
    const totalIncome = incomeReceipts.reduce((sum, r) => sum + r.valor, 0);
    const totalExpensesFromReceipts = expenseReceipts.reduce(
      (sum, r) => sum + r.valor,
      0,
    );
    const totalFixedExpenses = fixedExpenseOccurrences.reduce(
      (sum, fe) => sum + fe.valor_parcela,
      0,
    );
    const totalExpenses = totalExpensesFromReceipts + totalFixedExpenses;
    const netBalance = totalIncome - totalExpenses;

    const totalReceipts = allReceipts.length + fixedExpenseOccurrences.length;
    const averagePerReceipt =
      totalReceipts > 0
        ? (totalExpensesFromReceipts + totalFixedExpenses) / totalReceipts
        : 0;

    // Agrupar gastos por dia (incluindo gastos fixos)
    const spendingByDay = expenseReceipts.reduce(
      (acc, r) => {
        const day = r.data;
        acc[day] = (acc[day] || 0) + r.valor;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Adicionar gastos fixos ao agrupamento
    for (const fe of fixedExpenseOccurrences) {
      const day = fe.occurrence_date;
      spendingByDay[day] = (spendingByDay[day] || 0) + fe.valor_parcela;
    }

    const spendingByDayArray = Object.entries(spendingByDay).map(
      ([date, amount]) => ({
        date,
        amount: Number(amount),
      }),
    );

    return {
      success: true,
      data: {
        total_spent: totalExpenses,
        total_income: totalIncome,
        net_balance: netBalance,
        total_receipts: totalReceipts,
        average_per_receipt: averagePerReceipt,
        spending_by_day: spendingByDayArray,
        fixed_expense_occurrences: fixedExpenseOccurrences,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas com gastos fixos:", error);
    return { error: "Erro interno" };
  }
}
