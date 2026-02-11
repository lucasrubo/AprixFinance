"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Badge } from "@/shared/components/ui/badge";
import { sendAgentMessage } from "@/features/agent/lib/chat-client";
import { cn } from "@/shared/lib/utils";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  metadata?: {
    result?: Record<string, unknown>;
  };
};

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

  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
      const payload = await sendAgentMessage(content);
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: payload.response,
          metadata: payload.result ? { result: payload.result } : undefined,
        },
      ]);

      if (payload.insights?.length) {
        setInsights(payload.insights);
      }

      if (payload.suggestions?.length) {
        setSuggestions(payload.suggestions);
      }
    } catch (err) {
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
      insights.length > 0
        ? insights
        : [
            "Faça perguntas diretas sobre recibos ou grupos para receber ações rápidas.",
            "Você pode pedir para registrar um novo gasto sem sair desta tela.",
          ],
    [insights],
  );

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    textareaRef.current?.focus();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col rounded-3xl border border-border/70 bg-card/95 p-4 shadow-lg shadow-black/5 lg:p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/40 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Assistente Finance AI
            </p>
            <p className="text-xs text-muted-foreground">
              Conecta-se ao seu histórico em tempo real
            </p>
          </div>
        </div>

        <ScrollArea className="mt-6 h-[480px] rounded-2xl border border-border/60 bg-background/60 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}
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
              className="rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-border hover:text-foreground"
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
            className="resize-none rounded-2xl border-border/70 bg-background/70"
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
              Insights recentes
            </h4>
            <Badge variant="outline" className="rounded-full text-[11px]">
              Tempo real
            </Badge>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {formattedInsights.map((insight, index) => (
              <li
                key={`${insight}-${index}`}
                className="rounded-2xl border border-dashed border-border/60 px-3 py-2"
              >
                {insight}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
          <h4 className="text-sm font-semibold text-foreground">
            O que posso fazer?
          </h4>
          <p className="mt-3 text-sm text-muted-foreground">
            Solicite relatórios de saldo, cadastre recibos, organize gastos fixos
            ou peça sugestões personalizadas. Tudo é contextualizado com seus
            dados do Supabase automaticamente.
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

