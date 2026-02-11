"use client";

import { createClient } from "@/shared/utils/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_FINANCE_API_URL;

export type AgentResponse = {
  response: string;
  result?: Record<string, unknown>;
  insights?: string[];
  suggestions?: string[];
};

export async function sendAgentMessage(message: string): Promise<AgentResponse> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_FINANCE_API_URL não está configurada.");
  }

  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error("Não foi possível recuperar sua sessão do Supabase.");
  }

  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const fallback = await response.text();
    throw new Error(
      fallback || "Erro ao se comunicar com o agente inteligente.",
    );
  }

  return response.json();
}
