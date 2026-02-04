// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          nome: string;
          telefone: string | null;
          tipo: "user" | "admin";
          salario: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          nome: string;
          telefone?: string | null;
          tipo?: "user" | "admin";
          salario?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nome?: string;
          telefone?: string | null;
          tipo?: "user" | "admin";
          salario?: number | null;
          created_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          nome: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          created_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      receipts: {
        Row: {
          id: string;
          user_id: string;
          group_id: string | null;
          titulo: string;
          valor: number;
          descricao: string | null;
          data: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id?: string | null;
          titulo: string;
          valor: number;
          descricao?: string | null;
          data?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          group_id?: string | null;
          titulo?: string;
          valor?: number;
          descricao?: string | null;
          data?: string;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          icon: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          icon?: string | null;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          icon?: string | null;
          user_id?: string;
          created_at?: string;
        };
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          question: string;
          response: string;
          context: any | null; // JSONB
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question: string;
          response: string;
          context?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question?: string;
          response?: string;
          context?: any | null;
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          monthly_budget: number | null;
          alert_threshold: number | null;
          preferred_currency: string;
          whatsapp_notifications: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          monthly_budget?: number | null;
          alert_threshold?: number | null;
          preferred_currency?: string;
          whatsapp_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          monthly_budget?: number | null;
          alert_threshold?: number | null;
          preferred_currency?: string;
          whatsapp_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
