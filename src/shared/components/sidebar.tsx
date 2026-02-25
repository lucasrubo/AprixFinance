"use client";

import { signOutAction } from "@/features/auth/actions/auth-actions";
import { useUserProfile } from "@/features/settings/hooks/use-user-profile";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  Sidebar as SidebarRoot,
  SidebarSeparator,
  useSidebar,
} from "@/shared/components/ui/sidebar";
import { useUserRole } from "@/shared/hooks/use-user-role";
import {
  CreditCard,
  FileText,
  Group,
  LayoutDashboard,
  LogOut,
  PieChart,
  Receipt,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentType, useTransition } from "react";

type NavItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
  adminOnly?: boolean;
};

const overviewNav: NavItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Agente IA",
    icon: Sparkles,
    href: "/dashboard/agent",
    badge: "novo",
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
    title: "Cartões",
    icon: CreditCard,
    href: "/dashboard/credit-cards",
  },
  {
    title: "Faturas",
    icon: FileText,
    href: "/dashboard/faturas",
  },
];

const adminNav: NavItem[] = [
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

const quickLinks: NavItem[] = [
  {
    title: "Novo recibo",
    icon: CreditCard,
    href: "/dashboard/receipts?create=true",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useUserRole();
  const { user, loading: userLoading } = useUserProfile();
  const [isPending, startTransition] = useTransition();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const renderNavGroup = (label: string, items: NavItem[]) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items
            .filter((item) => (item.adminOnly ? isAdmin : true))
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                  >
                    <Link href={item.href} onClick={handleNavClick}>
                      <item.icon className="text-muted-foreground" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge ? (
                    <SidebarMenuBadge className="bg-sidebar-primary/10 text-[10px] font-semibold uppercase tracking-wide text-sidebar-primary">
                      {item.badge}
                    </SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              );
            })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <SidebarRoot variant="inset" className="bg-background">
      <SidebarHeader>
        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/60 px-3 py-2">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">
              Finance
            </span>
            <span className="text-xs text-sidebar-foreground/70">
              Gestão Inteligente
            </span>
          </div>
          <Badge
            variant="secondary"
            className="ml-auto text-[11px] uppercase tracking-wide"
          >
            Nova Era
          </Badge>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {renderNavGroup("Visão geral", overviewNav)}
        {renderNavGroup("Atalhos", quickLinks)}
        {isAdmin && renderNavGroup("Administração", adminNav)}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-auto py-3" tooltip="Perfil" asChild>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary">
                    {userLoading
                      ? "?"
                      : user?.nome
                        ? user.nome
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : user?.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-sidebar-foreground">
                    {userLoading
                      ? "Carregando..."
                      : user?.nome || user?.email?.split("@")[0] || "Usuário"}
                  </span>
                  <span className="text-xs text-sidebar-foreground/70">
                    {userLoading
                      ? "Carregando..."
                      : user?.tipo === "admin"
                        ? "Administrador"
                        : "Usuário"}
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="text-destructive hover:text-destructive"
            >
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isPending}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>{isPending ? "Saindo..." : "Sair"}</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </SidebarRoot>
  );
}
