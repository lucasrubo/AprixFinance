# Finance AI

Aplicação de finanças construída com Next.js, utilizando Arquitetura Vertical Sliced, Tailwind CSS e componentes shadcn/ui.

## 🚀 Projeto Atualizado - Novas Funcionalidades!

### **Fase 2 Completa** ✅ - Sistema Completo de Finanças

**Status**: Sistema completo com receipts, gastos fixos, notificações e busca global

### O que está funcionando:

- ✅ **Arquitetura Vertical Sliced** implementada
- ✅ **Next.js 14** com App Router e TypeScript
- ✅ **Tailwind CSS** + **shadcn/ui** components
- ✅ **Sistema de autenticação** completo
- ✅ **Dashboard principal** com cards e estatísticas
- ✅ **Sistema de receipts** (entradas e saídas)
- ✅ **Gastos fixos** (assinaturas, serviços, financiamentos)
- ✅ **Sistema de notificações** inteligente
- ✅ **Busca global** no header com resultados em tempo real
- ✅ **Modal de detalhes** para transações
- ✅ **Row Level Security** (RLS) configurado
- ✅ **Estrutura do banco** completa (schema SQL atualizado)

### 🆕 Novas Funcionalidades:

#### 📊 **Sistema de Receipts Aprimorado**

- Entradas e saídas com descrições detalhadas
- Busca por título, grupo e descrição
- Modal de detalhes completo
- **Rastreamento do criador**: Cada receipt mostra qual usuário o criou

#### 💳 **Gastos Fixos**

- **Assinaturas** (Netflix, academia, etc.)
- **Serviços** (seguro saúde, internet)
- **Financiamentos** com duração definida
- Controle de vencimentos e notificações
- **Rastreamento do criador**: Cada gasto fixo mostra qual usuário o criou

#### 🔔 **Sistema de Notificações**

- Notificações de novos receipts
- Lembretes de pagamentos próximos (3 dias antes)
- Avisos de sistema e lembretes personalizados
- Status de lido/não lido

#### 🔍 **Busca Global**

- Campo de busca no header de todas as páginas
- Resultados em tempo real
- Filtragem por título, grupo e descrição
- Clique para abrir modal de detalhes

#### 🤖 **WhatsApp Bot com IA**

- **Agente de Entrada**: IA extrai dados de mensagens de texto
- **Processamento de Recibos**: OCR em imagens de recibos via IA Vision
- **Confirmação Automática**: Pede confirmação antes de salvar
- **Integração Completa**: Insere diretamente na tabela receipts

#### ⚙️ **Configurações do Perfil**

- Atualização de nome e telefone
- **Campo de salário mensal** para melhor controle financeiro
- Validação de dados e feedback visual

### Próximos Passos:

1. **Configurar Supabase** (5 min)
2. **Executar script de migração** (`data/add-salary-column.sql`) se já tem banco criado
3. **Testar autenticação e CRUD**
4. ✅ **API de IA e WhatsApp** - Implementada!
5. **Adicionar gráficos e relatórios**

---

## 🛠️ Setup Rápido

### 1. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. No SQL Editor, execute o conteúdo de `schema-clean.sql`
4. **Opcional**: Execute `test-data.sql` para popular dados de teste
5. Copie as chaves do projeto

### 2. Configurar Environment

```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Configure suas chaves no .env.local
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica
NEXT_PUBLIC_FINANCE_API_URL=http://localhost:4000
```

### 3. Executar o projeto

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Abrir http://localhost:3000
```

### 4. Conectar o Assistente de IA

O chat inteligente consome o backend `AprixFinanceApi`. Rode-o em paralelo e aponte a URL via `NEXT_PUBLIC_FINANCE_API_URL`.

```bash
cd ../AprixFinanceApi
cp .env.example .env.local
npm install
# Execute em uma porta livre (ex: 4000)
PORT=4000 npm run dev
```

Com a API rodando, abra o dashboard em `/dashboard/agent` e converse com a IA — o token do Supabase é enviado automaticamente.

### 5. Configurar WhatsApp Bot (Opcional)

Para usar o bot do WhatsApp com IA:

1. **Configurar BigModel API**:
   - Acesse [bigmodel.cn](https://bigmodel.cn/)
   - Obtenha sua API Key
   - Configure no `.env` do backend

2. **Executar o Bot**:
   ```bash
   cd ../AprixFinanceApi
   npm install
   npm run dev
   ```

   - Escaneie o QR Code com WhatsApp
   - Envie mensagens como "Gastei 50 reais no almoço"

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes UI acessíveis
- **ESLint** - Linting de código

## Como Executar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Execute o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

3. Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria uma build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter

## Adicionando Componentes shadcn/ui

Para adicionar novos componentes shadcn:

```bash
npx shadcn@latest add [component-name]
```

Exemplo:

```bash
npx shadcn@latest add card
```

## Convenções de Código

- Imports absolutos com `@/` (configurado em `tsconfig.json`)
- Server Actions em `features/[feature]/actions/`
- Componentes específicos em `features/[feature]/components/`
- Código compartilhado em `src/shared/`

Consulte `ARCHITECTURE.md` para detalhes completos sobre a arquitetura.

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais:

#### `users` - Usuários

- `nome` - Nome completo do usuário
- `email` - Email único do usuário
- `telefone` - Telefone (opcional)
- `tipo` - Tipo de usuário ('user' ou 'admin')
- `salario` - Salário mensal (opcional, para controle financeiro)

#### `receipts` - Receitas e Despesas

- `titulo` - Nome da transação
- `valor` - Valor monetário
- `descricao` - Descrição detalhada
- `tipo` - 'entrada' ou 'saida'
- `data` - Data da transação
- `user_id` - Usuário proprietário
- `group_id` - Grupo (opcional)
- `created_by` - Usuário que criou o receipt (através de JOIN)

#### `fixed_expenses` - Gastos Fixos

- `titulo` - Nome do gasto
- `categoria` - 'gasto_fixo', 'assinatura', 'servico'
- `valor_parcela` - Valor da parcela
- `data_inicio` - Quando começou
- `data_pagamento` - Dia do mês para pagamento
- `duracao` - Meses (null = indefinido)
- `status` - 'ativo', 'cancelado', 'pausado'

#### `notifications` - Notificações

- `tipo` - 'receipt', 'fixed_expense', 'system', 'reminder'
- `titulo` - Título da notificação
- `mensagem` - Conteúdo da notificação
- `referencia_id` - ID do item relacionado
- `lida` - Status de leitura
- `data_expiracao` - Para notificações temporárias

### Funcionalidades Automáticas:

- **Notificações automáticas** para pagamentos próximos (3 dias antes)
- **Row Level Security** em todas as tabelas
- **Triggers** para updated_at em gastos fixos

---
