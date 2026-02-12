-- Script para adicionar categoria de pagamento (crédito/débito) na tabela receipts
-- Execute no Supabase SQL Editor
ALTER TABLE public.receipts
ADD COLUMN categoria_pagamento TEXT CHECK (
    categoria_pagamento IN ('credito', 'debito', 'dinheiro', 'pix')
) DEFAULT 'debito';

-- Comentar a nova coluna
COMMENT ON COLUMN public.receipts.categoria_pagamento IS 'Categoria de pagamento: credito, debito, dinheiro ou pix';

-- Atualizar receipts existentes para ter um valor padrão
UPDATE public.receipts
SET
    categoria_pagamento = 'debito'
WHERE
    categoria_pagamento IS NULL;