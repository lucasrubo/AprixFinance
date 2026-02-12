import { createClient } from "@/shared/utils/supabase/server";
import { getMonthlyStatsAction } from "@/features/receipts/actions/receipt-actions";
import {
  getMonthlyStatsWithFixedExpenses,
  generateFixedExpenseOccurrences,
} from "@/features/fixed-expenses/actions/fixed-expense-occurrences";
import { DashboardClient } from "./dashboard-client";
import { TransactionItemProps } from "@/features/dashboard/types";

export const dynamic = "force-dynamic";

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

export default async function DashboardPage() {
  const supabase = await createClient();

  // Buscar dados do usuário
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  let userProfile = { nome: "Usuário" };
  if (userId) {
    const { data: profileData } = await supabase
      .from("users")
      .select("nome, email")
      .eq("id", userId)
      .single();

    if (profileData) {
      userProfile = {
        nome: profileData.nome || profileData.email || "Usuário",
      };
    }
  }

  // Buscar estatísticas mensais incluindo gastos fixos
  const statsResult = await getMonthlyStatsWithFixedExpenses();
  const stats = statsResult.success
    ? statsResult.data
    : {
        total_spent: 0,
        total_income: 0,
        net_balance: 0,
        total_receipts: 0,
        average_per_receipt: 0,
        spending_by_day: [],
        fixed_expense_occurrences: [],
      };

  // Formatar estatísticas para exibição
  const formattedStats = {
    ...stats,
    total_income_formatted: formatCurrency(stats.total_income),
    total_spent_formatted: formatCurrency(stats.total_spent),
    net_balance_formatted: formatCurrency(stats.net_balance),
  };

  // Buscar recibos recentes com dados dos grupos
  const { data: recentReceipts } = await supabase
    .from("receipts")
    .select(
      `
      id,
      user_id,
      titulo,
      valor,
      descricao,
      data,
      tipo,
      group_id,
      created_at
    `,
    )
    .order("data", { ascending: false })
    .limit(50);

  // Gerar ocorrências de gastos fixos para os últimos 6 meses
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const today = new Date();

  const fixedExpenseOccurrences = await generateFixedExpenseOccurrences(
    sixMonthsAgo.toISOString().split("T")[0],
    today.toISOString().split("T")[0],
  );

  // Buscar nomes dos grupos separadamente se houver recibos
  let receiptsWithGroups = recentReceipts;
  if (recentReceipts && recentReceipts.length > 0) {
    const groupIds = recentReceipts.map((r) => r.group_id).filter((id) => id);
    if (groupIds.length > 0) {
      const { data: groups } = await supabase
        .from("groups")
        .select("id, nome")
        .in("id", groupIds);

      receiptsWithGroups = recentReceipts.map((receipt) => ({
        ...receipt,
        groups: groups?.find((g) => g.id === receipt.group_id),
      }));
    }
  }

  // Buscar nomes dos usuários separadamente se houver recibos
  let receiptsWithUsers = receiptsWithGroups;
  if (receiptsWithGroups && receiptsWithGroups.length > 0) {
    const userIds = receiptsWithGroups.map((r) => r.user_id).filter((id) => id);
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, nome")
        .in("id", userIds);

      receiptsWithUsers = receiptsWithGroups.map((receipt) => ({
        ...receipt,
        users: users?.find((u) => u.id === receipt.user_id),
      }));
    }
  }

  // Formatar os dados dos recibos recentes
  const formattedReceipts: TransactionItemProps[] =
    receiptsWithUsers?.map((receipt: any) => ({
      id: receipt.id,
      title: receipt.titulo,
      group: receipt.groups?.nome || "Sem grupo",
      date: formatDate(receipt.data), // Usar string diretamente
      amount: formatCurrency(receipt.valor),
      type:
        receipt.tipo === "entrada" ? ("income" as const) : ("expense" as const),
      description: receipt.descricao || "",
      itemType: "receipt" as const,
      category: receipt.tipo === "entrada" ? "Receita" : "Despesa",
      status: "concluído",
      sortDate: receipt.data, // Usar string para ordenação (YYYY-MM-DD)
      created_by: receipt.users?.nome,
    })) || [];

  // Formatar os dados dos gastos fixos como ocorrências
  const formattedFixedExpenses: TransactionItemProps[] =
    fixedExpenseOccurrences?.map((occurrence) => ({
      id: occurrence.id,
      title: occurrence.titulo,
      group: "Gasto Fixo",
      date: formatDate(occurrence.occurrence_date), // Usar string diretamente
      amount: formatCurrency(occurrence.valor_parcela),
      type: "expense" as const,
      description:
        occurrence.descricao || `Pagamento mensal - ${occurrence.categoria}`,
      itemType: "fixed_expense" as const,
      category: occurrence.categoria,
      status: "automático",
      sortDate: occurrence.occurrence_date, // Usar string para ordenação (YYYY-MM-DD)
      created_by: occurrence.created_by,
    })) || [];

  // Combinar e ordenar todas as transações por data (mais recentes primeiro)
  const allTransactions = [...formattedReceipts, ...formattedFixedExpenses]
    .sort((a, b) => {
      // Usar comparação de string direta para datas no formato YYYY-MM-DD
      const dateA = (a as any).sortDate || "0000-00-00";
      const dateB = (b as any).sortDate || "0000-00-00";
      return dateB.localeCompare(dateA); // Ordem decrescente
    })
    .slice(0, 20); // Limitar a 20 itens mais recentes

  return (
    <DashboardClient
      userProfile={userProfile}
      stats={formattedStats}
      recentTransactions={allTransactions}
    />
  );
}
