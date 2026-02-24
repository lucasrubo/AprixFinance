# AprixFinance — Memory / Contexto do Projeto

> Arquivo de referência persistente para desenvolvimento. Atualizar a cada mudança significativa de arquitetura, convenções ou decisões técnicas.

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui + Tailwind CSS 3.4 |
| Forms | React Hook Form + Zod |
| Charts | Recharts 3.7 |
| Auth + DB | Supabase (PostgreSQL + RLS) |
| Storage | Supabase Storage (bucket `receipts-images`) |
| IA | Cohere via AprixFinanceApi (backend externo) |
| PWA | next-pwa 5.6 (service worker ativo) |
| Deploy | Vercel (cron jobs via `vercel.json`) |
| Linter | Biome.js 1.9.4 (substituiu ESLint + Prettier) |
| E-mail | Resend SDK |
| Push | web-push (VAPID) |
| Lang | TypeScript 5.9 |

---

## Arquitetura

**Vertical Sliced Architecture** — cada feature é autossuficiente:
```
src/features/[nome]/
  actions/   → Server Actions (use server, terminam em Action)
  components/
  hooks/
  lib/
  types/
```
Código compartilhado → `src/shared/`. Rotas → `src/app/`.

---

## Banco de Dados — Tabelas Principais

| Tabela | Propósito |
|---|---|
| `users` | Perfil do usuário (nome, email, telefone, salario, tipo) |
| `receipts` | Lançamentos financeiros — agora com `parcelas_total`, `parcelas_valor`, `recibo_imagem_url`, `credit_card_id` |
| `fixed_expenses` | Gastos recorrentes (assinatura, servico, gasto_fixo) |
| `notifications` | Notificações in-app |
| `groups` / `group_members` | Grupos familiares/compartilhados |
| `sessions` / `conversation_history` | Chat com IA |
| `user_settings` | Preferências — agora com `push_notifications`, `push_subscription`, `email_notifications` |
| `categories` | Categorias de gastos (tabela existe, UI pendente) |
| `credit_cards` | Cartões de crédito (bandeira, últimos 4 dígitos, limite, dia_fechamento) |

### Migrations executadas (em `data/`)
- `add-parcelas-to-receipts.sql` — adiciona colunas de parcelamento e URL de imagem + bucket `receipts-images`
- `create-credit-cards-table.sql` — tabela `credit_cards` + FK `credit_card_id` em `receipts`
- `add-push-subscription.sql` — campos de notificação em `user_settings`

---

## Features Implementadas

| Feature | Diretório | Status |
|---|---|---|
| Autenticação | `features/auth/` | ✅ Completo |
| Recibos/Lançamentos | `features/receipts/` | ✅ Completo — parcelamentos + upload imagem |
| Gastos Fixos | `features/fixed-expenses/` | ✅ Completo |
| Dashboard | `features/dashboard/` | ✅ Completo — widget de cartões incluído |
| Notificações in-app | `features/notifications/` | ✅ Completo |
| Push Notifications | `features/notifications/` | ✅ Completo — hook + API route + cron |
| Email Notifications | `shared/lib/email.ts` | ✅ Completo — via Resend + cron diário |
| Cartões de Crédito | `features/credit-cards/` | ✅ Completo — CRUD + widget + seletor |
| Busca global | `features/search/` | ✅ Completo |
| Configurações | `features/settings/` | ✅ Completo — inclui toggles push/email |
| Admin | `features/admin/` | ✅ Completo |
| IA Chat | `features/agent/` | ✅ Funcional (requer AprixFinanceApi) |
| Categorias (UI) | `features/categories/` | 🔲 Tabela existe, UI não criada |

---

## Variáveis de Ambiente

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# IA (backend externo)
NEXT_PUBLIC_FINANCE_API_URL=http://localhost:4000

# E-mail (Resend — free tier 3k/mês)
RESEND_API_KEY=

# Web Push — gerar com: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Vercel Cron — qualquer string secreta
CRON_SECRET=

# WhatsApp (Twilio — a configurar futuramente)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
```

---

## API Routes

| Rota | Método | Função |
|---|---|---|
| `/api/dashboard/chart` | GET | Dados do gráfico (period: 30d/2m/1y) |
| `/api/admin/users` | GET/POST | Gestão de usuários (admin) |
| `/api/admin/groups` | GET/POST | Gestão de grupos (admin) |
| `/api/notifications/subscribe` | POST/DELETE | Salva/remove push subscription |
| `/api/cron/daily-check` | GET | Vercel Cron (08:00 BRT) — envia push + email |
| `/api/whatsapp/process` | POST | Webhook WhatsApp (placeholder) |

---

## Fluxo de Notificações Externas

1. Usuário acessa **Configurações** → `NotificationsSettings` component
2. Clica "Ativar" em Push → `usePushNotifications.subscribe()` → POST `/api/notifications/subscribe` → salva em `user_settings.push_subscription`
3. Clica "Ativar" em E-mail → `updateNotificationSettingsAction({ email_notifications: true })`
4. Cron diário (08:00 BRT, definido em `vercel.json`):
   - Busca `fixed_expenses` com vencimento hoje ou amanhã
   - Agrupa por usuário
   - Envia push via `web-push` (se `push_notifications = true`)
   - Cria notificação in-app
   - Envia e-mail via Resend (se `email_notifications = true`)

---

## Fluxo do Dashboard

1. `src/app/dashboard/page.tsx` (Server Component) busca em paralelo:
   - `getMonthlyStatsWithFixedExpenses` — estatísticas do mês
   - `getCreditCardStatsAction` — cartões + gasto mensal por cartão
2. Passa dados para `DashboardClient` → exibe widget de cartões, gráfico, transações

---

## Melhorias Planejadas (Backlog)

### Prioridade Alta
- [ ] UI de categorias (tabela já existe no banco)
- [ ] Orçamento mensal por categoria com alertas
- [ ] Fatura do cartão de crédito (agrupamento por ciclo de fechamento)

### Prioridade Média
- [ ] Exportação CSV/PDF do histórico
- [ ] Notificações WhatsApp via Twilio
- [ ] OCR do recibo (integração com IA para extrair valor/data da foto)

### Prioridade Baixa
- [ ] Metas financeiras (`goals` table)
- [ ] Modo escuro (toggle Tailwind dark:)
- [ ] Onboarding de novo usuário
- [ ] Filtros avançados no histórico (categoria, cartão, período)

---

## Convenções Importantes

- Server Actions: `"use server"` no topo, nomes terminam com `Action`
- Imports: paths absolutos `@/shared/...`, `@/features/...`
- Linter: `npx biome check --fix ./src` (configurado em `biome.json`)
- Currency: sempre usar `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Datas: armazenar como `DATE` no Supabase, exibir com `Intl.DateTimeFormat('pt-BR')`
- Componentes pesados (Recharts, etc.): usar `dynamic import` com `{ ssr: false }`

---

## Notas de Decisões Técnicas

- **Por que Supabase em vez de Prisma?** — Auth, realtime e storage integrados; reduz infraestrutura
- **Por que next-pwa?** — PWA permite instalação mobile e é base para push notifications
- **Por que vertical slices?** — Facilita evolução independente de features
- **`receipts` vs `fixed_expenses`?** — `receipts` = lançamento pontual (pode ser parcelado); `fixed_expenses` = recorrência automática por período
- **Por que Biome?** — Substitui ESLint + Prettier com uma única ferramenta mais rápida e menos configuração
- **Por que Resend?** — API simples, free tier de 3k e-mails/mês, não requer servidor SMTP próprio

---

*Última atualização: 2026-02-24*
