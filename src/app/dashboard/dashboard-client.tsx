"use client";

import React from "react";
import {
  Plus,
  TrendingUp,
  Wallet,
  CreditCard,
  MessageSquare,
  Sparkles,
  PieChart,
  Users,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useTransactionModal } from "./contexts";
import { useSearch } from "./contexts";
import { TransactionItemProps } from "@/features/dashboard/types";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { ActionCard } from "@/features/dashboard/components/action-card";
import { TransactionItem } from "@/features/dashboard/components/transaction-item";
import { AIAssistantCard } from "@/features/dashboard/components/ai-assistant-card";

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
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="mt-1 text-muted-foreground">
          Bem-vindo de volta, {userProfile?.nome || "Usuário"}! Aqui está um
          resumo das suas finanças.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Receita Total"
          value={stats.total_income_formatted}
          subtext="Este mês"
          trend={stats.trends?.income?.direction || "up"}
          trendValue={stats.trends?.income?.value}
          icon={Wallet}
          colorClass="bg-emerald-500 text-emerald-600"
        />
        <StatCard
          title="Gasto Total"
          value={stats.total_spent_formatted}
          subtext="Este mês"
          trend={stats.trends?.expenses?.direction || "down"}
          trendValue={stats.trends?.expenses?.value}
          icon={CreditCard}
          colorClass="bg-rose-500 text-rose-600"
        />
        <StatCard
          title="Saldo Líquido"
          value={stats.net_balance_formatted}
          subtext="Saldo positivo"
          icon={TrendingUp}
          colorClass="bg-blue-500 text-blue-600"
        />
        <StatCard
          title="Notas Fiscais"
          value={stats.total_receipts.toString()}
          subtext="Processadas"
          trend={stats.trends?.receipts?.direction || "up"}
          trendValue={stats.trends?.receipts?.value}
          icon={FileText}
          colorClass="bg-indigo-500 text-indigo-600"
        />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <ActionCard
          title="Novo Recibo"
          description="Adicionar nova despesa"
          icon={Plus}
          color="blue"
          href="/dashboard/receipts"
        />
        <ActionCard
          title="Ver Relatórios"
          description="Análise detalhada de gastos"
          icon={PieChart}
          color="emerald"
          href="/dashboard/reports"
        />
        <ActionCard
          title="Gerenciar Grupos"
          description="Organizar finanças familiares"
          icon={Users}
          color="purple"
          href="/dashboard/groups"
        />
      </div>

      {/* Bottom Section: Transactions & AI */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Recent Activity */}
        <div className="xl:col-span-2 rounded-2xl shadow-sm border flex flex-col bg-card border-border">
          <div className="p-6 border-b flex justify-between items-center border-border">
            <h3 className="font-bold text-lg text-foreground">
              Atividade Recente
            </h3>
            <Link href="/dashboard/receipts">
              <button className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-500/10">
                Ver tudo
              </button>
            </Link>
          </div>
          <div className="p-2 space-y-1">
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
                  onClick={() => handleTransactionClick(transaction)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum recibo encontrado.</p>
                <p className="text-sm mt-1">Adicione seu primeiro recibo!</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Assistant */}
        <AIAssistantCard />
      </div>
    </div>
  );
}
