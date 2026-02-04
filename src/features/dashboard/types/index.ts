// Tipos para os componentes do dashboard

import { LucideIcon } from "lucide-react";

// Props para transações (usado em vários componentes do dashboard)
export interface TransactionItemProps {
  id?: string;
  title: string;
  group: string;
  date: string;
  amount: string;
  type: "expense" | "income";
  description: string;
  itemType?: "receipt" | "fixed_expense";
  category?: string;
  status?: string;
  sortDate?: string; // Campo auxiliar para ordenação (formato YYYY-MM-DD)
  created_by?: string; // Nome do usuário que criou o item
}

// Props para o componente ActionCard
export interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: "blue" | "emerald" | "purple";
  href?: string;
  onClick?: () => void;
}

// Props para o componente StatCard
export interface StatCardProps {
  title: string;
  value: string;
  subtext: string;
  trend?: "up" | "down";
  trendValue?: string;
  icon: LucideIcon;
  colorClass: string;
}

// Props para o componente TransactionItem (estende TransactionItemProps com onClick)
export interface TransactionItemComponentProps extends TransactionItemProps {
  onClick: () => void;
}
