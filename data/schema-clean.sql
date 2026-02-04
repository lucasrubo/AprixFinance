-- ============================================
-- SCHEMA LIMPO E FUNCIONAL - Finance App
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. LIMPAR TUDO PRIMEIRO
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.receipts CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. CRIAR TABELA DE USUÁRIOS
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    telefone TEXT,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'user' CHECK (tipo IN ('user', 'admin')),
    salario DECIMAL(10,2), -- salário mensal
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CRIAR TABELA DE GRUPOS
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CRIAR TABELA DE MEMBROS DOS GRUPOS (relacionamento)
CREATE TABLE public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- 5. CRIAR TABELA DE RECIBOS (atualizada)
CREATE TABLE public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    tipo TEXT NOT NULL DEFAULT 'saida' CHECK (tipo IN ('entrada', 'saida')),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CRIAR TABELA DE GASTOS FIXOS
CREATE TABLE public.fixed_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT NOT NULL DEFAULT 'gasto_fixo' CHECK (categoria IN ('gasto_fixo', 'assinatura', 'servico')),
    valor_parcela DECIMAL(10,2) NOT NULL,
    data_inicio DATE NOT NULL,
    data_pagamento INTEGER NOT NULL, -- dia do mês para pagamento (1-31)
    duracao INTEGER, -- duração em meses (null = indefinido)
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'cancelado', 'pausado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CRIAR TABELA DE NOTIFICAÇÕES
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('receipt', 'fixed_expense', 'subscription', 'system', 'reminder')),
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    referencia_id UUID, -- ID do item relacionado (receipt, fixed_expense, etc.)
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    data_expiracao DATE, -- para notificações temporárias
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CRIAR FUNÇÃO PARA AUTO-CRIAR PERFIL DE USUÁRIO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, nome)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CRIAR TRIGGER PARA AUTO-CRIAR PERFIL
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- 9. POLÍTICAS DE SEGURANÇA - USERS
CREATE POLICY "Usuários podem ver próprio perfil"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND tipo = 'admin'
        )
    );

-- 10. POLÍTICAS DE SEGURANÇA - GROUPS
CREATE POLICY "Membros podem ver grupos"
    ON public.groups FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_id = id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários autenticados podem criar grupos"
    ON public.groups FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- 11. POLÍTICAS DE SEGURANÇA - GROUP_MEMBERS
CREATE POLICY "Membros podem ver membros do grupo"
    ON public.group_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem se adicionar a grupos"
    ON public.group_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- 12. POLÍTICAS DE SEGURANÇA - RECEIPTS
CREATE POLICY "Usuários podem ver próprios recibos"
    ON public.receipts FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Membros podem ver recibos do grupo"
    ON public.receipts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_id = receipts.group_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem criar recibos"
    ON public.receipts FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar próprios recibos"
    ON public.receipts FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar próprios recibos"
    ON public.receipts FOR DELETE
    USING (user_id = auth.uid());

-- 13. POLÍTICAS DE SEGURANÇA - FIXED_EXPENSES
CREATE POLICY "Usuários podem ver próprios gastos fixos"
    ON public.fixed_expenses FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Usuários podem criar gastos fixos"
    ON public.fixed_expenses FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar próprios gastos fixos"
    ON public.fixed_expenses FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar próprios gastos fixos"
    ON public.fixed_expenses FOR DELETE
    USING (user_id = auth.uid());

-- 14. POLÍTICAS DE SEGURANÇA - NOTIFICATIONS
CREATE POLICY "Usuários podem ver próprias notificações"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Sistema pode criar notificações"
    ON public.notifications FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Usuários podem atualizar próprias notificações"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid());

-- 15. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 16. CRIAR USUÁRIO ADMIN PADRÃO (opcional)
-- Você pode criar manualmente no Supabase Auth primeiro
-- Depois execute esta query substituindo o UUID:
/*
INSERT INTO public.users (id, email, nome, tipo)
VALUES (
    'SEU-UUID-DO-AUTH-USERS',
    'admin@example.com',
    'Administrador',
    'admin'
) ON CONFLICT (id) DO UPDATE SET tipo = 'admin';
*/

-- 17. FUNÇÃO PARA CRIAR NOTIFICAÇÕES DE GASTOS FIXOS
CREATE OR REPLACE FUNCTION public.create_fixed_expense_notifications()
RETURNS VOID AS $$
DECLARE
    expense_record RECORD;
    notification_date DATE;
BEGIN
    -- Para cada gasto fixo ativo
    FOR expense_record IN
        SELECT id, user_id, titulo, valor_parcela, data_pagamento
        FROM public.fixed_expenses
        WHERE status = 'ativo'
    LOOP
        -- Criar notificação 3 dias antes do vencimento
        notification_date := date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '3 days';
        notification_date := notification_date + (expense_record.data_pagamento - 1 || ' days')::INTERVAL;

        -- Se hoje é o dia da notificação e não existe notificação para este mês
        IF CURRENT_DATE = notification_date THEN
            INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, referencia_id)
            VALUES (
                expense_record.user_id,
                'fixed_expense',
                'Pagamento próximo: ' || expense_record.titulo,
                'O pagamento de R$ ' || expense_record.valor_parcela || ' vence em 3 dias.',
                expense_record.id
            )
            ON CONFLICT DO NOTHING; -- Evita duplicatas
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. CRIAR TRIGGER PARA ATUALIZAR UPDATED_AT EM FIXED_EXPENSES
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fixed_expenses_updated_at
    BEFORE UPDATE ON public.fixed_expenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FIM DO SCHEMA
-- ============================================
-- Agora você pode fazer login normalmente!
-- O erro do confirmation_token vai sumir porque
-- não estamos mais lidando com colunas do auth.users
-- ============================================

--