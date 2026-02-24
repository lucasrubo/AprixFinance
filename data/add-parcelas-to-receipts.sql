-- Migration: Adicionar campos de parcelamento e imagem ao receipts
-- Executar no Supabase SQL Editor

-- 1. Campos de parcelamento
ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS parcelas_total  INTEGER     NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parcelas_valor  DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS recibo_imagem_url TEXT;

-- Garantir que parcelas_total >= 1
ALTER TABLE public.receipts
  ADD CONSTRAINT parcelas_total_min CHECK (parcelas_total >= 1);

-- 2. Calcular parcelas_valor automaticamente quando não informado
-- (preenchimento retroativo: registros existentes ficam à vista)
UPDATE public.receipts
SET parcelas_valor = valor
WHERE parcelas_total = 1 AND parcelas_valor IS NULL;

-- 3. Supabase Storage bucket para imagens de recibos
-- Rodar apenas se o bucket ainda não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts-images',
  'receipts-images',
  false,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- 4. RLS policies para o bucket receipts-images
-- Usuário só acessa suas próprias imagens (path: {user_id}/*)
CREATE POLICY "Usuário lê suas imagens"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuário faz upload de suas imagens"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuário deleta suas imagens"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
