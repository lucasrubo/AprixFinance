-- Migração para adicionar título e garantir que status existe nas sessões
-- Este script deve ser executado no banco de dados Supabase

-- Adicionar coluna title se não existir
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS title TEXT;

-- Garantir que a coluna status existe (já deveria existir pelo schema principal)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Adicionar constraint de check se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sessions_status_check'
  ) THEN
    ALTER TABLE sessions ADD CONSTRAINT sessions_status_check CHECK (status IN ('active', 'inactive'));
  END IF;
END $$;

-- Atualizar sessões existentes que não têm status definido
UPDATE sessions 
SET status = 'active' 
WHERE status IS NULL;

-- Adicionar comentários nas colunas para documentação
COMMENT ON COLUMN sessions.title IS 'Título personalizado da sessão de conversa';
COMMENT ON COLUMN sessions.status IS 'Status da sessão: active (visível no histórico) ou inactive (oculta)';

-- Verificar se as políticas RLS estão aplicadas corretamente
-- Política para UPDATE (já deveria existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sessions' 
    AND policyname = 'Users can update their own sessions'
  ) THEN
    CREATE POLICY "Users can update their own sessions"
      ON sessions
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;