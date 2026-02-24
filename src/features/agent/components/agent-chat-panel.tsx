"use client";

import {
  type ChatMessage,
  clearConversationHistory,
  createSession,
  deleteSession,
  generateSessionId,
  loadConversationSessions,
  saveMessageToHistory,
  sendAgentMessage,
} from "@/features/agent/lib/chat-client";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

const FALLBACK_SUGGESTIONS = [
  "Quais gastos fixos vencem esta semana?",
  "Resuma minhas despesas do mês",
  "Tenho margem para um novo investimento?",
];

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

type Session = {
  session_id: string;
  messages: ChatMessage[];
  created_at: string;
  title?: string;
  status?: "active" | "inactive";
};

interface AgentChatPanelProps {
  userName?: string;
}

export function AgentChatPanel({ userName }: AgentChatPanelProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] =
    useState<string[]>(FALLBACK_SUGGESTIONS);

  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const welcomeText = `Olá${userName ? `, ${userName}` : ""}! Sou o agente Finance AI. Pergunte sobre recibos, gastos fixos ou peça recomendações.`;

  // Scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load sessions on mount
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setIsLoading(true);
      try {
        const loaded = await loadConversationSessions();
        if (cancelled) return;

        const active = loaded.filter((s) => s.status !== "inactive");

        if (active.length > 0) {
          const latest = active[0];
          setSessions(active);
          setCurrentSessionId(latest.session_id);
          setMessages(latest.messages);
        } else {
          // Create a fresh session
          const newId = generateSessionId();
          const welcome: ChatMessage = {
            id: "welcome",
            role: "assistant",
            content: welcomeText,
          };
          try {
            await createSession(newId);
            await saveMessageToHistory(welcome, newId);
          } catch {
            // Non-fatal: session will be created on first real message
          }
          if (cancelled) return;
          setCurrentSessionId(newId);
          setMessages([welcome]);
          setSessions([
            {
              session_id: newId,
              messages: [welcome],
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch {
        if (cancelled) return;
        // Fallback: just show welcome message locally
        const newId = generateSessionId();
        const welcome: ChatMessage = {
          id: "welcome",
          role: "assistant",
          content: welcomeText,
        };
        setCurrentSessionId(newId);
        setMessages([welcome]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async () => {
    const content = inputValue.trim();
    if (!content || isSending) return;

    const userMsg: ChatMessage = { id: generateId(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsSending(true);
    setError(null);

    try {
      await saveMessageToHistory(userMsg, currentSessionId);

      const payload = await sendAgentMessage(content);

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: payload.response,
        metadata: {
          result: payload.result,
          insights: payload.insights,
          suggestions: payload.suggestions,
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);
      await saveMessageToHistory(assistantMsg, currentSessionId);

      // Update session in local state
      setSessions((prev) =>
        prev.map((s) =>
          s.session_id === currentSessionId
            ? { ...s, messages: [...s.messages, userMsg, assistantMsg] }
            : s,
        ),
      );

      if (payload.suggestions?.length) setSuggestions(payload.suggestions);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Não foi possível falar com o assistente agora.";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: "assistant", content: `Erro: ${msg}` },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewSession = async () => {
    const newId = generateSessionId();
    const welcome: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content: `Olá${userName ? `, ${userName}` : ""}! Sou o agente Finance AI. Como posso ajudar?`,
    };
    try {
      await createSession(newId);
      await saveMessageToHistory(welcome, newId);
    } catch {
      // Non-fatal
    }
    const newSession: Session = {
      session_id: newId,
      messages: [welcome],
      created_at: new Date().toISOString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setMessages([welcome]);
    setSuggestions(FALLBACK_SUGGESTIONS);
    setError(null);
  };

  const handleLoadSession = (sessionId: string) => {
    const session = sessions.find((s) => s.session_id === sessionId);
    if (!session) return;
    setCurrentSessionId(sessionId);
    setMessages(session.messages);
    setError(null);
    setSuggestions(FALLBACK_SUGGESTIONS);
  };

  const handleDeleteSession = async (
    sessionId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja deletar esta conversa?")) return;

    const wasActive = sessionId === currentSessionId;
    setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));

    if (wasActive) {
      const remaining = sessions.filter((s) => s.session_id !== sessionId);
      if (remaining.length > 0) {
        handleLoadSession(remaining[0].session_id);
      } else {
        await handleNewSession();
      }
    }

    try {
      await deleteSession(sessionId);
    } catch {
      // Reload to restore state
      try {
        const reloaded = await loadConversationSessions();
        setSessions(reloaded.filter((s) => s.status !== "inactive"));
      } catch {}
    }
  };

  const handleClearAll = async () => {
    if (
      !confirm("Tem certeza que deseja limpar todo o histórico de conversas?")
    )
      return;
    try {
      await clearConversationHistory();
      const newId = generateSessionId();
      const welcome: ChatMessage = {
        id: "welcome",
        role: "assistant",
        content: welcomeText,
      };
      setCurrentSessionId(newId);
      setMessages([welcome]);
      setSessions([
        {
          session_id: newId,
          messages: [welcome],
          created_at: new Date().toISOString(),
        },
      ]);
      setSuggestions(FALLBACK_SUGGESTIONS);
      setError(null);
    } catch {
      setError("Erro ao limpar histórico.");
    }
  };

  const activeSessions = sessions
    .filter((s) => s.status !== "inactive")
    .slice(0, 6);

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[2fr_1fr] lg:gap-6 lg:h-[calc(90vh-6rem)]">
      {/* Chat area */}
      <div className="flex flex-col flex-1 lg:min-h-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white/80 px-4 py-3 text-sm shadow-sm dark:bg-white/5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Carregando histórico...
                  </span>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isSending && (
                  <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white/80 px-4 py-3 text-sm shadow-sm dark:bg-white/5">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Pensando...</span>
                  </div>
                )}
                <div ref={endRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {error && (
          <div className="mt-2 rounded-2xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          {suggestions.slice(0, 3).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setInputValue(s);
                textareaRef.current?.focus();
              }}
              disabled={isSending}
              className="rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-border hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="mt-4 space-y-3"
        >
          <Textarea
            ref={textareaRef}
            placeholder="Faça uma pergunta ou descreva o que precisa..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="resize-none rounded-2xl border-border/70 bg-background/70 disabled:opacity-50"
            rows={4}
          />
          <div className="flex items-center justify-between !mb-8">
            <p className="text-xs text-muted-foreground">
              Enter para enviar · Shift+Enter para nova linha
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

      {/* Sidebar panel */}
      <div className="space-y-4 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
        {/* Session history */}
        <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-foreground">
              Histórico de Conversas
            </h4>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewSession}
                className="h-6 w-6 p-0"
                title="Nova sessão"
              >
                <Plus className="h-4 w-4" />
              </Button>
              {activeSessions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-6 w-6 p-0 text-destructive/60 hover:text-destructive"
                  title="Limpar tudo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          <ul className="space-y-2 text-sm text-muted-foreground">
            {activeSessions.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border/60 px-3 py-2 text-xs">
                Nenhuma conversa no histórico
              </li>
            ) : (
              activeSessions.map((session) => {
                const date = new Date(session.created_at).toLocaleDateString(
                  "pt-BR",
                );
                const time = new Date(session.created_at).toLocaleTimeString(
                  [],
                  { hour: "2-digit", minute: "2-digit" },
                );
                const userMessages = session.messages.filter(
                  (m) => m.role === "user",
                );
                const preview =
                  session.title ||
                  userMessages[0]?.content?.slice(0, 35) +
                    (userMessages[0]?.content?.length > 35 ? "..." : "") ||
                  "Nova conversa";
                const isActive = session.session_id === currentSessionId;

                return (
                  <li
                    key={session.session_id}
                    className={cn(
                      "group rounded-2xl border border-dashed border-border/60 px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50",
                      isActive && "bg-primary/5 border-primary/30",
                    )}
                    onClick={() => handleLoadSession(session.session_id)}
                    title="Clique para carregar esta conversa"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {preview}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                          {date} {time} · {userMessages.length} mensagens
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) =>
                          handleDeleteSession(session.session_id, e)
                        }
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
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

        {/* What I can do */}
        <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4" />O que posso fazer?
          </h4>
          <p className="mt-3 text-sm text-muted-foreground">
            Solicite relatórios de saldo, cadastre recibos, organize gastos
            fixos ou peça sugestões personalizadas. Tudo contextualizado com
            seus dados automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === "assistant";
  const insights = (message.metadata?.insights as string[]) || [];

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm",
        isAssistant
          ? "border-border/60 bg-white/80 text-foreground dark:bg-white/5 !rounded-tl-none"
          : "ml-auto max-w-[85%] border-sidebar-primary/40 bg-sidebar-primary text-sidebar-primary-foreground !rounded-br-none",
      )}
    >
      <p className="whitespace-pre-wrap">{message.content}</p>

      {message.metadata?.result &&
        Object.keys(message.metadata.result).length > 0 && (
          <ResultCard result={message.metadata.result} />
        )}

      {insights.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3 w-3" />
            <span className="font-medium">Insights</span>
          </div>
          <ul className="space-y-1">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2">
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

function ResultCard({ result }: { result: Record<string, unknown> }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-3 text-xs">
      {Object.entries(result).map(([key, value]) => (
        <div key={key} className="mb-3 last:mb-0">
          <div className="font-medium capitalize text-foreground mb-2">
            {key.replace(/_/g, " ")}:
          </div>
          {Array.isArray(value) ? (
            <div className="space-y-2">
              {value.map((item, i) => (
                <div
                  key={i}
                  className="border border-border/50 rounded-lg p-2 bg-background/50"
                >
                  {typeof item === "object" && item !== null ? (
                    <FieldList fields={item as Record<string, unknown>} />
                  ) : (
                    <span className="text-foreground">{String(item)}</span>
                  )}
                </div>
              ))}
            </div>
          ) : typeof value === "object" && value !== null ? (
            <div className="border border-border/50 rounded-lg p-3 bg-background/50">
              <FieldList fields={value as Record<string, unknown>} />
            </div>
          ) : (
            <span className="text-foreground">{String(value ?? "N/A")}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function FieldList({ fields }: { fields: Record<string, unknown> }) {
  return (
    <div className="space-y-1">
      {Object.entries(fields)
        .filter(([k]) => !k.toLowerCase().includes("id"))
        .map(([k, v]) => {
          const isDate =
            k.toLowerCase().includes("data") ||
            k.toLowerCase().includes("date") ||
            k.endsWith("_at");
          const isMoney =
            k.toLowerCase().includes("valor") ||
            k.toLowerCase().includes("price") ||
            k.toLowerCase().includes("amount");

          let display: string;
          if (isDate && typeof v === "string") {
            try {
              display = new Date(v).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
            } catch {
              display = v;
            }
          } else if (isMoney && typeof v === "number") {
            display = new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(v);
          } else {
            const str = String(v ?? "N/A");
            display = str.length > 50 ? `${str.slice(0, 50)}...` : str;
          }

          return (
            <div key={k} className="flex justify-between items-start py-0.5">
              <span className="font-medium text-muted-foreground capitalize flex-shrink-0 mr-2">
                {k.replace(/_/g, " ")}:
              </span>
              <span
                className={cn(
                  "text-foreground text-right",
                  isDate && "font-mono text-xs",
                  isMoney && "font-semibold text-green-600",
                )}
              >
                {display}
              </span>
            </div>
          );
        })}
    </div>
  );
}
