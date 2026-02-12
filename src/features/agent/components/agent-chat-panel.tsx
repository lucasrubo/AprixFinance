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
  updateSessionStatus,
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
      status?: "active" | "inactive";
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
        } else {
          // Se não há sessões salvas, criar uma nova sessão com mensagem de boas-vindas
          const newSessionId = generateSessionId();
          const welcomeMessage: ChatMessage = {
            id: "welcome",
            role: "assistant",
            content: `Olá${userName ? `, ${userName}` : ""}! Sou o agente Finance AI. Pergunte sobre recibos, gastos fixos ou peça recomendações que eu cuido do contexto financeiro para você.`,
          };
          const newSession = {
            session_id: newSessionId,
            messages: [welcomeMessage],
            created_at: new Date().toISOString(),
          };

          try {
            // Criar sessão no banco de dados
            await createSession(newSessionId);
            // Salvar mensagem de boas-vindas
            await saveMessageToHistory(welcomeMessage, newSessionId);
          } catch (createError) {
            console.error("Erro ao criar sessão inicial:", createError);
            // Continuar mesmo se falhar, pois a sessão será criada quando a primeira mensagem for salva
          }

          setCurrentSessionId(newSessionId);
          setMessages([welcomeMessage]);
          setConversationSessions([newSession]);
        }
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        // Criar sessão de boas-vindas mesmo em caso de erro
        const newSessionId = generateSessionId();
        const welcomeMessage: ChatMessage = {
          id: "welcome",
          role: "assistant",
          content: `Olá${userName ? `, ${userName}` : ""}! Sou o agente Finance AI. Pergunte sobre recibos, gastos fixos ou peça recomendações que eu cuido do contexto financeiro para você.`,
        };

        try {
          // Tentar criar sessão no banco mesmo em caso de erro
          await createSession(newSessionId);
          await saveMessageToHistory(welcomeMessage, newSessionId);
        } catch (createError) {
          console.error("Erro ao criar sessão de fallback:", createError);
        }

        setCurrentSessionId(newSessionId);
        setMessages([welcomeMessage]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [userName]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Função para processar resposta do agente e extrair dados JSON
  const processAgentResponse = (response: string) => {
    // Procurar por padrões de dados estruturados na resposta
    const structuredPatterns = [
      // Padrão: "expenses:\n" seguido de campos estruturados
      /([a-zA-Z_]+):\s*\n([\s\S]*?)(?=\n\n|\n*$)/,
      // Padrão: "expenses\n[ {...} ]"
      /([a-zA-Z_]+)\s*\n\s*(\[.*?\])/,
      // Padrão: "expenses: [ {...} ]"
      /([a-zA-Z_]+):\s*(\[.*?\])/,
      // Padrão: apenas JSON array ou object
      /^(\[.*\]|\{.*\})$/,
    ];

    let cleanResponse = response;
    const extractedData: Record<string, any> = {};

    for (const pattern of structuredPatterns) {
      const match = cleanResponse.match(pattern);
      if (match) {
        try {
          const key = match[1] || "data";
          let dataStr = match[2] || match[0];

          let parsedData: any;

          // Se for o formato estruturado com quebras de linha
          if (
            dataStr.includes(":\n") &&
            !dataStr.trim().startsWith("[") &&
            !dataStr.trim().startsWith("{")
          ) {
            // Converter formato estruturado para objeto
            const lines = dataStr
              .trim()
              .split("\n")
              .filter((line) => line.trim() !== "");
            const obj: Record<string, any> = {};

            for (let i = 0; i < lines.length; i += 2) {
              const fieldLine = lines[i];
              const valueLine = lines[i + 1];

              if (fieldLine && fieldLine.endsWith(":")) {
                const field = fieldLine
                  .slice(0, -1)
                  .trim()
                  .replace(/\s+/g, "_");
                const value = valueLine ? valueLine.trim() : "";

                // Tentar converter valores
                if (value === "null") {
                  obj[field] = null;
                } else if (value === "true") {
                  obj[field] = true;
                } else if (value === "false") {
                  obj[field] = false;
                } else if (!isNaN(Number(value)) && value !== "") {
                  obj[field] = Number(value);
                } else {
                  obj[field] = value;
                }
              }
            }

            parsedData = obj;
          } else {
            // Tentar fazer parse como JSON normal
            parsedData = JSON.parse(dataStr);
          }

          extractedData[key] = parsedData;

          // Remover os dados da resposta textual
          cleanResponse = cleanResponse.replace(match[0], "").trim();

          // Remover linhas vazias extras
          cleanResponse = cleanResponse.replace(/\n\s*\n/g, "\n").trim();

          break; // Processar apenas o primeiro match encontrado
        } catch (error) {
          // Se não conseguir fazer parse, continuar
          console.warn("Erro ao fazer parse dos dados na resposta:", error);
        }
      }
    }

    return {
      cleanResponse:
        cleanResponse ||
        "Dados processados com sucesso! Aqui estão os resultados:",
      extractedData,
    };
  };

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

      // Processar resposta para extrair dados JSON
      const { cleanResponse, extractedData } = processAgentResponse(
        payload.response,
      );

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: cleanResponse,
        metadata: {
          result: { ...payload.result, ...extractedData },
          insights: payload.insights,
          suggestions: payload.suggestions,
        },
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

  const activeSessions = useMemo(
    () =>
      conversationSessions.filter((session) => session.status !== "inactive"),
    [conversationSessions],
  );

  const formattedSessionHistory = useMemo(
    () =>
      activeSessions.slice(0, 5).map((session) => {
        const date = new Date(session.created_at).toLocaleDateString("pt-BR");
        const time = new Date(session.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        // Contar apenas mensagens que não são de boas-vindas
        const messageCount = session.messages.filter(
          (msg) => msg.id !== "welcome",
        ).length;

        // Usar título da sessão se disponível, senão usar preview da primeira mensagem não-boas-vindas
        let displayText = "";
        if (session.title) {
          displayText = session.title;
        } else {
          const nonWelcomeMessages = session.messages.filter(
            (msg) => msg.id !== "welcome",
          );
          if (nonWelcomeMessages.length > 0) {
            const firstMessage = nonWelcomeMessages[0]?.content || "";
            displayText =
              firstMessage.length > 40
                ? firstMessage.substring(0, 40) + "..."
                : firstMessage;
          } else {
            displayText = "Nova conversa";
          }
        }

        return `📅 ${date} ${time} - ${messageCount} mensagens: ${displayText}`;
      }),
    [activeSessions],
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
        const welcomeMessage: ChatMessage = {
          id: "welcome",
          role: "assistant",
          content: `Olá${userName ? `, ${userName}` : ""}! Sou o agente Finance AI. Pergunte sobre recibos, gastos fixos ou peça recomendações que eu cuido do contexto financeiro para você.`,
        };
        setMessages([welcomeMessage]);
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
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content: `Olá${userName ? `, ${userName}` : ""}! Sou o agente Finance AI. Como posso ajudar?`,
    };
    const newSession = {
      session_id: newSessionId,
      messages: [welcomeMessage],
      created_at: new Date().toISOString(),
    };

    try {
      // Criar sessão no banco de dados
      await createSession(newSessionId);
      // Salvar mensagem de boas-vindas
      await saveMessageToHistory(welcomeMessage, newSessionId);
    } catch (error) {
      console.error("Erro ao criar nova sessão:", error);
      // Continuar mesmo se falhar, pois a sessão será criada quando a primeira mensagem for salva
    }

    setCurrentSessionId(newSessionId);
    setMessages([welcomeMessage]);
    setConversationSessions((prev) => [newSession, ...prev]);
    setInsights([]);
    setSuggestions(fallbackSuggestions);
  };

  const handleToggleSessionStatus = async (
    sessionId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation(); // Impede que o clique no botão dispare o onClick do item

    try {
      const currentSession = conversationSessions.find(
        (s) => s.session_id === sessionId,
      );
      const newStatus =
        currentSession?.status === "active" ? "inactive" : "active";

      // Atualizar no banco de dados
      await updateSessionStatus(sessionId, newStatus);

      // Atualizar estado local
      setConversationSessions((prev) =>
        prev.map((session) =>
          session.session_id === sessionId
            ? { ...session, status: newStatus }
            : session,
        ),
      );
    } catch (error) {
      console.error("Erro ao alterar status da sessão:", error);
      setError("Erro ao alterar status da sessão.");
    }
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
    <div className="flex flex-col lg:grid lg:gap-6 lg:grid-cols-[2fr_1fr] lg:h-[calc(90vh-6rem)]">
      <div className="flex flex-col flex-1 lg:min-h-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white/80 px-4 py-3 text-sm shadow-sm dark:bg-white/5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Carregando histórico...
                  </span>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </ScrollArea>

        {error && (
          <div className="mt-4 rounded-2xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
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

      <div className="space-y-4 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
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
            {formattedSessionHistory.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border/60 px-3 py-2">
                Nenhuma conversa no histórico
              </li>
            ) : (
              formattedSessionHistory.map((item, index) => {
                const session = activeSessions[index];
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
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) =>
                            session &&
                            handleToggleSessionStatus(session.session_id, e)
                          }
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-warning opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Ocultar conversa do histórico"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
        {/* Seção de Insights da IA */}
        {insights.length > 0 && (
          <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Insights Financeiros
            </h4>
            <ul className="mt-3 space-y-2">
              {insights.map((insight, index) => (
                <li
                  key={index}
                  className="text-sm text-muted-foreground rounded-lg bg-muted/50 p-2"
                >
                  💡 {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

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
  const insights = (message.metadata?.insights as string[]) || [];
  const suggestions = (message.metadata?.suggestions as string[]) || [];

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm",
        isAssistant
          ? "border-border/60 bg-white/80 text-foreground dark:bg-white/5 !rounded-tl-none"
          : "ml-auto max-w-[85%] border-sidebar-primary/40 bg-sidebar-primary text-sidebar-primary-foreground !rounded-br-none",
      )}
    >
      <p>{message.content}</p>

      {message.metadata?.result && (
        <div className="rounded-2xl border border-border/70 bg-background/80 p-3 text-xs">
          {Object.entries(message.metadata.result).map(([key, value]) => (
            <div key={key} className="mb-3 last:mb-0">
              <div className="font-medium capitalize text-foreground mb-2">
                {key.replace(/_/g, " ")}:
              </div>
              {Array.isArray(value) ? (
                <div className="space-y-2">
                  {value.map((item, index) => (
                    <div
                      key={index}
                      className="border border-border/50 rounded-lg p-2 bg-background/50"
                    >
                      {typeof item === "object" ? (
                        <div className="space-y-2">
                          {Object.entries(item)
                            .filter(
                              ([itemKey]) =>
                                !itemKey.toLowerCase().includes("id"),
                            )
                            .map(([itemKey, itemValue]) => {
                              const isDateField =
                                itemKey.toLowerCase().includes("data") ||
                                itemKey.toLowerCase().includes("date") ||
                                itemKey.toLowerCase().endsWith("_at");
                              const isMoneyField =
                                itemKey.toLowerCase().includes("valor") ||
                                itemKey.toLowerCase().includes("price") ||
                                itemKey.toLowerCase().includes("amount");
                              const displayKey = itemKey.replace(/_/g, " ");

                              let displayValue;
                              if (
                                isDateField &&
                                itemValue &&
                                typeof itemValue === "string"
                              ) {
                                try {
                                  const date = new Date(itemValue);
                                  displayValue = date.toLocaleDateString(
                                    "pt-BR",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  );
                                } catch {
                                  displayValue = itemValue;
                                }
                              } else if (
                                isMoneyField &&
                                typeof itemValue === "number"
                              ) {
                                displayValue = new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(itemValue);
                              } else {
                                displayValue =
                                  typeof itemValue === "string" &&
                                  itemValue.length > 50
                                    ? `${itemValue.substring(0, 50)}...`
                                    : String(itemValue || "N/A");
                              }

                              return (
                                <div
                                  key={itemKey}
                                  className="flex justify-between items-start text-xs py-1"
                                >
                                  <span className="font-medium text-muted-foreground capitalize flex-shrink-0 mr-2">
                                    {displayKey}:
                                  </span>
                                  <span
                                    className={`text-foreground text-right ${isDateField ? "font-mono text-xs" : ""} ${isMoneyField ? "font-semibold text-green-600" : ""}`}
                                  >
                                    {displayValue}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <span className="text-foreground">{String(item)}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : typeof value === "object" && value !== null ? (
                <div className="border border-border/50 rounded-lg p-3 bg-background/50">
                  <div className="space-y-2">
                    {Object.entries(value)
                      .filter(
                        ([objKey]) => !objKey.toLowerCase().includes("id"),
                      )
                      .map(([objKey, objValue]) => {
                        const isDateField =
                          objKey.toLowerCase().includes("data") ||
                          objKey.toLowerCase().includes("date") ||
                          objKey.toLowerCase().endsWith("_at");
                        const isMoneyField =
                          objKey.toLowerCase().includes("valor") ||
                          objKey.toLowerCase().includes("price") ||
                          objKey.toLowerCase().includes("amount");
                        const displayKey = objKey.replace(/_/g, " ");

                        let displayValue;
                        if (
                          isDateField &&
                          objValue &&
                          typeof objValue === "string"
                        ) {
                          try {
                            const date = new Date(objValue);
                            displayValue = date.toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                          } catch {
                            displayValue = objValue;
                          }
                        } else if (
                          isMoneyField &&
                          typeof objValue === "number"
                        ) {
                          displayValue = new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(objValue);
                        } else {
                          displayValue =
                            typeof objValue === "string" && objValue.length > 50
                              ? `${objValue.substring(0, 50)}...`
                              : String(objValue || "N/A");
                        }

                        return (
                          <div
                            key={objKey}
                            className="flex justify-between items-start text-xs py-1"
                          >
                            <span className="font-medium text-muted-foreground capitalize flex-shrink-0 mr-2">
                              {displayKey}:
                            </span>
                            <span
                              className={`text-foreground text-right ${isDateField ? "font-mono text-xs" : ""} ${isMoneyField ? "font-semibold text-green-600" : ""}`}
                            >
                              {displayValue}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <span className="text-foreground">{String(value)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {insights.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3 w-3" />
            <span className="font-medium">💡 Insights</span>
          </div>
          <ul className="space-y-1">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
