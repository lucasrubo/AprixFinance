import { AgentChatPanel } from "@/features/agent/components/agent-chat-panel";
import { createClient } from "@/shared/utils/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AgentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userName =
    (user?.user_metadata as Record<string, string> | undefined)?.nome ||
    user?.email ||
    undefined;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Assistente de IA
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          Converse com a Finance AI
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Extraia insights, registre recibos e monitore gastos sem sair do
          dashboard.
        </p>
      </div>
      <AgentChatPanel userName={userName} />
    </div>
  );
}

export const metadata = {
  title: "Agente - Finance AI",
  description: "Gerencie suas informações de agente",
};
