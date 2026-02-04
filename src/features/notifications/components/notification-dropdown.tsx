"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, X, Check, CheckCheck, Trash2, Clock } from "lucide-react";
import { Notification } from "@/shared/types";
import { useNotifications } from "../hooks/use-notifications";

interface NotificationDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function NotificationDropdown({
  isOpen,
  onToggle,
  onClose,
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    stats,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getNotificationIcon = (tipo: Notification["tipo"]) => {
    switch (tipo) {
      case "receipt":
        return "💰";
      case "fixed_expense":
        return "📅";
      case "subscription":
        return "🔄";
      case "system":
        return "⚙️";
      case "reminder":
        return "🔔";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (tipo: Notification["tipo"]) => {
    switch (tipo) {
      case "receipt":
        return "text-emerald-600 dark:text-emerald-400";
      case "fixed_expense":
        return "text-blue-600 dark:text-blue-400";
      case "subscription":
        return "text-purple-600 dark:text-purple-400";
      case "system":
        return "text-gray-600 dark:text-gray-400";
      case "reminder":
        return "text-orange-600 dark:text-orange-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Agora";
    if (diffInHours < 24) return `${diffInHours}h atrás`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d atrás`;

    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="relative p-2.5 rounded-xl transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        title="Notificações"
      >
        <Bell size={20} />
        {stats.unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900">
            {stats.unread > 9 ? "9+" : stats.unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-xl shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-lg text-foreground">Notificações</h3>
            <div className="flex items-center gap-2">
              {stats.unread > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck size={14} />
                  Marcar todas
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-accent transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma notificação
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-accent transition-colors cursor-pointer ${
                      !notification.lida
                        ? "bg-blue-50/50 dark:bg-blue-500/5"
                        : ""
                    }`}
                    onClick={() =>
                      !notification.lida && markAsRead(notification.id)
                    }
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0">
                        {getNotificationIcon(notification.tipo)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`font-semibold text-sm text-foreground ${
                              !notification.lida ? "font-bold" : ""
                            }`}
                          >
                            {notification.titulo}
                          </h4>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.lida && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                              title="Excluir notificação"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {notification.mensagem}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              notification.tipo === "receipt"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                : notification.tipo === "fixed_expense"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                                  : notification.tipo === "subscription"
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"
                                    : notification.tipo === "reminder"
                                      ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400"
                            }`}
                          >
                            {notification.tipo === "receipt" && "Recebimento"}
                            {notification.tipo === "fixed_expense" &&
                              "Gasto Fixo"}
                            {notification.tipo === "subscription" &&
                              "Assinatura"}
                            {notification.tipo === "system" && "Sistema"}
                            {notification.tipo === "reminder" && "Lembrete"}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock size={10} />
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border bg-muted/50">
              <p className="text-xs text-center text-muted-foreground">
                {stats.total} notificações • {stats.unread} não lidas
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
