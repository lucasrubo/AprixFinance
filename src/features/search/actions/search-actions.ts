"use server";

import { createClient } from "@/shared/utils/supabase/server";
import { TransactionItemProps } from "@/features/dashboard/types";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
};

const formatDate = (dateString: string) => {
  // Assumir que a string está no formato YYYY-MM-DD e formatar diretamente
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

export async function searchItemsAction(searchTerm: string): Promise<{
  success: boolean;
  data?: TransactionItemProps[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Buscar usuário atual
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const userId = userData.user.id;
    const results: TransactionItemProps[] = [];

    // Buscar receipts
    const { data: receipts } = await supabase
      .from("receipts")
      .select(
        `
        id,
        titulo,
        valor,
        descricao,
        tipo,
        data,
        group_id,
        groups:group_id (nome)
      `,
      )
      .eq("user_id", userId)
      .or(`titulo.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`)
      .order("data", { ascending: false })
      .limit(20);

    // Formatar receipts
    if (receipts) {
      receipts.forEach((receipt: any) => {
        results.push({
          id: receipt.id,
          title: receipt.titulo,
          group: receipt.groups?.nome || "Sem grupo",
          date: formatDate(receipt.data),
          amount: formatCurrency(receipt.valor),
          type: receipt.tipo === "entrada" ? "income" : "expense",
          description: receipt.descricao || "",
          itemType: "receipt",
        });
      });
    }

    // Buscar fixed_expenses
    const { data: fixedExpenses } = await supabase
      .from("fixed_expenses")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "ativo")
      .or(`titulo.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`)
      .order("data_pagamento", { ascending: true })
      .limit(20);

    // Formatar fixed_expenses
    if (fixedExpenses) {
      fixedExpenses.forEach((expense: any) => {
        results.push({
          id: expense.id,
          title: expense.titulo,
          group: "Gasto Fixo",
          date: `Dia ${expense.data_pagamento}`,
          amount: formatCurrency(expense.valor_parcela),
          type: "expense",
          description: expense.descricao || "",
          itemType: "fixed_expense",
          category: expense.categoria,
          status: expense.status,
        });
      });
    }

    // Ordenar resultados por relevância (título primeiro, depois descrição)
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(searchTerm.toLowerCase());
      const bTitle = b.title.toLowerCase().includes(searchTerm.toLowerCase());

      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;

      // Se ambos têm no título ou ambos não têm, ordenar por data (mais recente primeiro)
      return b.date.localeCompare(a.date);
    });

    return { success: true, data: results.slice(0, 15) };
  } catch (error) {
    console.error("Erro na busca:", error);
    return { success: false, error: "Erro ao realizar busca" };
  }
}
