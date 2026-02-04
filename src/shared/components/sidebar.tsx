"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Group,
  FileText,
  PieChart,
  Settings,
  LogOut,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { signOutAction } from "@/features/auth/actions/auth-actions";
import { useUserRole } from "@/shared/hooks/use-user-role";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Agente",
    icon: Sparkles,
    href: "/dashboard/agent",
  },
  {
    title: "Recibos",
    icon: Receipt,
    href: "/dashboard/receipts",
  },
  {
    title: "Gastos Fixos",
    icon: PieChart,
    href: "/dashboard/fixed-expenses",
  },
  {
    title: "Grupos",
    icon: Group,
    href: "/dashboard/groups",
    adminOnly: true,
  },
  {
    title: "Usuários",
    icon: Users,
    href: "/dashboard/users",
    adminOnly: true,
  },
  {
    title: "Configurações",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { isAdmin } = useUserRole();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) => {
    // Hide admin-only items for regular users
    if (item.adminOnly && !isAdmin) {
      return false;
    }
    return true;
  });

  return (
    <aside
      className={cn(
        `
        w-72 border-r shadow-xl
        flex flex-col h-full
        bg-[hsl(var(--sidebar))] border-sidebar-border
      `,
        className,
      )}
    >
      {/* Logo Area */}
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Finance AI
            </h1>
            <p className="text-xs font-medium text-muted-foreground">
              Gestão Inteligente
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1 px-4 py-6 gap-2 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-12 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon
                  size={18}
                  className={
                    isActive
                      ? "text-accent-foreground"
                      : "text-muted-foreground"
                  }
                />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 text-sm font-medium transition-colors text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
          disabled={isPending}
        >
          <LogOut size={18} />
          {isPending ? "Saindo..." : "Sair"}
        </Button>
      </div>
    </aside>
  );
}
