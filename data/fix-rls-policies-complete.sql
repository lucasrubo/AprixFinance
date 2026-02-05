-- ============================================
-- CORREÇÃO COMPLETA DAS POLÍTICAS RLS
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================
-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES PRIMEIRO
DROP POLICY IF EXISTS "Membros podem ver membros do grupo" ON public.group_members;

DROP POLICY IF EXISTS "Membros podem ver grupos" ON public.groups;

DROP POLICY IF EXISTS "Usuários podem ver grupos públicos" ON public.groups;

DROP POLICY IF EXISTS "Usuários autenticados podem criar grupos" ON public.groups;

DROP POLICY IF EXISTS "users_can_view_own_memberships" ON public.group_members;

DROP POLICY IF EXISTS "users_can_join_groups" ON public.group_members;

DROP POLICY IF EXISTS "users_can_leave_groups" ON public.group_members;

DROP POLICY IF EXISTS "users_can_view_groups" ON public.groups;

DROP POLICY IF EXISTS "authenticated_users_can_create_groups" ON public.groups;

DROP POLICY IF EXISTS "users_can_view_own_or_group_receipts" ON public.receipts;

DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON public.users;

DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.users;

DROP POLICY IF EXISTS "Admins podem ver todos" ON public.users;

DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.users;

DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.users;

DROP POLICY IF EXISTS "users_view_own_profile" ON public.users;

DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;

DROP POLICY IF EXISTS "users_view_own_group_receipts" ON public.receipts;

DROP POLICY IF EXISTS "users_view_own_fixed_expenses" ON public.fixed_expenses;

DROP POLICY IF EXISTS "users_create_fixed_expenses" ON public.fixed_expenses;

DROP POLICY IF EXISTS "users_update_own_fixed_expenses" ON public.fixed_expenses;

DROP POLICY IF EXISTS "users_delete_own_fixed_expenses" ON public.fixed_expenses;

DROP POLICY IF EXISTS "users_view_own_notifications" ON public.notifications;

DROP POLICY IF EXISTS "system_create_notifications" ON public.notifications;

DROP POLICY IF EXISTS "users_update_own_notifications" ON public.notifications;

DROP POLICY IF EXISTS "users_view_own_memberships" ON public.group_members;

DROP POLICY IF EXISTS "users_join_groups" ON public.group_members;

DROP POLICY IF EXISTS "users_leave_groups" ON public.group_members;

DROP POLICY IF EXISTS "users_view_groups" ON public.groups;

DROP POLICY IF EXISTS "users_create_groups" ON public.groups;

DROP POLICY IF EXISTS "users_view_own_group_receipts" ON public.receipts;

DROP POLICY IF EXISTS "users_view_groups" ON public.group_members;

-- Remover políticas do schema original
DROP POLICY IF EXISTS "Usuários podem ver próprios recibos" ON public.receipts;

DROP POLICY IF EXISTS "Membros podem ver recibos do grupo" ON public.receipts;

DROP POLICY IF EXISTS "Usuários podem criar recibos" ON public.receipts;

DROP POLICY IF EXISTS "Usuários podem atualizar próprios recibos" ON public.receipts;

DROP POLICY IF EXISTS "Usuários podem deletar próprios recibos" ON public.receipts;

DROP POLICY IF EXISTS "Usuários podem ver próprios gastos fixos" ON public.fixed_expenses;

DROP POLICY IF EXISTS "Usuários podem criar gastos fixos" ON public.fixed_expenses;

DROP POLICY IF EXISTS "Usuários podem atualizar próprios gastos fixos" ON public.fixed_expenses;

DROP POLICY IF EXISTS "Usuários podem deletar próprios gastos fixos" ON public.fixed_expenses;

DROP POLICY IF EXISTS "Usuários podem ver próprias notificações" ON public.notifications;

DROP POLICY IF EXISTS "Sistema pode criar notificações" ON public.notifications;

DROP POLICY IF EXISTS "Usuários podem atualizar próprias notificações" ON public.notifications;

DROP POLICY IF EXISTS "Usuários podem se adicionar a grupos" ON public.group_members;

-- Remover políticas criadas anteriormente por este mesmo script
DROP POLICY IF EXISTS "users_view_profiles" ON public.users;

DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;

DROP POLICY IF EXISTS "users_view_receipts" ON public.receipts;

DROP POLICY IF EXISTS "users_create_receipts" ON public.receipts;

DROP POLICY IF EXISTS "users_update_receipts" ON public.receipts;

DROP POLICY IF EXISTS "users_delete_receipts" ON public.receipts;

DROP POLICY IF EXISTS "users_view_memberships" ON public.group_members;

DROP POLICY IF EXISTS "users_join_groups" ON public.group_members;

DROP POLICY IF EXISTS "users_leave_groups" ON public.group_members;

DROP POLICY IF EXISTS "users_view_fixed_expenses" ON public.fixed_expenses;

DROP POLICY IF EXISTS "users_create_fixed_expenses" ON public.fixed_expenses;

DROP POLICY IF EXISTS "users_update_fixed_expenses" ON public.fixed_expenses;

DROP POLICY IF EXISTS "users_delete_fixed_expenses" ON public.fixed_expenses;

DROP POLICY IF EXISTS "users_view_notifications" ON public.notifications;

DROP POLICY IF EXISTS "system_create_notifications" ON public.notifications;

DROP POLICY IF EXISTS "users_update_notifications" ON public.notifications;

DROP POLICY IF EXISTS "users_delete_notifications" ON public.notifications;

DROP POLICY IF EXISTS "users_view_groups" ON public.groups;

DROP POLICY IF EXISTS "users_create_groups" ON public.groups;

DROP POLICY IF EXISTS "users_update_groups" ON public.groups;

DROP POLICY IF EXISTS "users_delete_groups" ON public.groups;

-- 2. GARANTIR QUE RLS ESTEJA HABILITADO EM TODAS AS TABELAS
-- TEMPORARIAMENTE DESABILITAR RLS EM USERS PARA EVITAR RECURSÃO
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. PULAR POLÍTICAS PARA USERS TEMPORARIAMENTE
-- CREATE POLICY "users_view_profiles" ON public.users FOR
-- SELECT
--   USING (true);
-- CREATE POLICY "users_update_own_profile" ON public.users FOR
-- UPDATE USING (auth.uid () = id);
-- 4. POLÍTICAS PARA GROUPS
CREATE POLICY "users_view_groups" ON public.groups FOR
SELECT
  USING (true);

-- Permitir ver todos os grupos por enquanto
CREATE POLICY "users_create_groups" ON public.groups FOR INSERT
WITH
  CHECK (auth.uid () IS NOT NULL);

CREATE POLICY "users_update_groups" ON public.groups FOR
UPDATE USING (auth.uid () IS NOT NULL);

CREATE POLICY "users_delete_groups" ON public.groups FOR DELETE USING (auth.uid () IS NOT NULL);

-- 5. POLÍTICAS PARA GROUP_MEMBERS
CREATE POLICY "users_view_memberships" ON public.group_members FOR
SELECT
  USING (true);

CREATE POLICY "users_join_groups" ON public.group_members FOR INSERT
WITH
  CHECK (true);

CREATE POLICY "users_leave_groups" ON public.group_members FOR DELETE USING (user_id = auth.uid ());

-- 6. POLÍTICAS PARA RECEIPTS - COMPLETAS
CREATE POLICY "users_view_receipts" ON public.receipts FOR
SELECT
  USING (
    user_id = auth.uid ()
    OR group_id IN (
      SELECT
        group_id
      FROM
        public.group_members
      WHERE
        user_id = auth.uid ()
    )
  );

CREATE POLICY "users_create_receipts" ON public.receipts FOR INSERT
WITH
  CHECK (user_id = auth.uid ());

CREATE POLICY "users_update_receipts" ON public.receipts FOR
UPDATE USING (user_id = auth.uid ());

CREATE POLICY "users_delete_receipts" ON public.receipts FOR DELETE USING (user_id = auth.uid ());

-- 7. POLÍTICAS PARA FIXED_EXPENSES - COMPLETAS
CREATE POLICY "users_view_fixed_expenses" ON public.fixed_expenses FOR
SELECT
  USING (user_id = auth.uid ());

CREATE POLICY "users_create_fixed_expenses" ON public.fixed_expenses FOR INSERT
WITH
  CHECK (user_id = auth.uid ());

CREATE POLICY "users_update_fixed_expenses" ON public.fixed_expenses FOR
UPDATE USING (user_id = auth.uid ());

CREATE POLICY "users_delete_fixed_expenses" ON public.fixed_expenses FOR DELETE USING (user_id = auth.uid ());

-- 8. POLÍTICAS PARA NOTIFICATIONS - COMPLETAS
CREATE POLICY "users_view_notifications" ON public.notifications FOR
SELECT
  USING (user_id = auth.uid ());

CREATE POLICY "system_create_notifications" ON public.notifications FOR INSERT
WITH
  CHECK (TRUE);

CREATE POLICY "users_update_notifications" ON public.notifications FOR
UPDATE USING (user_id = auth.uid ());

CREATE POLICY "users_delete_notifications" ON public.notifications FOR DELETE USING (user_id = auth.uid ());

-- 9. GARANTIR PERMISSÕES
GRANT USAGE ON SCHEMA public TO anon,
authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- FIM DA CORREÇÃO COMPLETA
-- ============================================