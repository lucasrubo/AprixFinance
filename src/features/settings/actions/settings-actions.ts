"use server";

import { createClient } from "@/shared/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserProfileAction(formData: FormData) {
  const nome = formData.get("nome") as string;
  const telefone = formData.get("telefone") as string;

  if (!nome || nome.trim().length === 0) {
    return { error: "Nome é obrigatório" };
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
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating user profile:", error);
    return { error: "Erro ao atualizar perfil" };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}
