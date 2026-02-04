// Shared application types
export interface User {
  id: string;
  email: string;
  nome: string;
  telefone: string | null;
  tipo: "user" | "admin";
  salario: number | null;
  created_at: string;
}

export interface Group {
  id: string;
  nome: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
  user?: User;
  group?: Group;
}

export interface Receipt {
  id: string;
  user_id: string;
  group_id: string | null;
  titulo: string;
  valor: number;
  descricao: string | null;
  data: string;
  tipo: "entrada" | "saida";
  created_at: string;
  created_by?: User; // Usuário que criou o receipt
}

export interface MonthlyStats {
  total_spent: number; // Total de saídas (gastos)
  total_income: number; // Total de entradas (receitas)
  net_balance: number; // Saldo líquido (entradas - saídas)
  total_receipts: number;
  average_per_receipt: number;
  top_titulo?: string | null;
  spending_by_day: {
    date: string;
    amount: number;
  }[];
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  tipo: "receipt" | "fixed_expense" | "subscription" | "system" | "reminder";
  titulo: string;
  mensagem: string;
  referencia_id?: string | null;
  lida: boolean;
  data_expiracao?: string | null;
  created_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: {
    receipt: number;
    fixed_expense: number;
    subscription: number;
    system: number;
    reminder: number;
  };
}
