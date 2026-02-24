import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface ExpenseReminderData {
  to: string;
  nome: string;
  expenses: Array<{
    titulo: string;
    valor: number;
    dia_pagamento: number;
    isToday: boolean;
  }>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function buildReminderHtml(data: ExpenseReminderData): string {
  const rows = data.expenses
    .map(
      (e) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0">${e.titulo}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600">${formatCurrency(e.valor)}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;text-align:center">
          <span style="background:${e.isToday ? "#fef2f2" : "#fffbeb"};color:${e.isToday ? "#dc2626" : "#d97706"};padding:2px 8px;border-radius:4px;font-size:12px">
            ${e.isToday ? "Hoje" : "Amanhã"}
          </span>
        </td>
      </tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px">
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff">AprixFinance</h1>
      <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.8)">Lembrete de vencimentos</p>
    </div>

    <div style="padding:28px 32px">
      <p style="margin:0 0 20px;font-size:15px;color:#374151">
        Olá, <strong>${data.nome}</strong>! Você tem gastos fixos vencendo em breve:
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:10px 16px;text-align:left;font-weight:600;color:#6b7280">Descrição</th>
            <th style="padding:10px 16px;text-align:right;font-weight:600;color:#6b7280">Valor</th>
            <th style="padding:10px 16px;text-align:center;font-weight:600;color:#6b7280">Venc.</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="margin-top:24px;padding:16px;background:#f0f9ff;border-radius:8px;border-left:4px solid #6366f1">
        <p style="margin:0;font-size:13px;color:#1d4ed8">
          Acesse o <strong>AprixFinance</strong> para gerenciar seus gastos fixos e marcar como pago.
        </p>
      </div>
    </div>

    <div style="padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center">
      <p style="margin:0;font-size:12px;color:#9ca3af">
        Você está recebendo este e-mail porque ativou as notificações no AprixFinance.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendExpenseReminderEmail(
  data: ExpenseReminderData,
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: "RESEND_API_KEY não configurada" };
  }

  try {
    const { error } = await resend.emails.send({
      from: "AprixFinance <notificacoes@aprixfinance.app>",
      to: data.to,
      subject: `⏰ ${data.expenses.length === 1 ? `"${data.expenses[0].titulo}" vence` : `${data.expenses.length} gastos vencem`} ${data.expenses.some((e) => e.isToday) ? "hoje" : "amanhã"}`,
      html: buildReminderHtml(data),
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
