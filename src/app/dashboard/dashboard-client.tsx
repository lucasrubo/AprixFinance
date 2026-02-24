"use client";

import React, { useState } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  PieChart,
  Users,
  FileText,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransactionModal } from "./contexts";
import { useCreateReceiptModal } from "./contexts";
import { useSearch } from "./contexts";
import { TransactionItemProps } from "@/features/dashboard/types";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { ActionCard } from "@/features/dashboard/components/action-card";
import { TransactionItem } from "@/features/dashboard/components/transaction-item";
import { AIAssistantCard } from "@/features/dashboard/components/ai-assistant-card";
import { FinancialChart } from "@/features/dashboard/components/financial-chart";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

interface DashboardClientProps {
  userProfile: any;
  stats: any;
  recentTransactions: TransactionItemProps[];
}

export function DashboardClient({
  userProfile,
  stats,
  recentTransactions,
}: DashboardClientProps) {
  const { searchTerm } = useSearch();
  const { openTransactionModal } = useTransactionModal();
  const { openCreateReceiptModal } = useCreateReceiptModal();
  const router = useRouter();
  const [isReloading, setIsReloading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleReload = () => {
    setIsReloading(true);
    router.refresh();
    setTimeout(() => setIsReloading(false), 2000); // Stop spinning after 2 seconds
  };

  const filteredTransactions = recentTransactions.filter(
    (transaction) =>
      transaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.group.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleTransactionClick = (transaction: TransactionItemProps) => {
    openTransactionModal(transaction);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-dashed border-border/60 bg-card/70 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </p>
          <h2 className="text-3xl font-semibold text-foreground">
            Olá, {userProfile?.nome || "Usuário"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Aqui está um panorama atualizado das suas finanças inteligentes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ActionCard
          title="Novo Recibo"
          description="Adicionar nova despesa"
          icon={Plus}
          color="blue"
          onClick={openCreateReceiptModal}
        />
        {!isMobile && (
          <>
            <ActionCard
              title="Gastos Fixos"
              description="Gerenciar despesas recorrentes"
              icon={PieChart}
              color="emerald"
              href="/dashboard/fixed-expenses"
            />
            <ActionCard
              title="Gerenciar Grupos"
              description="Organizar finanças familiares"
              icon={Users}
              color="purple"
              href="/dashboard/groups"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Receita Total"
          value={stats.total_income_formatted}
          subtext="Este mês"
          trend={stats.trends?.income?.direction || "up"}
          trendValue={stats.trends?.income?.value}
          icon={Wallet}
          accent="emerald"
        />
        <StatCard
          title="Gasto Total"
          value={stats.total_spent_formatted}
          subtext="Este mês"
          trend={stats.trends?.expenses?.direction || "down"}
          trendValue={stats.trends?.expenses?.value}
          icon={CreditCard}
          accent="rose"
        />
        <StatCard
          title="Saldo Líquido"
          value={stats.net_balance_formatted}
          subtext={stats.net_balance >= 0 ? "Saldo positivo" : "Saldo negativo"}
          icon={stats.net_balance >= 0 ? TrendingUp : TrendingDown}
          accent="slate"
        />
        <StatCard
          title="Notas Fiscais"
          value={stats.total_receipts.toString()}
          subtext="Processadas"
          trend={stats.trends?.receipts?.direction || "up"}
          trendValue={stats.trends?.receipts?.value}
          icon={FileText}
          accent="indigo"
        />
      </div>

      <FinancialChart />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-3xl border border-border/70 bg-card/95 shadow-lg shadow-black/5">
          <div className="flex items-center justify-between border-b border-border/70 px-6 py-4">
            <h3 className="font-bold text-lg text-foreground">
              Atividade Recente
            </h3>
            <Link href="/dashboard/receipts">
              <button className="rounded-full border border-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground">
                Ver tudo
              </button>
            </Link>
          </div>
          <ScrollArea className="h-[420px] px-2">
            <div className="space-y-1 px-4 py-2">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction, index) => (
                  <TransactionItem
                    key={index}
                    id={transaction.id || `receipt-${index}`}
                    title={transaction.title}
                    group={transaction.group}
                    date={transaction.date}
                    amount={transaction.amount}
                    type={transaction.type}
                    description={transaction.description}
                    itemType={transaction.itemType || "receipt"}
                    category={transaction.category}
                    status={transaction.status}
                    created_by={transaction.created_by}
                    onClick={() => handleTransactionClick(transaction)}
                  />
                ))
              ) : (
                <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <p className="text-sm font-medium">
                    Nenhum recibo encontrado.
                  </p>
                  <p className="text-xs">
                    Adicione seu primeiro registro para liberar insights.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <AIAssistantCard />
      </div>
    </div>
  );
}
