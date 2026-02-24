"use server";

import { createClient } from "@/shared/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { CreateCreditCardData, CreditCard, CreditCardStats } from "../types";

export async function getCreditCardsAction(): Promise<{
  success: boolean;
  data?: CreditCard[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const { data, error } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as CreditCard[] };
}

export async function getCreditCardStatsAction(): Promise<{
  success: boolean;
  data?: CreditCardStats[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const { data: cards, error: cardsError } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("created_at", { ascending: false });

  if (cardsError) return { success: false, error: cardsError.message };
  if (!cards?.length) return { success: true, data: [] };

  // Buscar gastos do mês atual por cartão
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const { data: receipts } = await supabase
    .from("receipts")
    .select("credit_card_id, valor")
    .eq("user_id", user.id)
    .eq("tipo", "saida")
    .gte("data", firstDay)
    .lte("data", lastDay)
    .not("credit_card_id", "is", null);

  // Agrupar gastos por cartão
  const spendByCard: Record<string, number> = {};
  for (const r of receipts ?? []) {
    if (r.credit_card_id) {
      spendByCard[r.credit_card_id] =
        (spendByCard[r.credit_card_id] || 0) + r.valor;
    }
  }

  const stats: CreditCardStats[] = (cards as CreditCard[]).map((card) => {
    const total_mes = spendByCard[card.id] || 0;
    const percentual_limite =
      card.limite && card.limite > 0
        ? Math.min((total_mes / card.limite) * 100, 100)
        : null;
    return { ...card, total_mes, percentual_limite };
  });

  return { success: true, data: stats };
}

export async function createCreditCardAction(
  data: CreateCreditCardData,
): Promise<{ success: boolean; data?: CreditCard; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const { data: card, error } = await supabase
    .from("credit_cards")
    .insert({
      user_id: user.id,
      nome: data.nome.trim(),
      bandeira: data.bandeira,
      ultimos_4_digitos: data.ultimos_4_digitos,
      limite: data.limite ?? null,
      dia_fechamento: data.dia_fechamento ?? null,
      dia_vencimento: data.dia_vencimento ?? null,
      cor: data.cor ?? "#6366f1",
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  return { success: true, data: card as CreditCard };
}

export async function updateCreditCardAction(
  id: string,
  data: Partial<CreateCreditCardData>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const { error } = await supabase
    .from("credit_cards")
    .update({ ...data })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/credit-cards");
  return { success: true };
}

export async function deleteCreditCardAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  // Soft delete: marca como inativo
  const { error } = await supabase
    .from("credit_cards")
    .update({ ativo: false })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/credit-cards");
  return { success: true };
}
