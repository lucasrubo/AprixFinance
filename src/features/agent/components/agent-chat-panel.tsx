"use client";

import {
  type ChatMessage,
  clearConversationHistory,
  deleteSession,
  generateSessionId,
  loadConversationSessions,
  saveMessageToHistory,
  sendAgentMessage,
} from "@/features/agent/lib/chat-client";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { cn } from "@/shared/lib/utils";
import {
  ArrowUp,
  Clock,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const [suggestions, setSuggestions] = useState<string[]>(FALLBACK_SUGGESTIONS);
  const [historyOpen, setHistoryOpen] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const welcomeText = `Olá${userName ? `, ${userName}` : ""}! Sou o agente Aprix AI. Pergunte sobre recibos, gastos fixos ou peça recomendações.`;

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: inputValue triggers resize intentionally
  useEffect(() => {
    resizeTextarea();
  }, [inputValue, resizeTextarea]);

  // Scroll to bottom
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages/isSending trigger scroll intentionally
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

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
          // No sessions in DB yet — just show welcome locally.
          // The session will be created in DB on the first real message sent.
          if (cancelled) return;
          const newId = generateSessionId();
          const welcome: ChatMessage = {
            id: "welcome",
            role: "assistant",
            content: welcomeText,
          };
          setCurrentSessionId(newId);
          setMessages([welcome]);
          // Don't add to sessions list — history only shows sessions with real messages
        }
      } catch {
        if (cancelled) return;
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

    if (textareaRef.current) textareaRef.current.style.height = "auto";

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

      setSessions((prev) => {
        const exists = prev.some((s) => s.session_id === currentSessionId);
        if (exists) {
          return prev.map((s) =>
            s.session_id === currentSessionId
              ? { ...s, messages: [...s.messages, userMsg, assistantMsg] }
              : s,
          );
        }
        // First message of a new session — add it to the history list
        return [
          {
            session_id: currentSessionId,
            messages: [...messages, userMsg, assistantMsg],
            created_at: new Date().toISOString(),
          },
          ...prev,
        ];
      });

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

  const handleNewSession = () => {
    const newId = generateSessionId();
    const welcome: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content: `Olá${userName ? `, ${userName}` : ""}! Sou o agente Aprix AI. Como posso ajudar?`,
    };
    // Don't save to DB yet — session is created on first real message sent.
    setCurrentSessionId(newId);
    setMessages([welcome]);
    setSuggestions(FALLBACK_SUGGESTIONS);
    setError(null);
    setHistoryOpen(false);
  };

  const handleLoadSession = (sessionId: string) => {
    const session = sessions.find((s) => s.session_id === sessionId);
    if (!session) return;
    setCurrentSessionId(sessionId);
    setMessages(session.messages);
    setError(null);
    setSuggestions(FALLBACK_SUGGESTIONS);
    setHistoryOpen(false);
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
        handleNewSession();
      }
    }

    // Fire-and-forget: optimistic delete already applied above.
    // If it fails the session will reappear on next page load (acceptable).
    deleteSession(sessionId).catch(() => {
      setError("Não foi possível deletar a conversa. Tente novamente.");
    });
  };

  const handleClearAll = async () => {
    if (!confirm("Tem certeza que deseja limpar todo o histórico de conversas?"))
      return;
    try {
      await clearConversationHistory();
      const newId = generateSessionId();
      const welcome: ChatMessage = {
        id: "welcome",
        role: "assistant",
        content: welcomeText,
      };
      // Don't save to DB — session created on first real message
      setCurrentSessionId(newId);
      setMessages([welcome]);
      setSessions([]);
      setSuggestions(FALLBACK_SUGGESTIONS);
      setError(null);
    } catch {
      setError("Erro ao limpar histórico.");
    }
  };

  const activeSessions = sessions
    .filter((s) => s.status !== "inactive")
    .slice(0, 10);

  // ── History panel (shared between desktop sidebar and mobile sheet) ──────────
  const HistoryPanel = () => (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Conversas
          </h4>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewSession}
              className="h-7 w-7 p-0 rounded-lg"
              title="Nova conversa"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {activeSessions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-7 w-7 p-0 rounded-lg text-destructive/60 hover:text-destructive"
                title="Limpar tudo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Session list */}
        <ul className="space-y-1.5">
          {activeSessions.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border/60 px-3 py-3 text-xs text-muted-foreground text-center">
              Nenhuma conversa ainda
            </li>
          ) : (
            activeSessions.map((session) => {
              const date = new Date(session.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              });
              const userMessages = session.messages.filter((m) => m.role === "user");
              const preview =
                session.title ||
                (userMessages[0]?.content?.slice(0, 40) +
                  (userMessages[0]?.content?.length > 40 ? "..." : "")) ||
                "Nova conversa";
              const isActive = session.session_id === currentSessionId;

              return (
                <li
                  key={session.session_id}
                  className={cn(
                    "group flex items-start justify-between gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/60 text-muted-foreground",
                  )}
                  onClick={() => handleLoadSession(session.session_id)}
                  onKeyDown={(e) => e.key === "Enter" && handleLoadSession(session.session_id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-medium truncate", isActive ? "text-primary" : "text-foreground")}>
                      {preview}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {date} · {userMessages.length} mensagens
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(session.session_id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-5 w-5 flex items-center justify-center rounded-md hover:text-destructive text-muted-foreground"
                    title="Deletar"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* What I can do */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 mt-auto">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />O que posso fazer?
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Relatórios de saldo, cadastro de recibos, análise de gastos fixos e sugestões personalizadas com seus dados.
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_280px] md:gap-5 h-[calc(100svh-200px)] md:h-[calc(100svh-80px-120px)] lg:h-[calc(100svh-80px-80px)]">

      {/* ── Mobile top bar ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3 md:hidden">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-none">Aprix AI</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {activeSessions.length > 0
                ? `${activeSessions.length} conversa${activeSessions.length !== 1 ? "s" : ""}`
                : "Nova conversa"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNewSession}
          className="h-8 px-3 rounded-xl text-xs gap-1.5 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setHistoryOpen(true)}
          className="h-8 px-3 rounded-xl text-xs gap-1.5 shrink-0"
        >
          <Clock className="h-3.5 w-3.5" />
          Histórico
        </Button>
      </div>

      {/* ── Chat area ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-h-0 rounded-2xl border border-border/60 bg-card/80 overflow-hidden">
        {/* Desktop chat header */}
        <div className="hidden md:flex items-center gap-3 px-4 py-3 border-b border-border/40 shrink-0">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <img src="/icon.png" alt="Aprix AI" width={16} height={16} className="h-4 w-4" style={{filter: "invert(1)"}} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Aprix AI</p>
            <p className="text-[11px] text-muted-foreground">Agente inteligente</p>
          </div>
          <div className="ml-auto flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewSession}
              className="h-8 px-3 rounded-xl text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova conversa
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-3 pb-2">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Carregando histórico...
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isSending && (
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <img src="/icon.png" alt="Aprix AI" width={16} height={16} className="h-4 w-4" style={{filter: "invert(1)"}} />
                    </div>
                    <div className="flex gap-1 items-center px-3 py-2 rounded-2xl rounded-tl-none bg-muted/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 rounded-xl border border-destructive/30 bg-destructive/8 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Suggestions + Input */}
        <div className="border-t border-border/40 px-3 pt-2 pb-3 shrink-0 space-y-2">
          {/* Suggestion chips - horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" style={{ scrollbarWidth: "thin" }}>
            {suggestions.slice(0, 3).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setInputValue(s);
                  textareaRef.current?.focus();
                }}
                disabled={isSending}
                className="shrink-0 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              placeholder="Pergunte algo sobre suas finanças..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              rows={1}
              className="flex-1 resize-none rounded-2xl border border-border/60 bg-background/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50 min-h-[42px] max-h-[120px] leading-normal"
              style={{ overflow: "hidden" }}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={isSending || inputValue.trim().length < 2}
              className="h-[42px] w-[42px] shrink-0 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center transition hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Enviar (Enter)"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center hidden md:block">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>

      {/* ── Desktop sidebar ───────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col rounded-2xl border border-border/60 bg-card/80 p-4 overflow-y-auto">
        <HistoryPanel />
      </div>

      {/* ── Mobile history sheet ──────────────────────────────────────── */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-[300px] p-5 flex flex-col">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="text-base">Histórico</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <HistoryPanel />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── MessageBubble ──────────────────────────────────────────────────────────────

function isBalanceResult(r: Record<string, unknown>): boolean {
  return "saldo" in r && "receitas" in r && "despesas_fixas" in r;
}

function isExpenseListResult(r: Record<string, unknown>): boolean {
  return "expenses" in r && Array.isArray(r.expenses);
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === "assistant";
  const insights = (message.metadata?.insights as string[]) || [];
  const result = message.metadata?.result as Record<string, unknown> | undefined;
  const hasBalance = result && Object.keys(result).length > 0 && isBalanceResult(result);
  const hasExpenseList = result && !hasBalance && isExpenseListResult(result);

  if (isAssistant) {
    return (
      <div className="flex items-start gap-2.5">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <img src="/icon.png" alt="Aprix AI" width={16} height={16} className="h-4 w-4" style={{filter: "invert(1)"}} />
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <div className="rounded-2xl rounded-tl-none bg-muted/60 px-4 py-3 text-sm text-foreground">
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>

          {hasBalance ? (
            <BalanceSummaryCard result={result as BalanceResult} />
          ) : hasExpenseList ? (
            <ExpenseListCard result={result as ExpenseListResult} />
          ) : (
            result && Object.keys(result).length > 0 && (
              <ResultCard result={result} />
            )
          )}

          {insights.length > 0 && (
            <div className="rounded-2xl border border-blue-200/70 bg-blue-50/60 px-4 py-3 text-xs dark:border-blue-800/50 dark:bg-blue-950/30">
              <div className="flex items-center gap-1.5 mb-2 text-blue-700 dark:text-blue-300">
                <Sparkles className="h-3 w-3" />
                <span className="font-semibold">Insights</span>
              </div>
              <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                {insights.map((insight) => (
                  <li key={insight} className="flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span className="leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-none bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm">
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}

// ── BalanceSummaryCard ─────────────────────────────────────────────────────────

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type BalanceResult = {
  saldo: number;
  receitas: number;
  despesas: number;
  despesas_fixas: number;
  total_gasto: number;
};

function BalanceSummaryCard({ result }: { result: BalanceResult }) {
  const { saldo, receitas, despesas, despesas_fixas, total_gasto } = result;
  const isPositive = saldo >= 0;
  const pctGasto = receitas > 0 ? Math.min(100, Math.round((total_gasto / receitas) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 overflow-hidden">
      {/* Saldo header */}
      <div className={cn(
        "px-4 py-4 flex items-center justify-between",
        isPositive
          ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-b border-emerald-200/40 dark:border-emerald-800/30"
          : "bg-rose-50/60 dark:bg-rose-950/30 border-b border-rose-200/40 dark:border-rose-800/30",
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-8 w-8 rounded-xl flex items-center justify-center",
            isPositive ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-rose-100 dark:bg-rose-900/50",
          )}>
            <Wallet className={cn("h-4 w-4", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")} />
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Saldo do mês
          </span>
        </div>
        <div className="text-right">
          <p className={cn(
            "text-xl font-bold tabular-nums",
            isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
          )}>
            {BRL.format(saldo)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {pctGasto}% da receita gasta
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted/40">
        <div
          className={cn(
            "h-full transition-all",
            pctGasto > 90 ? "bg-rose-500" : pctGasto > 70 ? "bg-amber-500" : "bg-emerald-500",
          )}
          style={{ width: `${pctGasto}%` }}
        />
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/40">
        <BalanceRow
          icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
          label="Receitas"
          value={receitas}
          color="emerald"
        />
        <BalanceRow
          icon={<TrendingDown className="h-3.5 w-3.5 text-rose-400" />}
          label="Despesas variáveis"
          value={despesas}
          color="rose"
        />
        <BalanceRow
          icon={<TrendingDown className="h-3.5 w-3.5 text-amber-500" />}
          label="Gastos fixos"
          value={despesas_fixas}
          color="amber"
        />
        <div className="px-4 py-2.5 flex items-center justify-between bg-muted/20">
          <span className="text-xs font-semibold text-foreground">Total gasto</span>
          <span className="text-sm font-bold tabular-nums text-foreground">
            {BRL.format(total_gasto)}
          </span>
        </div>
      </div>
    </div>
  );
}

function BalanceRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "emerald" | "rose" | "amber";
}) {
  const colorMap = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    rose: "text-rose-500 dark:text-rose-400",
    amber: "text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className={cn("text-xs font-semibold tabular-nums", colorMap[color])}>
        {BRL.format(value)}
      </span>
    </div>
  );
}

// ── ExpenseListCard ────────────────────────────────────────────────────────────

type FixedExpense = {
  id?: string;
  titulo: string;
  descricao?: string;
  categoria: "gasto_fixo" | "assinatura" | "servico";
  valor_parcela: number;
  data_pagamento: number;
  duracao?: number;
  status?: string;
};

type ExpenseListResult = {
  expenses: FixedExpense[];
  total?: number;
  count?: number;
};

const CATEGORY_LABEL: Record<string, string> = {
  assinatura: "Assinatura",
  servico: "Serviço",
  gasto_fixo: "Gasto Fixo",
};

const CATEGORY_COLORS: Record<string, string> = {
  assinatura:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  servico:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  gasto_fixo:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

function ExpenseListCard({ result }: { result: ExpenseListResult }) {
  const { expenses, total, count } = result;

  if (!expenses || expenses.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-6 text-center text-sm text-muted-foreground">
        Nenhum resultado encontrado.
      </div>
    );
  }

  const displayTotal =
    total ?? expenses.reduce((s, e) => s + e.valor_parcela, 0);
  const displayCount = count ?? expenses.length;

  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/20">
        <span className="text-xs font-semibold text-foreground">
          {displayCount} item{displayCount !== 1 ? "s" : ""}
        </span>
        <span className="text-xs font-bold text-foreground tabular-nums">
          Total: {BRL.format(displayTotal)}
        </span>
      </div>

      {/* List */}
      <div className="divide-y divide-border/30">
        {expenses.map((expense, i) => (
          <div
            key={expense.id ?? `${expense.titulo}-${i}`}
            className="flex items-start justify-between gap-3 px-4 py-3"
          >
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground truncate">
                  {expense.titulo}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    CATEGORY_COLORS[expense.categoria] ??
                      "bg-muted text-muted-foreground",
                  )}
                >
                  {CATEGORY_LABEL[expense.categoria] ?? expense.categoria}
                </span>
              </div>
              {expense.descricao && (
                <p className="text-xs text-muted-foreground truncate">
                  {expense.descricao}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Vence dia{" "}
                <span className="font-semibold text-foreground">
                  {expense.data_pagamento}
                </span>
                {expense.duracao
                  ? ` · ${expense.duracao} meses`
                  : " · Indefinido"}
              </p>
            </div>
            <span className="text-sm font-bold tabular-nums text-rose-500 dark:text-rose-400 shrink-0">
              {BRL.format(expense.valor_parcela)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ResultCard ────────────────────────────────────────────────────────────────

function ResultCard({ result }: { result: Record<string, unknown> }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-3 text-xs space-y-3">
      {Object.entries(result).map(([key, value]) => (
        <div key={key}>
          <div className="font-semibold capitalize text-foreground mb-1.5">
            {key.replace(/_/g, " ")}
          </div>
          {Array.isArray(value) ? (
            <div className="space-y-1.5">
              {value.map((item, i) => {
                const itemKey = typeof item === "object" && item !== null
                  ? `${i}-${Object.values(item as Record<string, unknown>).slice(0, 2).join("-")}`
                  : `${i}-${String(item).slice(0, 20)}`;
                return (
                <div
                  key={itemKey}
                  className="border border-border/40 rounded-xl p-2.5 bg-muted/30"
                >
                  {typeof item === "object" && item !== null ? (
                    <FieldList fields={item as Record<string, unknown>} />
                  ) : (
                    <span>{String(item)}</span>
                  )}
                </div>
                );
              })}
            </div>
          ) : typeof value === "object" && value !== null ? (
            <div className="border border-border/40 rounded-xl p-2.5 bg-muted/30">
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

// ── FieldList ─────────────────────────────────────────────────────────────────

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
            <div key={k} className="flex justify-between items-start gap-2 py-0.5">
              <span className="font-medium text-muted-foreground capitalize shrink-0">
                {k.replace(/_/g, " ")}:
              </span>
              <span
                className={cn(
                  "text-foreground text-right",
                  isMoney && "font-semibold text-emerald-600 dark:text-emerald-400",
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
