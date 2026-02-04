-- ============================================
-- CORREÇÃO DAS POLÍTICAS RLS - SEM RECURSÃO
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

-- 2. CRIAR POLÍTICAS SIMPLES PARA USERS (SEM RECURSÃO)
CREATE POLICY "users_view_own_profile" ON public.users FOR
SELECT
  USING (auth.uid () = id);

CREATE POLICY "users_update_own_profile" ON public.users FOR
UPDATE USING (auth.uid () = id);

-- 3. CRIAR POLÍTICAS SIMPLES PARA GROUP_MEMBERS
CREATE POLICY "users_view_own_memberships" ON public.group_members FOR
SELECT
  USING (user_id = auth.uid ());

CREATE POLICY "users_join_groups" ON public.group_members FOR INSERT
WITH
  CHECK (user_id = auth.uid ());

CREATE POLICY "users_leave_groups" ON public.group_members FOR DELETE USING (user_id = auth.uid ());

-- 4. CRIAR POLÍTICAS SIMPLES PARA GROUPS
CREATE POLICY "users_view_groups" ON public.groups FOR
SELECT
  USING (true);

-- Permitir ver todos os grupos por enquanto
CREATE POLICY "users_create_groups" ON public.groups FOR INSERT
WITH
  CHECK (auth.uid () IS NOT NULL);

-- 5. SIMPLIFICAR POLÍTICAS DE RECEIPTS
CREATE POLICY "users_view_own_group_receipts" ON public.receipts FOR
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

-- 6. POLÍTICAS PARA FIXED_EXPENSES
CREATE POLICY "users_view_own_fixed_expenses" ON public.fixed_expenses FOR
SELECT
  USING (user_id = auth.uid ());

CREATE POLICY "users_create_fixed_expenses" ON public.fixed_expenses FOR INSERT
WITH
  CHECK (user_id = auth.uid ());

CREATE POLICY "users_update_own_fixed_expenses" ON public.fixed_expenses FOR
UPDATE USING (user_id = auth.uid ());

CREATE POLICY "users_delete_own_fixed_expenses" ON public.fixed_expenses FOR DELETE USING (user_id = auth.uid ());

-- 7. POLÍTICAS PARA NOTIFICATIONS
CREATE POLICY "users_view_own_notifications" ON public.notifications FOR
SELECT
  USING (user_id = auth.uid ());

CREATE POLICY "system_create_notifications" ON public.notifications FOR INSERT
WITH
  CHECK (TRUE);

CREATE POLICY "users_update_own_notifications" ON public.notifications FOR
UPDATE USING (user_id = auth.uid ());

-- ============================================
-- FIM DA CORREÇÃO
-- ============================================