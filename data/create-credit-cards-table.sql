-- Migration: Criar tabela credit_cards e vincular ao receipts
-- Executar no Supabase SQL Editor

-- 1. Tabela de cartões de crédito
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nome             TEXT        NOT NULL,
  bandeira         TEXT        NOT NULL CHECK (bandeira IN ('visa', 'mastercard', 'elo', 'amex', 'hipercard', 'outro')),
  ultimos_4_digitos TEXT       NOT NULL CHECK (length(ultimos_4_digitos) = 4 AND ultimos_4_digitos ~ '^\d{4}$'),
  limite           DECIMAL(10,2),
  dia_fechamento   INTEGER     CHECK (dia_fechamento BETWEEN 1 AND 28),
  dia_vencimento   INTEGER     CHECK (dia_vencimento BETWEEN 1 AND 28),
  cor              TEXT        NOT NULL DEFAULT '#6366f1',
  ativo            BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RLS
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê seus cartões"
  ON public.credit_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário cria cartões"
  ON public.credit_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza cartões"
  ON public.credit_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário deleta cartões"
  ON public.credit_cards FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Vincular cartão ao receipts
ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS credit_card_id UUID
    REFERENCES public.credit_cards(id) ON DELETE SET NULL;

-- Índice para buscas por cartão
CREATE INDEX IF NOT EXISTS idx_receipts_credit_card_id
  ON public.receipts(credit_card_id)
  WHERE credit_card_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id
  ON public.credit_cards(user_id);
