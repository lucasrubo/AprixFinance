"use server";

import { createClient } from "@/shared/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getGroups() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuário não autenticado" };
    }

    const { data: groups, error } = await supabase.from("groups").select(`
        *,
        group_members (
          id,
          user_id,
          created_at
        )
      `);

    if (error) {
      throw new Error(error.message);
    }

    // Filtrar apenas grupos onde o usuário é membro
    const userGroups = groups?.filter((group) =>
      group.group_members?.some((member: any) => member.user_id === user.id),
    );

    // Buscar informações dos usuários separadamente para evitar recursão
    const transformedGroups = await Promise.all(
      userGroups?.map(async (group) => {
        const membersWithUsers = await Promise.all(
          group.group_members?.map(async (member: any) => {
            const { data: userData } = await supabase
              .from("users")
              .select("id, nome, email")
              .eq("id", member.user_id)
              .single();

            return {
              id: member.id,
              group_id: group.id,
              user_id: member.user_id,
              created_at: member.created_at,
              user: userData || {
                id: member.user_id,
                nome: "Usuário",
                email: "",
              },
            };
          }) || [],
        );

        return {
          ...group,
          members: membersWithUsers,
        };
      }) || [],
    );

    return { success: true, groups: transformedGroups };
  } catch (error) {
    console.error("Erro ao buscar grupos:", error);
    return {
      error: error instanceof Error ? error.message : "Erro interno",
    };
  }
}

export async function createGroup(name: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuário não autenticado" };
    }

    const { data, error } = await supabase
      .from("groups")
      .insert({ nome: name })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Adicionar o usuário criador como membro do grupo
    const { error: memberError } = await supabase
      .from("group_members")
      .insert({ user_id: user.id, group_id: data.id });

    if (memberError) {
      console.error("Erro ao adicionar criador ao grupo:", memberError);
      // Não falhar a criação do grupo por isso
    }

    revalidatePath("/dashboard/groups");
    return { success: true, group: data };
  } catch (error) {
    console.error("Erro ao criar grupo:", error);
    return {
      error: error instanceof Error ? error.message : "Erro interno",
    };
  }
}

export async function addUserToGroup(userId: string, groupId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuário não autenticado" };
    }

    const { data, error } = await supabase
      .from("group_members")
      .insert({ user_id: userId, group_id: groupId })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/dashboard/groups");
    return { success: true, member: data };
  } catch (error) {
    console.error("Erro ao adicionar usuário ao grupo:", error);
    return {
      error: error instanceof Error ? error.message : "Erro interno",
    };
  }
}

export async function removeUserFromGroup(memberId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuário não autenticado" };
    }

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/dashboard/groups");
    return { success: true };
  } catch (error) {
    console.error("Erro ao remover usuário do grupo:", error);
    return {
      error: error instanceof Error ? error.message : "Erro interno",
    };
  }
}

export async function getUsers() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Usuário não autenticado" };
    }

    // Verificar se o usuário é admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("tipo")
      .eq("id", user.id)
      .single();

    if (userError || userData?.tipo !== "admin") {
      return {
        error: "Acesso negado. Apenas administradores podem ver usuários.",
      };
    }

    const { data: users, error } = await supabase.from("users").select("*");

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, users };
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return {
      error: error instanceof Error ? error.message : "Erro interno",
    };
  }
}
