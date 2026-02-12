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
      <AgentChatPanel userName={userName} />
    </div>
  );
}

export const metadata = {
  title: "Agente - Finance AI",
  description: "Gerencie suas informações de agente",
};
