"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Sparkles, Trash2, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Badge } from "@/shared/components/ui/badge";
import {
  sendAgentMessage,
  saveMessageToHistory,
  loadConversationHistory,
  loadConversationSessions,
  clearConversationHistory,
  generateSessionId,
  createSession,
  updateSessionTitle,
  deleteSession,
  type ChatMessage as ChatMessageType,
} from "@/features/agent/lib/chat-client";
import { cn } from "@/shared/lib/utils";

type ChatRole = "user" | "assistant";

type ChatMessage = ChatMessageType;

const fallbackSuggestions = [
  "Quais gastos fixos vencem esta semana?",
  "Resuma minhas despesas do mês",
  "Tenho margem para um novo investimento?",
];

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

interface AgentChatPanelProps {
  userName?: string;
}

export function AgentChatPanel({ userName }: AgentChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Olá${userName ? `, ${userName}` : ""}! Sou o agente Finance AI. Pergunte sobre recibos, gastos fixos ou peça recomendações que eu cuido do contexto financeiro para você.`,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>(fallbackSuggestions);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [currentSessionId, setCurrentSessionId] =
    useState<string>(generateSessionId());
  const [conversationSessions, setConversationSessions] = useState<
    {
      session_id: string;
      messages: ChatMessage[];
      created_at: string;
      title?: string;
    }[]
  >([]);

  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Carregar histórico de conversas
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const sessions = await loadConversationSessions();
        setConversationSessions(sessions);

        if (sessions.length > 0) {
          // Carregar a sessão mais recente
          const latestSession = sessions[0];
          setCurrentSessionId(latestSession.session_id);
          setMessages(latestSession.messages);
        }
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        // Mantém a mensagem de boas-vindas se não conseguir carregar o histórico
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submitMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    const content = inputValue.trim();
    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);
    setError(null);

    try {
      // Salvar mensagem do usuário no histórico
      await saveMessageToHistory(userMessage, currentSessionId);

      const payload = await sendAgentMessage(content);
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: payload.response,
        metadata: payload.result ? { result: payload.result } : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Salvar resposta do assistente no histórico
      await saveMessageToHistory(assistantMessage, currentSessionId);

      // Atualizar a sessão atual no estado conversationSessions
      setConversationSessions((prev) =>
        prev.map((session) =>
          session.session_id === currentSessionId
            ? {
                ...session,
                messages: [...session.messages, userMessage, assistantMessage],
              }
            : session,
        ),
      );

      if (payload.insights?.length) {
        setInsights(payload.insights);
      }

      if (payload.suggestions?.length) {
        setSuggestions(payload.suggestions);
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content:
          err instanceof Error
            ? `Erro: ${err.message}`
            : "Não foi possível falar com o assistente agora.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível falar com o assistente agora.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleTextareaKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  };

  const formattedInsights = useMemo(
    () =>
      conversationSessions.slice(0, 5).map((session) => {
        const date = new Date(session.created_at).toLocaleDateString("pt-BR");
        const time = new Date(session.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const messageCount = session.messages.length;

        // Usar título da sessão se disponível, senão usar preview da primeira mensagem
        let displayText = "";
        if (session.title) {
          displayText = session.title;
        } else {
          const firstMessage = session.messages[0]?.content || "";
          displayText =
            firstMessage.length > 40
              ? firstMessage.substring(0, 40) + "..."
              : firstMessage;
        }

        return `📅 ${date} ${time} - ${messageCount} mensagens: ${displayText}`;
      }),
    [conversationSessions],
  );

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    textareaRef.current?.focus();
  };

  const handleClearHistory = async () => {
    if (
      confirm("Tem certeza que deseja limpar todo o histórico de conversas?")
    ) {
      try {
        await clearConversationHistory();
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: `Olá${userName ? `, ${userName}` : ""}! Sou o agente Finance AI. Pergunte sobre recibos, gastos fixos ou peça recomendações que eu cuido do contexto financeiro para você.`,
          },
        ]);
        setConversationSessions([]);
        setCurrentSessionId(generateSessionId());
        setInsights([]);
        setSuggestions(fallbackSuggestions);
      } catch (error) {
        console.error("Erro ao limpar histórico:", error);
        setError("Erro ao limpar histórico de conversas.");
      }
    }
  };

  const handleLoadSession = (sessionId: string) => {
    const session = conversationSessions.find(
      (s) => s.session_id === sessionId,
    );
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      setInputValue("");
      setError(null);
      setInsights([]);
      setSuggestions(fallbackSuggestions);
    }
  };

  const handleNewSession = async () => {
    const newSessionId = generateSessionId();
    const newSession = {
      session_id: newSessionId,
      messages: [
        {
          id: "welcome",
          role: "assistant" as const,
          content: `Olá${userName ? `, ${userName}` : ""}! Sou o agente Finance AI. Como posso ajudar?`,
        },
      ],
      created_at: new Date().toISOString(),
    };

    try {
      // Criar sessão no banco de dados
      await createSession(newSessionId);
    } catch (error) {
      console.error("Erro ao criar nova sessão:", error);
      // Continuar mesmo se falhar, pois a sessão será criada quando a primeira mensagem for salva
    }

    setCurrentSessionId(newSessionId);
    setMessages(newSession.messages);
    setConversationSessions((prev) => [newSession, ...prev]);
    setInsights([]);
    setSuggestions(fallbackSuggestions);
  };

  const handleDeleteSession = async (
    sessionId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation(); // Impede que o clique no botão dispare o onClick do item

    if (confirm("Tem certeza que deseja deletar esta conversa?")) {
      try {
        // Se for a sessão atual, criar uma nova sessão vazia
        if (sessionId === currentSessionId) {
          await handleNewSession();
        }

        // Remover do estado local
        setConversationSessions((prev) =>
          prev.filter((s) => s.session_id !== sessionId),
        );

        // Remover do banco de dados usando a nova função
        await deleteSession(sessionId);
      } catch (error) {
        console.error("Erro ao deletar sessão:", error);
        // Recarregar sessões para restaurar o estado em caso de erro
        try {
          const sessions = await loadConversationSessions();
          setConversationSessions(sessions);
        } catch (reloadError) {
          console.error("Erro ao recarregar sessões:", reloadError);
        }
      }
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col">
        <ScrollArea className="h-[500px] rounded-2xl border border-border/60 bg-background/60 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}
            {isSending && (
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white/80 px-4 py-3 text-sm shadow-sm dark:bg-white/5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Pensando...</span>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>
        </ScrollArea>

        {error && (
          <div className="mt-4 rounded-2xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.slice(0, 3).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isSending}
              className="rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-border hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Textarea
            ref={textareaRef}
            placeholder="Faça uma pergunta ou descreva o que precisa automatizar..."
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleTextareaKeyDown}
            disabled={isSending}
            className="resize-none rounded-2xl border-border/70 bg-background/70 disabled:opacity-50"
            rows={4}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Pressione Enter para enviar, Shift + Enter para quebrar linha
            </p>
            <Button
              type="submit"
              disabled={isSending || inputValue.trim().length < 2}
              className="rounded-full px-6"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando
                </>
              ) : (
                "Enviar"
              )}
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              Histórico de Conversas
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewSession}
              className="h-6 w-6 p-0"
              title="Nova sessão"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {formattedInsights.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border/60 px-3 py-2">
                Nenhuma conversa no histórico
              </li>
            ) : (
              formattedInsights.map((item, index) => {
                const session = conversationSessions[index];
                return (
                  <li
                    key={`${item}-${index}`}
                    className={`group rounded-2xl border border-dashed border-border/60 px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 ${
                      session?.session_id === currentSessionId
                        ? "bg-primary/5 border-primary/30"
                        : ""
                    }`}
                    onClick={() =>
                      session && handleLoadSession(session.session_id)
                    }
                    title="Clique para carregar esta conversa"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex-1">{item}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) =>
                          session && handleDeleteSession(session.session_id, e)
                        }
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Deletar conversa"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
        <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
          <h4 className="text-sm font-semibold text-foreground">
            O que posso fazer?
          </h4>
          <p className="mt-3 text-sm text-muted-foreground">
            Solicite relatórios de saldo, cadastre recibos, organize gastos
            fixos ou peça sugestões personalizadas. Tudo é contextualizado com
            seus dados do Supabase automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === "assistant";
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm",
        isAssistant
          ? "border-border/60 bg-white/80 text-foreground dark:bg-white/5"
          : "ml-auto max-w-[85%] border-sidebar-primary/40 bg-sidebar-primary text-sidebar-primary-foreground",
      )}
    >
      <p>{message.content}</p>
      {message.metadata?.result && (
        <div className="rounded-2xl border border-border/70 bg-background/80 p-3 text-xs text-muted-foreground">
          {Object.entries(message.metadata.result).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="font-medium capitalize">
                {key.replace(/_/g, " ")}
              </span>
              <span>
                {typeof value === "object"
                  ? JSON.stringify(value, null, 2)
                  : String(value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
