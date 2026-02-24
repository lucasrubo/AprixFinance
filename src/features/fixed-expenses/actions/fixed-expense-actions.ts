"use server";

import { createClient } from "@/shared/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { CreateFixedExpenseData, UpdateFixedExpenseData } from "../types";

// Buscar gastos fixos do usuário
export async function getFixedExpensesAction() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuário não autenticado" };
    }

    const { data, error } = await supabase
      .from("fixed_expenses")
      .select(
        `
        *,
        users (
          nome,
          email
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar gastos fixos:", error);
      return { error: "Erro ao buscar gastos fixos" };
    }

    // Mapear os dados para incluir created_by
    const mappedData = data?.map((expense: any) => ({
      ...expense,
      created_by: expense.users,
    }));

    return { success: true, data: mappedData };
  } catch (error) {
    console.error("Erro ao buscar gastos fixos:", error);
    return { error: "Erro ao buscar gastos fixos" };
  }
}

// Criar novo gasto fixo
export async function createFixedExpenseAction(data: CreateFixedExpenseData) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuário não autenticado" };
    }

    const expenseData = {
      ...data,
      user_id: user.id,
    };

    const { data: result, error } = await supabase
      .from("fixed_expenses")
      .insert(expenseData)
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar gasto fixo:", error);
      return { error: "Erro ao criar gasto fixo" };
    }

    revalidatePath("/dashboard/fixed-expenses");
    return { success: true, data: result };
  } catch (error) {
    console.error("Erro ao criar gasto fixo:", error);
    return { error: "Erro interno" };
  }
}

// Atualizar gasto fixo
export async function updateFixedExpenseAction(
  id: string,
  data: UpdateFixedExpenseData,
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuário não autenticado" };
    }

    const { data: result, error } = await supabase
      .from("fixed_expenses")
      .update(data)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar gasto fixo:", error);
      return { error: "Erro ao atualizar gasto fixo" };
    }

    revalidatePath("/dashboard/fixed-expenses");
    return { success: true, data: result };
  } catch (error) {
    console.error("Erro ao atualizar gasto fixo:", error);
    return { error: "Erro interno" };
  }
}

// Deletar gasto fixo
export async function deleteFixedExpenseAction(id: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuário não autenticado" };
    }

    const { error } = await supabase
      .from("fixed_expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao deletar gasto fixo:", error);
      return { error: "Erro ao deletar gasto fixo" };
    }

    revalidatePath("/dashboard/fixed-expenses");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar gasto fixo:", error);
    return { error: "Erro interno" };
  }
}

// Alternar status do gasto fixo (ativo/pausado)
export async function toggleFixedExpenseStatusAction(
  id: string,
  status: "ativo" | "pausado" | "cancelado",
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuário não autenticado" };
    }

    const { data: result, error } = await supabase
      .from("fixed_expenses")
      .update({ status })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao alterar status:", error);
      return { error: "Erro ao alterar status" };
    }

    revalidatePath("/dashboard/fixed-expenses");
    return { success: true, data: result };
  } catch (error) {
    console.error("Erro ao alterar status:", error);
    return { error: "Erro interno" };
  }
}
