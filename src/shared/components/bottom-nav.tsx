"use client";

import {
  CreditCard,
  FileText,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

type BottomNavItem = {
  title: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }> | string;
  center?: boolean;
  exact?: boolean;
};

const bottomNavItems: BottomNavItem[] = [
  {
    title: "Início",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Faturas",
    href: "/dashboard/faturas",
    icon: FileText,
  },
  {
    title: "Agente",
    href: "/dashboard/agent",
    icon: "/icon.png",
    center: true,
  },
  {
    title: "Cartões",
    href: "/dashboard/credit-cards",
    icon: CreditCard,
  },
  {
    title: "Config",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

function NavIcon({
  icon,
  size,
  className,
}: {
  icon: BottomNavItem["icon"];
  size: number;
  className?: string;
}) {
  if (typeof icon === "string") {
    return (
      <Image
        src={icon}
        alt=""
        width={size}
        height={size}
        className={className}
        style={{ objectFit: "contain", filter: "brightness(0.6) grayscale(100%)" }}
      />
    );
  }
  const Icon = icon;
  return <Icon size={size} className={className} />;
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="mx-3 mb-3 flex items-end justify-around rounded-2xl border border-border/60 bg-card/95 px-1 py-2 shadow-xl backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
        {bottomNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          if (item.center) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center"
              >
                <div
                  className={`-mt-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform active:scale-95 ${
                    isActive
                      ? "bg-primary shadow-primary/30"
                      : "bg-primary/90 shadow-primary/20"
                  }`}
                >
                  <NavIcon icon={item.icon} size={28} className="text-white" />
                </div>
                <span
                  className={`mt-1.5 text-[10px] font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.title}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1 transition-transform active:scale-95"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                  isActive ? "bg-primary/10" : ""
                }`}
              >
                <NavIcon
                  icon={item.icon}
                  size={20}
                  className={isActive ? "text-primary" : "text-muted-foreground"}
                />
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? "font-semibold text-primary" : "text-muted-foreground"
                }`}
              >
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
