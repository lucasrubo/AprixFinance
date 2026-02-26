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
  installment_number?: number;
  duracao?: number;
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

      const expenseStartDate = new Date(`${expense.data_inicio}T12:00:00`);

      // Helper: retorna o dia de pagamento clampado ao último dia do mês
      const clampedPayDay = (year: number, month: number) => {
        const lastDay = new Date(year, month + 1, 0).getDate();
        return Math.min(expense.data_pagamento, lastDay);
      };

      // Calcular a primeira ocorrência (mês de startPeriod, dia clampado)
      let curYear = startPeriod.getFullYear();
      let curMonth = startPeriod.getMonth();
      let payDay = clampedPayDay(curYear, curMonth);
      let currentPaymentDate = new Date(curYear, curMonth, payDay);

      // Se o dia de pagamento já passou no mês de início, avançar para o próximo mês
      if (currentPaymentDate < startPeriod) {
        curMonth += 1;
        if (curMonth > 11) { curMonth = 0; curYear += 1; }
        payDay = clampedPayDay(curYear, curMonth);
        currentPaymentDate = new Date(curYear, curMonth, payDay);
      }

      // Gerar ocorrências mês a mês até o fim do período
      while (currentPaymentDate <= endPeriod) {
        // Calcular número da parcela (meses desde o início + 1)
        const installmentNumber =
          (currentPaymentDate.getFullYear() - expenseStartDate.getFullYear()) *
            12 +
          (currentPaymentDate.getMonth() - expenseStartDate.getMonth()) +
          1;

        // Verificar se não ultrapassou a duração (se especificada)
        if (expense.duracao && installmentNumber > expense.duracao) {
          break;
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
          created_by: expense.created_by,
          installment_number: installmentNumber,
          duracao: expense.duracao ?? undefined,
        });

        // Ir para o próximo mês (clampando ao último dia do mês destino)
        const nextMonth = currentPaymentDate.getMonth() + 1;
        const nextYear =
          nextMonth > 11
            ? currentPaymentDate.getFullYear() + 1
            : currentPaymentDate.getFullYear();
        const nextMonthNorm = nextMonth > 11 ? 0 : nextMonth;
        const nextPayDay = clampedPayDay(nextYear, nextMonthNorm);
        currentPaymentDate = new Date(nextYear, nextMonthNorm, nextPayDay);
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

    // Buscar receitas normais do mês atual
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

    // Buscar parcelamentos de meses anteriores ainda ativos neste mês
    const prevLookback = new Date(`${currentMonth}-01T12:00:00`);
    prevLookback.setMonth(prevLookback.getMonth() - 24);
    const { data: prevParcelados } = await supabase
      .from("receipts")
      .select("id, valor, parcelas_total, parcelas_valor, data")
      .eq("user_id", user.id)
      .eq("tipo", "saida")
      .gt("parcelas_total", 1)
      .lt("data", startDate)
      .gte("data", prevLookback.toISOString().split("T")[0]);

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

    // Parcelados no mês atual: contar apenas a parcela do mês (não o total da compra)
    const totalExpensesFromReceipts = expenseReceipts.reduce((sum, r) => {
      const parcelas = r.parcelas_total ?? 1;
      if (parcelas > 1) {
        return sum + (r.parcelas_valor ?? Math.round((r.valor / parcelas) * 100) / 100);
      }
      return sum + r.valor;
    }, 0);

    // Parcelas de meses anteriores ainda ativas neste mês (por mês do calendário)
    const currentMonthBase = new Date(`${currentMonth}-01T12:00:00`);
    const totalInstallmentsFromPrev = (prevParcelados ?? []).reduce((sum, r) => {
      const purchaseDate = new Date(`${r.data}T12:00:00`);
      const monthsDiff =
        (currentMonthBase.getFullYear() - purchaseDate.getFullYear()) * 12 +
        (currentMonthBase.getMonth() - purchaseDate.getMonth());
      if (monthsDiff > 0 && monthsDiff < (r.parcelas_total ?? 1)) {
        return sum + (r.parcelas_valor ?? Math.round((r.valor / (r.parcelas_total ?? 1)) * 100) / 100);
      }
      return sum;
    }, 0);

    const totalFixedExpenses = fixedExpenseOccurrences.reduce(
      (sum, fe) => sum + fe.valor_parcela,
      0,
    );
    const totalExpenses = totalExpensesFromReceipts + totalFixedExpenses + totalInstallmentsFromPrev;
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
