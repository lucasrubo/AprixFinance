"use server";

import { createClient } from "@/shared/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { Receipt } from "@/shared/types";

export async function createReceiptAction(formData: FormData) {
  const titulo = formData.get("titulo") as string;
  const valor = parseFloat(formData.get("valor") as string);
  const descricao = formData.get("descricao") as string;
  const dataValue = formData.get("data") as string;
  const groupId = formData.get("groupId") as string;
  const tipo = (formData.get("tipo") as string) || "saida";
  const categoria_pagamento = (formData.get("categoria_pagamento") as string) || "debito";

  if (!titulo || !valor || !dataValue) {
    return { error: "Campos obrigatórios não preenchidos" };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuário não autenticado" };
    }

    const receiptData: any = {
      user_id: user.id,
      titulo,
      valor,
      descricao,
      data: dataValue,
      tipo,
      categoria_pagamento,
    };

    if (groupId) {
      receiptData.group_id = groupId;
    }

    const { data, error } = await supabase
      .from("receipts")
      .insert(receiptData)
      .select()
      .single();

    if (error) {
      console.error("Error creating receipt:", error);
      return { error: "Erro ao criar recibo" };
    }

    revalidatePath("/dashboard/receipts");
    return { success: true, data };
  } catch (error) {
    console.error("Erro ao criar recibo:", error);
    return { error: "Erro interno" };
  }
}

export async function getReceiptsAction() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuário não autenticado" };
    }

    const { data, error } = await supabase
      .from("receipts")
      .select(
        `
        *,
        users (
          nome,
          email
        ),
        groups (
          nome
        )
      `,
      )
      .or(
        `user_id.eq.${user.id},group_id.in.(${await getUserGroupIds(user.id)})`,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar recibos:", error);
      return { error: "Erro ao buscar recibos" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Erro ao buscar recibos:", error);
    return { error: "Erro ao buscar recibos" };
  }
}

async function getUserGroupIds(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);

  return data?.map((g) => g.group_id).join(",") || "";
}

export async function updateReceiptAction(
  receiptId: string,
  formData: FormData,
) {
  if (!receiptId) {
    return { error: "ID do recibo é obrigatório" };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuário não autenticado" };
    }

    const titulo = formData.get("titulo") as string;
    const valor = parseFloat(formData.get("valor") as string);
    const descricao = formData.get("descricao") as string;
    const dataValue = formData.get("data") as string;
    const groupId = formData.get("groupId") as string;
    const tipo = (formData.get("tipo") as string) || "saida";

    const updateData: any = {
      titulo,
      valor,
      descricao,
      data: dataValue,
      tipo,
    };

    if (groupId) {
      updateData.group_id = groupId;
    }

    const { data, error } = await supabase
      .from("receipts")
      .update(updateData)
      .eq("id", receiptId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar recibo:", error);
      return { error: "Erro ao atualizar recibo" };
    }

    revalidatePath("/dashboard/receipts");
    return { success: true, data };
  } catch (error) {
    console.error("Erro ao atualizar recibo:", error);
    return { error: "Erro ao atualizar recibo" };
  }
}

export async function deleteReceiptAction(receiptId: string) {
  if (!receiptId) {
    return { error: "ID do recibo é obrigatório" };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuário não autenticado" };
    }

    const { error } = await supabase
      .from("receipts")
      .delete()
      .eq("id", receiptId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao deletar recibo:", error);
      return { error: "Erro ao excluir recibo" };
    }

    revalidatePath("/dashboard/receipts");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar recibo:", error);
    return { error: "Erro ao excluir recibo" };
  }
}

export async function getMonthlyStatsAction(month?: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuário não autenticado" };
    }

    const currentMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM

    // Função auxiliar para calcular stats de um mês específico
    const calculateMonthStats = async (monthStr: string) => {
      const startDate = `${monthStr}-01`;
      const endDate = new Date(monthStr + "-01");
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      const endDateStr = endDate.toISOString().slice(0, 10);

      const { data: receipts, error } = await supabase
        .from("receipts")
        .select("*")
        .eq("user_id", user.id)
        .gte("data", startDate)
        .lte("data", endDateStr);

      if (error) {
        console.error("Erro ao buscar estatísticas:", error);
        return null;
      }

      const totalSpent = receipts?.reduce((sum, r) => sum + r.valor, 0) || 0;
      const totalReceipts = receipts?.length || 0;
      const averagePerReceipt =
        totalReceipts > 0 ? totalSpent / totalReceipts : 0;

      // Separate income and expenses
      const incomeReceipts =
        receipts?.filter((r) => r.tipo === "entrada") || [];
      const expenseReceipts = receipts?.filter((r) => r.tipo === "saida") || [];

      const totalIncome = incomeReceipts.reduce((sum, r) => sum + r.valor, 0);
      const totalExpenses = expenseReceipts.reduce(
        (sum, r) => sum + r.valor,
        0,
      );
      const netBalance = totalIncome - totalExpenses;

      // Group by day (only expenses for spending chart)
      const spendingByDay =
        expenseReceipts?.reduce(
          (acc, r) => {
            const day = r.data;
            acc[day] = (acc[day] || 0) + r.valor;
            return acc;
          },
          {} as Record<string, number>,
        ) || {};

      const spendingByDayArray = Object.entries(spendingByDay).map(
        ([date, amount]) => ({
          date,
          amount: Number(amount),
        }),
      );

      return {
        total_spent: totalExpenses,
        total_income: totalIncome,
        net_balance: netBalance,
        total_receipts: totalReceipts,
        average_per_receipt: averagePerReceipt,
        spending_by_day: spendingByDayArray,
      };
    };

    // Calcular stats do mês atual
    const currentStats = await calculateMonthStats(currentMonth);
    if (!currentStats) {
      return { error: "Erro ao buscar estatísticas mensais" };
    }

    // Calcular stats do mês anterior para trends
    const currentDate = new Date(currentMonth + "-01");
    const previousDate = new Date(currentDate);
    previousDate.setMonth(previousDate.getMonth() - 1);
    const previousMonth = previousDate.toISOString().slice(0, 7);

    const previousStats = await calculateMonthStats(previousMonth);

    // Calcular trends
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return { direction: "up" as const, percentage: 0 };
      const change = ((current - previous) / previous) * 100;
      return {
        direction: change >= 0 ? ("up" as const) : ("down" as const),
        percentage: Math.abs(change),
      };
    };

    const incomeTrend = previousStats
      ? calculateTrend(currentStats.total_income, previousStats.total_income)
      : { direction: "up" as const, percentage: 0 };

    const expenseTrend = previousStats
      ? calculateTrend(currentStats.total_spent, previousStats.total_spent)
      : { direction: "down" as const, percentage: 0 };

    const receiptsTrend = previousStats
      ? calculateTrend(
          currentStats.total_receipts,
          previousStats.total_receipts,
        )
      : { direction: "up" as const, percentage: 0 };

    return {
      success: true,
      data: {
        ...currentStats,
        trends: {
          income: {
            direction: incomeTrend.direction,
            value: `${incomeTrend.direction === "up" ? "+" : "-"}${incomeTrend.percentage.toFixed(1)}%`,
          },
          expenses: {
            direction: expenseTrend.direction,
            value: `${expenseTrend.direction === "up" ? "+" : "-"}${expenseTrend.percentage.toFixed(1)}%`,
          },
          receipts: {
            direction: receiptsTrend.direction,
            value: `${receiptsTrend.direction === "up" ? "+" : "-"}${receiptsTrend.percentage.toFixed(1)}%`,
          },
        },
      },
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return { error: "Erro ao buscar estatísticas mensais" };
  }
}
