-- Criar tabela sessions para organizar conversas
CREATE TABLE
  IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    session_id TEXT NOT NULL UNIQUE,
    title TEXT, -- título opcional da conversa
    created_at TIMESTAMPTZ DEFAULT NOW (),
    updated_at TIMESTAMPTZ DEFAULT NOW ()
  );

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions (session_id);

CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions (created_at DESC);

-- Adicionar RLS (Row Level Security)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias sessões
CREATE POLICY "Users can view own sessions" ON public.sessions FOR
SELECT
  USING (auth.uid () = user_id);

CREATE POLICY "Users can insert own sessions" ON public.sessions FOR INSERT
WITH
  CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update own sessions" ON public.sessions FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete own sessions" ON public.sessions FOR DELETE USING (auth.uid () = user_id);

-- Adicionar comentários
COMMENT ON TABLE public.sessions IS 'Tabela para organizar sessões de conversa do chat';

COMMENT ON COLUMN public.sessions.session_id IS 'Identificador único da sessão (mesmo usado na conversation_history)';

COMMENT ON COLUMN public.sessions.title IS 'Título opcional da conversa para identificação rápida';