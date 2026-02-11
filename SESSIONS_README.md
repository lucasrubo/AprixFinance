# Sistema de Sessões de Chat

Este documento explica o novo sistema de gerenciamento de sessões de chat implementado no Finance AI.

## Visão Geral

O sistema agora usa uma tabela dedicada `sessions` para organizar as conversas do usuário, proporcionando melhor controle e organização do histórico de chat.

## Estrutura do Banco de Dados

### Tabela `sessions`

- `id`: UUID primário
- `user_id`: Referência ao usuário (com RLS)
- `session_id`: Identificador único da sessão
- `title`: Título opcional da conversa
- `created_at`: Data de criação
- `updated_at`: Última atualização

### Tabela `conversation_history` (existente)

- Mantém todas as mensagens
- Agora referenciada pela `session_id`

## Funcionalidades

### 1. Criação de Sessões

- Sessões são criadas automaticamente quando a primeira mensagem é enviada
- Suporte a títulos personalizados para identificação rápida

### 2. Navegação entre Sessões

- Lista das últimas 5 sessões no painel lateral
- Clique para carregar qualquer sessão anterior
- Visualização clara com data, hora e preview

### 3. Gerenciamento de Sessões

- Botão de deletar sessão (com confirmação)
- Criação de novas sessões com botão "+"
- Sessão atual destacada visualmente

### 4. Persistência

- Todas as sessões são salvas no banco de dados
- RLS garante que usuários vejam apenas suas próprias sessões
- Histórico mantido mesmo após logout/login

## Arquivos Modificados

### Backend

- `src/features/agent/lib/chat-client.ts`: Funções para gerenciar sessões
- `data/create-sessions-table.sql`: Schema da nova tabela
- `data/migrate-sessions-from-history.sql`: Migração de dados existentes

### Frontend

- `src/features/agent/components/agent-chat-panel.tsx`: UI atualizada para sessões

## Como Usar

### Para Desenvolvedores

1. Execute o SQL `create-sessions-table.sql` no Supabase
2. Execute `migrate-sessions-from-history.sql` para migrar dados existentes
3. O sistema funcionará automaticamente

### Para Usuários Finais

- Conversas são organizadas automaticamente por sessões
- Use o botão "+" para iniciar uma nova conversa
- Clique em qualquer conversa do histórico para continuar
- Use o botão "🗑️" para deletar conversas antigas

## API Functions

### `loadConversationSessions()`

Carrega todas as sessões do usuário com suas mensagens.

### `createSession(sessionId, title?)`

Cria uma nova sessão no banco de dados.

### `updateSessionTitle(sessionId, title)`

Atualiza o título de uma sessão existente.

### `deleteSession(sessionId)`

Remove completamente uma sessão e todas suas mensagens.

### `saveMessageToHistory(message, sessionId?)`

Salva uma mensagem e garante que a sessão existe no banco.

## Benefícios

1. **Organização**: Conversas separadas por sessões claras
2. **Performance**: Consultas otimizadas com índices
3. **Segurança**: RLS protege dados de usuários
4. **Escalabilidade**: Estrutura preparada para crescimento
5. **UX**: Navegação intuitiva entre conversas

## Migração

Para projetos existentes:

1. Criar tabela `sessions`
2. Executar migração de dados
3. O código se adapta automaticamente

O sistema é retrocompatível e não quebra funcionalidades existentes.
