"use client";

import type { Notification } from "@/shared/types";
import { useCallback, useEffect, useState } from "react";
import {
  deleteNotificationAction,
  getNotificationStatsAction,
  getNotificationsAction,
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from "../actions/notifications-actions";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, unread: 0 });

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [notificationsResult, statsResult] = await Promise.all([
        getNotificationsAction(),
        getNotificationStatsAction(),
      ]);

      if (notificationsResult.success && notificationsResult.data) {
        setNotifications(notificationsResult.data);
      } else {
        setError(notificationsResult.error || "Erro ao buscar notificações");
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (err) {
      setError("Erro inesperado ao buscar notificações");
      console.error("Erro ao buscar notificações:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const result = await markNotificationAsReadAction(notificationId);

      if (result.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, lida: true }
              : notification,
          ),
        );
        setStats((prev) => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
        }));
      } else {
        setError(result.error || "Erro ao marcar notificação como lida");
      }
    } catch (err) {
      setError("Erro inesperado ao marcar notificação como lida");
      console.error("Erro ao marcar notificação como lida:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const result = await markAllNotificationsAsReadAction();

      if (result.success) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, lida: true })),
        );
        setStats((prev) => ({ ...prev, unread: 0 }));
      } else {
        setError(
          result.error || "Erro ao marcar todas as notificações como lidas",
        );
      }
    } catch (err) {
      setError("Erro inesperado ao marcar todas as notificações como lidas");
      console.error("Erro ao marcar todas as notificações como lidas:", err);
    }
  }, []);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const result = await deleteNotificationAction(notificationId);

        if (result.success) {
          setNotifications((prev) =>
            prev.filter((notification) => notification.id !== notificationId),
          );
          setStats((prev) => ({
            total: prev.total - 1,
            unread:
              prev.unread -
              (notifications.find((n) => n.id === notificationId)?.lida
                ? 0
                : 1),
          }));
        } else {
          setError(result.error || "Erro ao deletar notificação");
        }
      } catch (err) {
        setError("Erro inesperado ao deletar notificação");
        console.error("Erro ao deletar notificação:", err);
      }
    },
    [notifications],
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    stats,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError: () => setError(null),
  };
}
