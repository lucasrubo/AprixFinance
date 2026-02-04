"use server";

import { createClient } from "@/shared/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserProfileAction(formData: FormData) {
  const nome = formData.get("nome") as string;
  const telefone = formData.get("telefone") as string;
  const salario = formData.get("salario")
    ? parseFloat(formData.get("salario") as string)
    : null;

  if (!nome || nome.trim().length === 0) {
    return { error: "Nome é obrigatório" };
  }

  if (salario !== null && (isNaN(salario) || salario < 0)) {
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
