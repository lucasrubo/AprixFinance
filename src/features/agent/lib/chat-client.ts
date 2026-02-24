"use client";

import { createClient } from "@/shared/utils/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_FINANCE_API_URL;

export type AgentResponse = {
  response: string;
  result?: Record<string, unknown>;
  insights?: string[];
  suggestions?: string[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: {
    result?: any;
    insights?: string[];
    suggestions?: string[];
  };
  session_id?: string;
  created_at?: string;
};

export async function sendAgentMessage(
  message: string,
): Promise<AgentResponse> {
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

// Funções para gerenciar histórico de conversas
export async function saveMessageToHistory(
  message: ChatMessage,
  sessionId?: string,
): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("Não foi possível recuperar sua sessão do Supabase.");
  }

  const finalSessionId = sessionId || generateSessionId();

  // Verificar se a sessão já existe na tabela sessions
  const { data: existingSession, error: checkError } = await supabase
    .from("sessions")
    .select("id")
    .eq("session_id", finalSessionId)
    .eq("user_id", session.user.id)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 = not found
    console.error("Erro ao verificar sessão existente:", checkError);
  }

  // Se a sessão não existe, criar ela
  if (!existingSession) {
    const { error: createError } = await supabase.from("sessions").insert({
      user_id: session.user.id,
      session_id: finalSessionId,
    });

    if (createError) {
      console.error("Erro ao criar sessão:", createError);
      // Não falhar a operação se não conseguir criar a sessão
    }
  } else {
    // Atualizar updated_at da sessão
    await supabase
      .from("sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("session_id", finalSessionId)
      .eq("user_id", session.user.id);
  }

  const { error } = await supabase.from("conversation_history").insert({
    user_id: session.user.id,
    role: message.role,
    content: message.content,
    metadata: message.metadata || null,
    session_id: finalSessionId,
  });

  if (error) {
    console.error("Erro ao salvar mensagem no histórico:", error);
    throw new Error("Erro ao salvar mensagem no histórico.");
  }
}

export async function loadConversationHistory(
  limit = 50,
): Promise<ChatMessage[]> {
  const supabase = createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("Não foi possível recuperar sua sessão do Supabase.");
  }

  const { data, error } = await supabase
    .from("conversation_history")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Erro ao carregar histórico de conversas:", error);
    throw new Error("Erro ao carregar histórico de conversas.");
  }

  return (data || []).map((row) => ({
    id: row.id,
    role: row.role as "user" | "assistant",
    content: row.content,
    metadata: row.metadata,
    session_id: row.session_id,
    created_at: row.created_at,
  }));
}

export async function loadConversationSessions(): Promise<
  {
    session_id: string;
    messages: ChatMessage[];
    created_at: string;
    title?: string;
    status?: "active" | "inactive";
  }[]
> {
  const supabase = createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("Não foi possível recuperar sua sessão do Supabase.");
  }

  // Primeiro, buscar todas as sessões do usuário
  const { data: sessionsData, error: sessionsError } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false });

  if (sessionsError) {
    console.error("Erro ao carregar sessões:", sessionsError);
    throw new Error("Erro ao carregar sessões.");
  }

  // Para cada sessão, buscar as mensagens associadas
  const sessionsWithMessages = await Promise.all(
    (sessionsData || []).map(async (sessionData) => {
      const { data: messagesData, error: messagesError } = await supabase
        .from("conversation_history")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("session_id", sessionData.session_id)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error(
          `Erro ao carregar mensagens da sessão ${sessionData.session_id}:`,
          messagesError,
        );
        return {
          session_id: sessionData.session_id,
          messages: [],
          created_at: sessionData.created_at,
          title: sessionData.title,
          status: sessionData.status || "active",
        };
      }

      const messages: ChatMessage[] = (messagesData || []).map((row) => ({
        id: row.id,
        role: row.role as "user" | "assistant",
        content: row.content,
        metadata: row.metadata,
        session_id: row.session_id,
        created_at: row.created_at,
      }));

      return {
        session_id: sessionData.session_id,
        messages,
        created_at: sessionData.created_at,
        title: sessionData.title,
        status: sessionData.status || "active",
      };
    }),
  );

  return sessionsWithMessages;
}

export async function createSession(
  sessionId: string,
  title?: string,
): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("Não foi possível recuperar sua sessão do Supabase.");
  }

  const { error } = await supabase.from("sessions").insert({
    user_id: session.user.id,
    session_id: sessionId,
    title,
  });

  if (error) {
    console.error("Erro ao criar sessão:", error);
    throw new Error("Erro ao criar sessão.");
  }
}

export async function updateSessionTitle(
  sessionId: string,
  title: string,
): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("Não foi possível recuperar sua sessão do Supabase.");
  }

  const { error } = await supabase
    .from("sessions")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .eq("user_id", session.user.id);

  if (error) {
    console.error("Erro ao atualizar título da sessão:", error);
    throw new Error("Erro ao atualizar título da sessão.");
  }
}

export async function updateSessionStatus(
  sessionId: string,
  status: "active" | "inactive",
): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("Não foi possível recuperar sua sessão do Supabase.");
  }

  const { error } = await supabase
    .from("sessions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .eq("user_id", session.user.id);

  if (error) {
    console.error("Erro ao atualizar status da sessão:", error);
    throw new Error("Erro ao atualizar status da sessão.");
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("Não foi possível recuperar sua sessão do Supabase.");
  }

  // Primeiro deletar as mensagens da sessão
  const { error: messagesError } = await supabase
    .from("conversation_history")
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", session.user.id);

  if (messagesError) {
    console.error("Erro ao deletar mensagens da sessão:", messagesError);
    throw new Error("Erro ao deletar mensagens da sessão.");
  }

  // Depois deletar a sessão
  const { error: sessionError2 } = await supabase
    .from("sessions")
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", session.user.id);

  if (sessionError2) {
    console.error("Erro ao deletar sessão:", sessionError2);
    throw new Error("Erro ao deletar sessão.");
  }
}

export async function clearConversationHistory(): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("Não foi possível recuperar sua sessão do Supabase.");
  }

  const { error } = await supabase
    .from("conversation_history")
    .delete()
    .eq("user_id", session.user.id);

  if (error) {
    console.error("Erro ao limpar histórico de conversas:", error);
    throw new Error("Erro ao limpar histórico de conversas.");
  }
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
