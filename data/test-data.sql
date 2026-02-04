-- ============================================
-- DADOS DE TESTE - Finance App
-- ============================================
-- Execute este SQL após o schema principal
-- ============================================

-- 1. INSERIR DADOS DE TESTE PARA RECEIPTS
INSERT INTO public.receipts (user_id, titulo, valor, descricao, tipo, data) VALUES
('USER-UUID-AQUI', 'Salário Janeiro', 3500.00, 'Salário mensal da empresa XYZ', 'entrada', '2024-01-01'),
('USER-UUID-AQUI', 'Aluguel', 1200.00, 'Aluguel do apartamento', 'saida', '2024-01-02'),
('USER-UUID-AQUI', 'Supermercado', 450.50, 'Compras semanais no Extra', 'saida', '2024-01-03'),
('USER-UUID-AQUI', 'Freelance Design', 800.00, 'Projeto de logo para cliente Y', 'entrada', '2024-01-05'),
('USER-UUID-AQUI', 'Conta de Luz', 180.00, 'Consumo residencial janeiro', 'saida', '2024-01-10');

-- 2. INSERIR DADOS DE TESTE PARA GASTOS FIXOS
INSERT INTO public.fixed_expenses (user_id, titulo, descricao, categoria, valor_parcela, data_inicio, data_pagamento, duracao, status) VALUES
('USER-UUID-AQUI', 'Netflix', 'Assinatura mensal de streaming', 'assinatura', 39.90, '2024-01-01', 15, NULL, 'ativo'),
('USER-UUID-AQUI', 'Academia', 'Plano mensal de musculação', 'assinatura', 89.90, '2024-01-01', 10, NULL, 'ativo'),
('USER-UUID-AQUI', 'Seguro Saúde', 'Plano de saúde familiar', 'servico', 450.00, '2024-01-01', 5, 12, 'ativo'),
('USER-UUID-AQUI', 'Financiamento Carro', 'Parcela do veículo', 'gasto_fixo', 850.00, '2024-01-01', 20, 48, 'ativo'),
('USER-UUID-AQUI', 'Curso Inglês', 'Aulas particulares de inglês', 'assinatura', 120.00, '2024-01-01', 25, 12, 'pausado');

-- 3. INSERIR DADOS DE TESTE PARA NOTIFICAÇÕES
INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, referencia_id, lida) VALUES
('USER-UUID-AQUI', 'receipt', 'Novo recebimento', 'Você recebeu R$ 3.500,00 de Salário Janeiro', (SELECT id FROM public.receipts WHERE titulo = 'Salário Janeiro' LIMIT 1), false),
('USER-UUID-AQUI', 'fixed_expense', 'Pagamento próximo', 'O pagamento de R$ 39,90 da Netflix vence em 3 dias.', (SELECT id FROM public.fixed_expenses WHERE titulo = 'Netflix' LIMIT 1), false),
('USER-UUID-AQUI', 'system', 'Bem-vindo!', 'Bem-vindo ao Finance App! Comece adicionando seus primeiros gastos.', NULL, false),
('USER-UUID-AQUI', 'reminder', 'Lembrete', 'Não esqueça de revisar seus gastos fixos mensais.', NULL, true);

-- ============================================
-- QUERIES ÚTEIS PARA CONSULTA
-- ============================================

-- Ver todos os recibos de um usuário
SELECT r.*, g.nome as grupo_nome
FROM public.receipts r
LEFT JOIN public.groups g ON r.group_id = g.id
WHERE r.user_id = 'USER-UUID-AQUI'
ORDER BY r.data DESC;

-- Ver gastos fixos ativos
SELECT *
FROM public.fixed_expenses
WHERE user_id = 'USER-UUID-AQUI' AND status = 'ativo'
ORDER BY data_pagamento ASC;

-- Ver notificações não lidas
SELECT *
FROM public.notifications
WHERE user_id = 'USER-UUID-AQUI' AND lida = false
ORDER BY created_at DESC;

-- Calcular total de entradas e saídas do mês atual
SELECT
    SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as total_entradas,
    SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as total_saidas,
    SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END) as saldo
FROM public.receipts
WHERE user_id = 'USER-UUID-AQUI'
    AND DATE_TRUNC('month', data) = DATE_TRUNC('month', CURRENT_DATE);

-- Próximos pagamentos de gastos fixos (próximos 30 dias)
SELECT *,
    CASE
        WHEN data_pagamento >= EXTRACT(day FROM CURRENT_DATE)
        THEN DATE_TRUNC('month', CURRENT_DATE) + (data_pagamento - 1 || ' days')::INTERVAL
        ELSE DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + (data_pagamento - 1 || ' days')::INTERVAL
    END as proxima_data_pagamento
FROM public.fixed_expenses
WHERE user_id = 'USER-UUID-AQUI' AND status = 'ativo'
ORDER BY data_pagamento ASC;

-- ============================================
-- FIM DOS DADOS DE TESTE
-- ============================================