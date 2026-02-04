"use server";

import { createClient } from "@/shared/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createUser(
  email: string,
  name?: string,
  password = "user123",
) {
  try {
    const supabase = await createClient();

    // Verificar se é admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const { data: adminUser } = await supabase
      .from("users")
      .select("tipo")
      .eq("id", user.id)
      .single();

    if (adminUser?.tipo !== "admin") {
      throw new Error("Apenas admins podem criar usuários");
    }

    // Criar usuário no auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome: name || email,
        },
      },
    });

    if (signUpError) {
      throw new Error(signUpError.message);
    }

    revalidatePath("/dashboard/users");
    return { success: true, userId: authData.user?.id };
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return {
      error: error instanceof Error ? error.message : "Erro interno",
    };
  }
}

export async function deleteUser(userId: string) {
  try {
    const supabase = await createClient();

    // Verificar se é admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const { data: adminUser } = await supabase
      .from("users")
      .select("tipo")
      .eq("id", user.id)
      .single();

    if (adminUser?.tipo !== "admin") {
      throw new Error("Apenas admins podem excluir usuários");
    }

    // Verificar se não está tentando excluir um admin
    const { data: targetUser } = await supabase
      .from("users")
      .select("tipo")
      .eq("id", userId)
      .single();

    if (targetUser?.tipo === "admin") {
      throw new Error("Não é possível excluir outros admins");
    }

    // Para simplificar, apenas deletar da tabela users
    // O usuário ainda existirá no auth, mas não poderá logar
    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return {
      error: error instanceof Error ? error.message : "Erro interno",
    };
  }
}

export async function getUsers() {
  try {
    const supabase = await createClient();

    // Verificar se é admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const { data: adminUser } = await supabase
      .from("users")
      .select("tipo")
      .eq("id", user.id)
      .single();

    if (adminUser?.tipo !== "admin") {
      throw new Error("Apenas admins podem ver todos os usuários");
    }

    // Buscar todos os usuários
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, users: data };
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return {
      error: error instanceof Error ? error.message : "Erro interno",
    };
  }
}
