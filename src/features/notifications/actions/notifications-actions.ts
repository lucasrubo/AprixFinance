"use server";

import type { Notification } from "@/shared/types";
import { createClient } from "@/shared/utils/supabase/server";

export async function getNotificationsAction(): Promise<{
  success: boolean;
  data?: Notification[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Erro ao buscar notificações:", error);
      return { success: false, error: "Erro ao buscar notificações" };
    }

    return { success: true, data: data as Notification[] };
  } catch (error) {
    console.error("Erro inesperado:", error);
    return { success: false, error: "Erro inesperado" };
  }
}

export async function markNotificationAsReadAction(
  notificationId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("notifications")
      .update({ lida: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      return { success: false, error: "Erro ao marcar notificação como lida" };
    }

    return { success: true };
  } catch (error) {
    console.error("Erro inesperado:", error);
    return { success: false, error: "Erro inesperado" };
  }
}

export async function markAllNotificationsAsReadAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("notifications")
      .update({ lida: true })
      .eq("lida", false);

    if (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error);
      return {
        success: false,
        error: "Erro ao marcar todas as notificações como lidas",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Erro inesperado:", error);
    return { success: false, error: "Erro inesperado" };
  }
}

export async function deleteNotificationAction(
  notificationId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      console.error("Erro ao deletar notificação:", error);
      return { success: false, error: "Erro ao deletar notificação" };
    }

    return { success: true };
  } catch (error) {
    console.error("Erro inesperado:", error);
    return { success: false, error: "Erro inesperado" };
  }
}

export async function getNotificationStatsAction(): Promise<{
  success: boolean;
  data?: { total: number; unread: number };
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("notifications")
      .select("lida")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar estatísticas de notificações:", error);
      return { success: false, error: "Erro ao buscar estatísticas" };
    }

    const total = data.length;
    const unread = data.filter((notification) => !notification.lida).length;

    return { success: true, data: { total, unread } };
  } catch (error) {
    console.error("Erro inesperado:", error);
    return { success: false, error: "Erro inesperado" };
  }
}
