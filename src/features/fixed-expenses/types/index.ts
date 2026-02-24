// Tipos para gastos fixos
import type { User } from "@/shared/types";

export interface FixedExpense {
  id: string;
  user_id: string;
  titulo: string;
  descricao?: string;
  categoria: "gasto_fixo" | "assinatura" | "servico";
  valor_parcela: number;
  data_inicio: string;
  data_pagamento: number; // dia do mês
  duracao?: number; // duração em meses
  status: "ativo" | "cancelado" | "pausado";
  created_at: string;
  updated_at: string;
  created_by?: User; // Usuário que criou o gasto fixo
}

export interface CreateFixedExpenseData {
  titulo: string;
  descricao?: string;
  categoria: "gasto_fixo" | "assinatura" | "servico";
  valor_parcela: number;
  data_inicio: string;
  data_pagamento: number;
  duracao?: number;
}

export interface UpdateFixedExpenseData
  extends Partial<CreateFixedExpenseData> {
  status?: "ativo" | "cancelado" | "pausado";
}

export interface FixedExpenseCardProps {
  expense: FixedExpense;
  onEdit: (expense: FixedExpense) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, status: "ativo" | "pausado") => void;
}

export interface FixedExpenseFormProps {
  expense?: FixedExpense;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFixedExpenseData) => Promise<void>;
}
