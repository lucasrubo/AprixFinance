# Finance AI - Plano de Desenvolvimento

## Visão Geral do Projeto

Sistema de gestão financeira inteligente que permite:

- Envio de fotos de notas fiscais via WhatsApp
- Interpretação automática via IA
- Análise financeira inteligente
- Respostas a perguntas como "posso sair hoje?" ou "posso viajar esse mês?"

## Stack Tecnológica

### Frontend (Next.js - Vercel)

- **Framework**: Next.js 14 com App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **Database Client**: Supabase JavaScript SDK
- **Deploy**: Vercel

### Backend (API Routes - Vercel FREE)

- **Runtime**: Next.js API Routes (TypeScript)
- **WhatsApp**: wwebjs.dev (self-hosted, gratuito)
- **IA**: Tesseract.js (OCR gratuito) + Ollama (IA local gratuita)
- **Database**: Supabase Free Tier
- **Deploy**: Vercel Hobby (gratuito)

### Database (Supabase)

- **PostgreSQL** com Real-time subscriptions
- **Storage** para imagens de notas fiscais
- **Auth** para usuários

## Arquitetura do Sistema

```
WhatsApp → wwebjs → API Route → BigModel IA → Supabase
    ↓                                           ↓
Frontend ← Next.js ← Supabase Client ← Database
```

## Features Principais

### 1. Gestão de Notas Fiscais

- Upload via WhatsApp (foto)
- Upload via frontend (drag & drop)
- OCR + IA para extrair dados
- Categorização automática
- Validação e correção manual

### 2. Dashboard Financeiro

- Resumo mensal/anual
- Gráficos de gastos por categoria
- Projeções de sobra
- Alertas de gastos excessivos

### 3. IA Assistente

- **Resumos**: "Como foi meu mês?"
- **Sobras**: "Quanto sobrou em Janeiro?"
- **Decisões**: "Posso sair hoje?" / "Posso viajar esse mês?"
- **Análises**: Padrões de consumo, sugestões de economia

### 4. WhatsApp Integration

- Bot responsivo
- Comandos de texto simples
- Upload de imagens
- Notificações automáticas

## Estrutura do Banco de Dados

### Tabelas Principais

```sql
-- Usuários
users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  name text,
  whatsapp_number text,
  created_at timestamp
)

-- Notas Fiscais
receipts (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  image_url text,
  total_amount decimal,
  date date,
  merchant_name text,
  category_id uuid,
  items jsonb,
  raw_text text,
  status text, -- 'pending', 'processed', 'validated'
  created_at timestamp
)

-- Categorias
categories (
  id uuid PRIMARY KEY,
  name text,
  color text,
  icon text,
  user_id uuid REFERENCES users(id)
)

-- Conversas IA
ai_conversations (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  question text,
  response text,
  context jsonb,
  created_at timestamp
)

-- Configurações do usuário
user_settings (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  monthly_budget decimal,
  alert_threshold decimal,
  preferred_currency text,
  whatsapp_notifications boolean
)
```

## Fases de Desenvolvimento

### Fase 1: Frontend Base + Supabase 🚀

**Objetivo**: Dashboard funcional com CRUD de notas fiscais

**Features**:

- [ ] Setup Supabase (database + auth)
- [ ] Sistema de autenticação
- [ ] Dashboard principal
- [ ] Upload de imagens
- [ ] CRUD de notas fiscais
- [ ] Listagem e categorização
- [ ] Gráficos básicos

**Estrutura de Features**:

```
src/features/
├── auth/
│   ├── components/ (LoginForm, SignupForm)
│   ├── actions/ (auth-actions.ts)
│   └── hooks/ (useAuth.ts)
├── receipts/
│   ├── components/ (ReceiptCard, ReceiptForm, ReceiptList)
│   ├── actions/ (receipt-actions.ts)
│   ├── hooks/ (useReceipts.ts)
│   └── lib/ (receipt-utils.ts)
├── dashboard/
│   ├── components/ (DashboardStats, ExpenseChart)
│   ├── hooks/ (useDashboardData.ts)
│   └── lib/ (chart-utils.ts)
└── categories/
    ├── components/ (CategorySelector, CategoryForm)
    ├── actions/ (category-actions.ts)
    └── hooks/ (useCategories.ts)
```

### Fase 2: API de IA + WhatsApp 🤖

**Objetivo**: Integração com IA e WhatsApp

**Features**:

- [ ] API Routes para WhatsApp webhook
- [ ] Integração BigModel IA
- [ ] OCR de notas fiscais
- [ ] Chat bot básico
- [ ] Comandos via WhatsApp

**API Structure**:

```
src/app/api/
├── webhook/whatsapp/route.ts
├── ai/
│   ├── analyze-receipt/route.ts
│   ├── chat/route.ts
│   └── financial-advice/route.ts
└── receipts/
    ├── upload/route.ts
    └── process/route.ts
```

### Fase 3: IA Avançada + Features Premium 🧠

**Objetivo**: Assistente financeiro inteligente

**Features**:

- [ ] Análises preditivas
- [ ] Sugestões personalizadas
- [ ] Alertas inteligentes
- [ ] Relatórios automáticos
- [ ] Integração com bancos (Open Banking)

### Fase 4: Otimizações + Deploy 🚀

**Objetivo**: Produção e otimização

**Features**:

- [ ] Performance optimization
- [ ] Monitoring e logs
- [ ] Backup automático
- [ ] Documentação API
- [ ] Testes automatizados

## Configurações de Deploy

### Vercel (Frontend + API)

```json
{
  "functions": {
    "src/app/api/**": {
      "runtime": "nodejs18.x",
      "maxDuration": 30
    }
  },
  "env": {
    "SUPABASE_URL": "@supabase-url",
    "SUPABASE_ANON_KEY": "@supabase-anon-key",
    "BIGMODEL_API_KEY": "@bigmodel-api-key",
    "WHATSAPP_WEBHOOK_SECRET": "@whatsapp-secret"
  }
}
```

### Supabase

- **Region**: São Paulo (sa-east-1)
- **Tier**: Pro (para maior storage e compute)
- **Extensions**: pg_vector (para IA), postgis (localização)

## Estimativa de Custos (Mensal) - 100% GRATUITO! 🎉

### **Tier Gratuito Otimizado para Casais**

- **Vercel Hobby**: $0/mês (Deploy ilimitado)
- **Supabase Free**: $0/mês (500MB database, 50MB file storage)
- **IA Alternativa GRATUITA**: OpenAI Free Tier ou Ollama Local
- **WhatsApp**: wwebjs (gratuito, self-hosted)
- **Total**: **$0/mês** 💰

### **Limites dos Planos Gratuitos (mais que suficiente para casal)**

- **Supabase Free**: 500MB DB + 1GB bandwidth + 50K auth users
- **Vercel Hobby**: 100GB bandwidth + Serverless functions
- **OpenAI Free**: $5 de crédito inicial (dura meses para OCR básico)
- **Alternativa Local**: Ollama (100% gratuito, roda no seu PC)

### **Estratégia para Manter Gratuito**

1. **Database**: Supabase Free (500MB = ~50.000 notas fiscais)
2. **IA**:
   - Fase 1: OCR simples com Tesseract.js (gratuito)
   - Fase 2: OpenAI free tier para análises básicas
   - Fase 3: Ollama local para total independência
3. **WhatsApp**: Self-hosted com wwebjs
4. **Deploy**: Vercel Hobby (gratuito para sempre)

## Próximos Passos

1. **Agora**: Setup Supabase + Frontend base
2. **Semana 1**: Dashboard e CRUD completo
3. **Semana 2**: Integração WhatsApp + IA básica
4. **Semana 3**: Features avançadas de IA
5. **Semana 4**: Deploy e otimizações

## Comandos WhatsApp Planejados

- `!saldo` - Saldo atual do mês
- `!resumo` - Resumo financeiro
- `!categoria alimentação` - Gastos por categoria
- `!posso sair` - Análise se pode gastar hoje
- `!posso viajar` - Análise para viagem
- `!foto [imagem]` - Upload de nota fiscal
- `!ajuda` - Lista de comandos

---

**Status**: 🚀 Iniciando Fase 1 - Frontend + Supabase
