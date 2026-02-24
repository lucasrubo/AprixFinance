"use server";

import { createClient } from "@/shared/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserProfileAction(formData: FormData) {
  const nome = formData.get("nome") as string;
  const telefone = formData.get("telefone") as string;
  const salario = formData.get("salario")
    ? Number.parseFloat(formData.get("salario") as string)
    : null;

  if (!nome || nome.trim().length === 0) {
    return { error: "Nome é obrigatório" };
  }

  if (salario !== null && (Number.isNaN(salario) || salario < 0)) {
    return { error: "Salário deve ser um valor positivo" };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Usuário não autenticado" };
  }

  // Update user profile
  const { error } = await supabase
    .from("users")
    .update({
      nome: nome.trim(),
      telefone: telefone?.trim() || null,
      salario: salario,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating user profile:", error);
    return { error: "Erro ao atualizar perfil" };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updateNotificationSettingsAction(data: {
  push_notifications?: boolean;
  email_notifications?: boolean;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Usuário não autenticado" };
  }

  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, ...data }, { onConflict: "user_id" });

  if (error) {
    return { error: "Erro ao atualizar configurações de notificação" };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function getNotificationSettingsAction() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Usuário não autenticado" };
  }

  const { data } = await supabase
    .from("user_settings")
    .select("push_notifications, email_notifications")
    .eq("user_id", user.id)
    .single();

  return {
    push_notifications: data?.push_notifications ?? false,
    email_notifications: data?.email_notifications ?? false,
  };
}
