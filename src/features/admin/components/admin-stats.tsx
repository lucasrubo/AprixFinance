"use client";

import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Receipt, Shield, TrendingUp, Users } from "lucide-react";

interface AdminStatsProps {
  totalUsers?: number;
  totalReceipts?: number;
  totalAmount?: number;
  isLoading?: boolean;
}

export function AdminStats({
  totalUsers = 0,
  totalReceipts = 0,
  totalAmount = 0,
  isLoading = false,
}: AdminStatsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            Painel Admin
          </h2>
          <Badge
            variant="secondary"
            className="bg-secondary text-secondary-foreground"
          >
            Admin
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className=" ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                </CardTitle>
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total de Usuários",
      value: totalUsers.toString(),
      icon: Users,
      color: "text-blue-400",
    },
    {
      title: "Total de Recibos",
      value: totalReceipts.toString(),
      icon: Receipt,
      color: "text-green-400",
    },
    {
      title: "Valor Total",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(totalAmount),
      icon: TrendingUp,
      color: "text-yellow-400",
    },
    {
      title: "Sistema",
      value: "Online",
      icon: Shield,
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-cyan-400" />
        <h2 className="text-xl font-semibold text-foreground">Painel Admin</h2>
        <Badge
          variant="secondary"
          className="bg-cyan-900/50 text-cyan-300 border-cyan-700"
        >
          Admin
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className=" hover:bg-muted/70 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
