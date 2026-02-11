-- Adicionar coluna session_id à tabela conversation_history
ALTER TABLE conversation_history ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Atualizar registros existentes com session_id padrão
UPDATE conversation_history
SET session_id = 'legacy_session_' || user_id || '_' || EXTRACT(epoch FROM created_at)::text
WHERE session_id IS NULL;

-- Adicionar índice para session_id
CREATE INDEX IF NOT EXISTS idx_conversation_session_id ON conversation_history(session_id);

-- Adicionar comentário na coluna
COMMENT ON COLUMN conversation_history.session_id IS 'Identificador único da sessão de conversa';