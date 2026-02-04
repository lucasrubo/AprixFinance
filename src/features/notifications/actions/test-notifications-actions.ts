"use server";

import { createClient } from "@/shared/utils/supabase/server";

export async function createTestNotificationsAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Criar algumas notificações de teste
    const testNotifications = [
      {
        tipo: "receipt" as const,
        titulo: "Novo recebimento registrado",
        mensagem: "Você registrou um recebimento de R$ 150,00 - Salário",
        referencia_id: null,
        lida: false,
        data_expiracao: null,
      },
      {
        tipo: "fixed_expense" as const,
        titulo: "Pagamento próximo: Conta de Luz",
        mensagem: "O pagamento de R$ 89,50 vence em 3 dias.",
        referencia_id: null,
        lida: false,
        data_expiracao: null,
      },
      {
        tipo: "reminder" as const,
        titulo: "Lembrete: Revisar gastos",
        mensagem:
          "Não esqueça de revisar seus gastos mensais para manter o controle financeiro.",
        referencia_id: null,
        lida: true,
        data_expiracao: null,
      },
      {
        tipo: "system" as const,
        titulo: "Bem-vindo ao Finance App!",
        mensagem:
          "Sua conta foi configurada com sucesso. Explore os recursos disponíveis.",
        referencia_id: null,
        lida: true,
        data_expiracao: null,
      },
    ];

    const { error } = await supabase
      .from("notifications")
      .insert(testNotifications);

    if (error) {
      console.error("Erro ao criar notificações de teste:", error);
      return { success: false, error: "Erro ao criar notificações de teste" };
    }

    return { success: true };
  } catch (error) {
    console.error("Erro inesperado:", error);
    return { success: false, error: "Erro inesperado" };
  }
}
