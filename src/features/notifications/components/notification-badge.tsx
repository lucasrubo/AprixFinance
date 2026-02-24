"use client";

import type React from "react";
import { useNotifications } from "../hooks/use-notifications";

interface NotificationBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function NotificationBadge({
  children,
  className = "",
}: NotificationBadgeProps) {
  const { stats } = useNotifications();

  return (
    <div className={`relative ${className}`}>
      {children}
      {stats.unread > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900 min-w-[20px]">
          {stats.unread > 99 ? "99+" : stats.unread}
        </span>
      )}
    </div>
  );
}
