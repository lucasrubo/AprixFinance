import { getCreditCardStatsAction } from "@/features/credit-cards/actions/credit-card-actions";
import type { TransactionItemProps } from "@/features/dashboard/types";
import { getMonthlyStatsWithFixedExpenses } from "@/features/fixed-expenses/actions/fixed-expense-occurrences";
import { createClient } from "@/shared/utils/supabase/server";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
};

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Disparar todas as queries independentes em paralelo
  const [authResult, statsResult, creditCardResult, receiptsResult] =
    await Promise.all([
      supabase.auth.getUser(),
      getMonthlyStatsWithFixedExpenses(),
      getCreditCardStatsAction(),
      supabase
        .from("receipts")
        .select(
          `
          id, user_id, titulo, valor, descricao, data, tipo, group_id,
          parcelas_total, parcelas_valor,
          groups:group_id(id, nome),
          users:user_id(id, nome)
        `,
        )
        .order("data", { ascending: false })
        .limit(20),
    ]);

  // Profile precisa do userId — query rápida (1 row por PK)
  const userId = authResult.data.user?.id;
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

  const creditCardStats = creditCardResult.data ?? [];

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

  const formattedStats = {
    ...stats,
    total_income_formatted: formatCurrency(stats.total_income),
    total_spent_formatted: formatCurrency(stats.total_spent),
    net_balance_formatted: formatCurrency(stats.net_balance),
  };

  // Reutilizar as ocorrências já computadas por getMonthlyStatsWithFixedExpenses
  // (evita chamar generateFixedExpenseOccurrences duplicado)
  const fixedExpenseOccurrences = stats.fixed_expense_occurrences ?? [];

  const recentReceipts = receiptsResult.data;

  const today = new Date();

  const formattedReceipts: TransactionItemProps[] =
    recentReceipts?.map((receipt: any) => {
      const parcelasTotal = receipt.parcelas_total ?? 1;
      let installmentNumber: number | undefined;
      if (parcelasTotal > 1) {
        const purchaseDate = new Date(`${receipt.data}T12:00:00`);
        const monthsDiff =
          (today.getFullYear() - purchaseDate.getFullYear()) * 12 +
          (today.getMonth() - purchaseDate.getMonth());
        installmentNumber = Math.min(parcelasTotal, Math.max(1, monthsDiff + 1));
      }
      return {
        id: receipt.id,
        title: receipt.titulo,
        group: receipt.groups?.nome || "Sem grupo",
        date: formatDate(receipt.data),
        amount: formatCurrency(receipt.valor),
        type:
          receipt.tipo === "entrada"
            ? ("income" as const)
            : ("expense" as const),
        description: receipt.descricao || "",
        itemType: "receipt" as const,
        category: receipt.tipo === "entrada" ? "Receita" : "Despesa",
        status: "concluído",
        sortDate: receipt.data,
        created_by: receipt.users?.nome,
        parcelas_total: parcelasTotal,
        parcelas_valor: receipt.parcelas_valor ?? receipt.valor,
        installment_number: installmentNumber,
      };
    }) || [];

  const formattedFixedExpenses: TransactionItemProps[] =
    fixedExpenseOccurrences.map((occurrence) => ({
      id: occurrence.id,
      title: occurrence.titulo,
      group: "Gasto Fixo",
      date: formatDate(occurrence.occurrence_date),
      amount: formatCurrency(occurrence.valor_parcela),
      type: "expense" as const,
      description:
        occurrence.descricao || `Pagamento mensal - ${occurrence.categoria}`,
      itemType: "fixed_expense" as const,
      category: occurrence.categoria,
      status: "automático",
      sortDate: occurrence.occurrence_date,
      created_by: occurrence.created_by,
      installment_number: occurrence.installment_number,
      duracao: occurrence.duracao,
    }));

  const allTransactions = [...formattedReceipts, ...formattedFixedExpenses]
    .sort((a, b) => {
      const dateA = a.sortDate || "0000-00-00";
      const dateB = b.sortDate || "0000-00-00";
      return dateB.localeCompare(dateA);
    })
    .slice(0, 20);

  return (
    <DashboardClient
      userProfile={userProfile}
      stats={formattedStats}
      recentTransactions={allTransactions}
      creditCardStats={creditCardStats}
    />
  );
}
