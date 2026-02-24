-- Migration: Adicionar push_subscription ao user_settings para Web Push API
-- Executar no Supabase SQL Editor

-- Verificar se a tabela user_settings existe; se não, criar
CREATE TABLE IF NOT EXISTS public.user_settings (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  budget                DECIMAL(10,2),
  alert_threshold       INTEGER     DEFAULT 80,
  currency              TEXT        DEFAULT 'BRL',
  whatsapp_notifications BOOLEAN    DEFAULT FALSE,
  email_notifications   BOOLEAN     DEFAULT TRUE,
  push_notifications    BOOLEAN     DEFAULT FALSE,
  push_subscription     JSONB,      -- Web Push API subscription object
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Se a tabela já existe, apenas adicionar as colunas novas
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS push_notifications  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS push_subscription   JSONB,
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;

-- RLS (caso a tabela seja nova)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_settings' AND policyname = 'Usuário vê suas configurações'
  ) THEN
    CREATE POLICY "Usuário vê suas configurações"
      ON public.user_settings FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Usuário atualiza suas configurações"
      ON public.user_settings FOR UPDATE
      USING (auth.uid() = user_id);

    CREATE POLICY "Usuário insere suas configurações"
      ON public.user_settings FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;
