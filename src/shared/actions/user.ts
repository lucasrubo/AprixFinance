"use server";

import { createClient } from "@/shared/utils/supabase/server";

export async function getCurrentUser() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Usuário não autenticado" };
    }

    const { data: userData, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      return { error: "Erro ao buscar dados do usuário" };
    }

    return { success: true, user: userData };
  } catch (error) {
    console.error("Erro ao obter usuário:", error);
    return { error: "Erro interno" };
  }
}
