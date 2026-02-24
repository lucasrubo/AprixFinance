import { sendExpenseReminderEmail } from "@/shared/lib/email";
import { createServerSupabaseClient } from "@/shared/lib/supabase";
import { type NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

// Configurar VAPID keys (gerar com: npx web-push generate-vapid-keys)
webpush.setVapidDetails(
  "mailto:contato@aprixfinance.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? "",
);

// Vercel Cron — roda diariamente às 08:00 BRT
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Verificar secret para evitar chamadas não autorizadas
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClient();
    const today = new Date();
    const todayDay = today.getDate();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();

    // Buscar gastos fixos que vencem hoje ou amanhã
    const { data: expenses } = await supabase
      .from("fixed_expenses")
      .select("id, titulo, valor_parcela, data_pagamento, user_id")
      .eq("status", "ativo")
      .in("data_pagamento", [todayDay, tomorrowDay]);

    if (!expenses?.length) {
      return NextResponse.json({ processed: 0, pushSent: 0, emailSent: 0 });
    }

    // Agrupar gastos por usuário
    const userExpensesMap = new Map<string, typeof expenses>();
    for (const expense of expenses) {
      const list = userExpensesMap.get(expense.user_id) ?? [];
      list.push(expense);
      userExpensesMap.set(expense.user_id, list);
    }

    const userIds = [...userExpensesMap.keys()];

    // Buscar settings e dados dos usuários em paralelo
    const [{ data: settings }, { data: users }] = await Promise.all([
      supabase
        .from("user_settings")
        .select(
          "user_id, push_subscription, push_notifications, email_notifications",
        )
        .in("user_id", userIds),
      supabase.from("users").select("id, nome, email").in("id", userIds),
    ]);

    const settingsMap = new Map((settings ?? []).map((s) => [s.user_id, s]));
    const usersMap = new Map((users ?? []).map((u) => [u.id, u]));

    let pushSent = 0;
    let emailSent = 0;

    for (const [userId, userExpenses] of userExpensesMap) {
      const userSettings = settingsMap.get(userId);
      const userData = usersMap.get(userId);
      if (!userSettings || !userData) continue;

      // Criar notificações in-app para todos os gastos do usuário
      const notifInserts = userExpenses.map((expense) => {
        const isToday = expense.data_pagamento === todayDay;
        const valor = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(expense.valor_parcela);
        return {
          user_id: userId,
          tipo: "fixed_expense",
          titulo: isToday ? "Vencimento hoje!" : "Vencimento amanhã",
          mensagem: `${expense.titulo} — ${valor}`,
          referencia_id: expense.id,
        };
      });
      await supabase.from("notifications").insert(notifInserts);

      // Push notification — uma por gasto
      if (userSettings.push_notifications && userSettings.push_subscription) {
        for (const expense of userExpenses) {
          const isToday = expense.data_pagamento === todayDay;
          const valor = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(expense.valor_parcela);

          const payload = JSON.stringify({
            title: isToday ? "Vencimento hoje!" : "Vencimento amanhã",
            body: `${expense.titulo} — ${valor}`,
            icon: "/icon.png",
            badge: "/icon.png",
            data: { url: "/dashboard/fixed-expenses", id: expense.id },
          });

          try {
            await webpush.sendNotification(
              userSettings.push_subscription as webpush.PushSubscription,
              payload,
            );
            pushSent++;
          } catch (pushErr) {
            console.error("Push failed:", pushErr);
          }
        }
      }

      // Email notification — um único e-mail agrupando todos os gastos
      if (userSettings.email_notifications && userData.email) {
        const result = await sendExpenseReminderEmail({
          to: userData.email,
          nome: userData.nome,
          expenses: userExpenses.map((expense) => ({
            titulo: expense.titulo,
            valor: expense.valor_parcela,
            dia_pagamento: expense.data_pagamento,
            isToday: expense.data_pagamento === todayDay,
          })),
        });
        if (result.success) emailSent++;
        else console.error("Email failed:", result.error);
      }
    }

    return NextResponse.json({
      processed: userIds.length,
      total: expenses.length,
      pushSent,
      emailSent,
    });
  } catch (err) {
    console.error("daily-check cron:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
