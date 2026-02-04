# Estrutura do Projeto - Arquitetura Vertical Sliced

## Visão Geral

Este projeto utiliza **Arquitetura Vertical Sliced** (também conhecida como Feature-Based Architecture ou Feature Slices). Esta abordagem organiza o código por funcionalidades de negócio ao invés de por camadas técnicas, promovendo alta coesão dentro de cada feature e baixo acoplamento entre features.

## Princípios Fundamentais

### 1. Organização por Features
Cada funcionalidade de negócio deve ser agrupada em sua própria pasta, contendo todos os elementos necessários para sua implementação (componentes, lógica, tipos, utilitários, etc.).

### 2. Alta Coesão
Todos os arquivos relacionados a uma mesma funcionalidade devem estar próximos, facilitando a localização e manutenção do código.

### 3. Baixo Acoplamento
Features devem depender principalmente de código compartilhado (`shared`) e evitar dependências diretas entre si, reduzindo o impacto de mudanças.

### 4. Autonomia
Cada feature deve ser capaz de evoluir independentemente, permitindo que diferentes desenvolvedores trabalhem em features diferentes sem conflitos frequentes.

## Estrutura de Diretórios

```
src/
├── app/                    # Rotas da aplicação (Next.js App Router)
├── features/               # Features do negócio (organização vertical)
│   └── [feature-name]/
│       ├── actions/        # Server Actions
│       ├── components/     # Componentes específicos da feature
│       ├── hooks/          # Hooks personalizados
│       ├── lib/            # Utilitários e helpers específicos
│       └── types/          # Tipos TypeScript específicos (opcional)
└── shared/                 # Código compartilhado entre features
    ├── components/         # Componentes reutilizáveis
    ├── hooks/              # Hooks reutilizáveis
    ├── lib/                # Utilitários gerais
    ├── types/              # Tipos compartilhados
    └── data/               # Dados mockados e constantes
```

## Regras de Organização

### Features

#### Quando criar uma nova feature?
- Quando há uma funcionalidade de negócio bem definida e delimitada
- Quando há múltiplos componentes, lógica e estados relacionados
- Quando a funcionalidade pode evoluir de forma independente

#### Estrutura de uma feature

**actions/**
- Contém apenas **Server Actions** (arquivos com `"use server"`)
- Um arquivo por grupo de ações relacionadas
- Nomenclatura: `[feature]-actions.ts` ou `actions.ts`

**components/**
- Componentes específicos da feature
- Não devem ser importados diretamente por outras features
- Podem usar componentes de `shared/components`

**hooks/**
- Hooks que encapsulam lógica específica da feature
- Hooks de UI e estado relacionado à feature

**lib/**
- Funções utilitárias específicas da feature
- Transformações de dados, validações, formatações
- Lógica de negócio não relacionada ao servidor

**types/** (opcional)
- Tipos TypeScript específicos da feature
- Apenas quando os tipos não são compartilhados
- Tipos compartilhados devem ficar em `shared/types`

### Shared

O diretório `shared` contém código que é usado por múltiplas features ou pela aplicação como um todo.

**Regras para código em `shared`:**
- Deve ser verdadeiramente compartilhado (usado por 2+ features)
- Não deve conter lógica específica de uma única feature
- Componentes devem ser genéricos e reutilizáveis
- Utilitários devem ser funções puras sempre que possível

**Não coloque em `shared`:**
- Código que "pode ser útil no futuro" (aplique YAGNI)
- Código que é usado apenas por uma feature
- Lógica de negócio específica

## Server Actions

### Definição
Server Actions são funções assíncronas executadas no servidor, marcadas com a diretiva `"use server"` no Next.js. Elas permitem que componentes do cliente executem operações no servidor sem criar rotas API explícitas.

### Regras para Server Actions

#### 1. Localização
- **Sempre** dentro de `features/[feature-name]/actions/`
- Nunca em `shared/actions` (não há ações compartilhadas)
- Cada feature deve ter seu próprio diretório `actions/`

#### 2. Nomenclatura
- Nome do arquivo: `[feature]-actions.ts` ou simplesmente `actions.ts` dentro da feature
- Nome da função: deve terminar com `Action` (ex: `createUserAction`, `updateLeadAction`)
- Use verbos no infinitivo que descrevam a ação (create, update, delete, fetch, etc.)

#### 3. Diretiva "use server"
- Deve aparecer no **topo do arquivo**, antes de qualquer importação
- Não precisa ser repetida em cada função dentro do arquivo
- Todos os exports do arquivo serão automaticamente Server Actions

#### 4. Escopo e Responsabilidades
- Uma Server Action deve realizar **uma operação específica**
- Não crie ações genéricas que fazem múltiplas coisas diferentes
- Prefira múltiplas ações pequenas a uma ação grande e complexa

#### 5. Validação e Segurança
- **Sempre** valide dados de entrada
- Implemente autenticação e autorização
- Verifique permissões antes de executar operações
- Nunca confie em validação apenas no cliente

#### 6. Tipagem
- Use TypeScript para tipar parâmetros e retorno
- Prefira tipos explícitos ao invés de `any`
- Retorne objetos com estrutura clara ou lançe erros tipados

#### 7. Tratamento de Erros
- Capture erros e retorne mensagens apropriadas
- Use códigos de erro consistentes
- Não exponha detalhes sensíveis do servidor ao cliente

#### 8. Estrutura do Arquivo
```typescript
"use server";

// Imports primeiro
import { ... } from "...";

// Tipos relacionados à ação (se não estiverem em types/)
type ActionInput = { ... };
type ActionOutput = { ... };

// Funções exportadas
export async function actionNameAction(
  input: ActionInput
): Promise<ActionOutput> {
  // Implementação
}
```

#### 9. Chamadas de Server Actions
- Server Actions podem ser chamadas diretamente de componentes do cliente
- Podem ser usadas em formulários com `action={actionFunction}`
- Podem ser chamadas via `formAction` ou diretamente em event handlers
- Não podem ser chamadas de outras Server Actions diretamente (use funções auxiliares)

#### 10. Dependências e Imports
- Server Actions podem importar de `shared`
- Server Actions podem importar utilitários de `features/[feature]/lib`
- Server Actions podem usar bibliotecas de servidor (ORM, validação, etc.)
- Evite importar componentes React em Server Actions

## Convenções de Código

### Imports
- Use paths absolutos configurados (ex: `@/shared/...`, `@/features/...`)
- Ordene imports: bibliotecas externas → código interno
- Evite imports circulares

### Nomenclatura
- Features: kebab-case (ex: `lead-management`, `user-profile`)
- Arquivos: kebab-case (ex: `lead-card.tsx`, `user-actions.ts`)
- Componentes: PascalCase (ex: `LeadCard`, `UserProfile`)
- Funções: camelCase (ex: `fetchUserData`, `validateInput`)
- Server Actions: camelCase terminando com `Action` (ex: `createUserAction`)
- Hooks: camelCase iniciando com `use` (ex: `useUserData`)
- Types/Interfaces: PascalCase (ex: `User`, `LeadData`)

### Componentes
- Um componente por arquivo
- Nome do arquivo deve corresponder ao nome do componente
- Componentes de feature devem ser coesos e não genéricos

## Boas Práticas

### 1. Separação de Responsabilidades
- Componentes: apresentação e interação
- Hooks: lógica de estado e efeitos
- Lib: transformações e cálculos
- Actions: operações no servidor

### 2. Evite Dependências entre Features
- Se duas features precisam compartilhar código, mova para `shared`
- Use eventos ou callbacks ao invés de imports diretos entre features
- Considere criar uma feature "pai" que orquestra features relacionadas

### 3. Tipos Compartilhados
- Tipos usados por múltiplas features → `shared/types`
- Tipos específicos de uma feature → `features/[feature]/types` ou inline
- Evite duplicação de tipos

### 4. Testabilidade
- Funções em `lib` devem ser puras quando possível
- Server Actions devem ser testáveis isoladamente
- Componentes devem ser testáveis com mocks das actions

### 5. Performance

#### Carregamento Paralelo de Dados
- **Use `Promise.all` para requisições independentes**: Quando você precisa buscar múltiplos dados que não dependem uns dos outros, use `Promise.all` para executá-los em paralelo, reduzindo significativamente o tempo total de carregamento.

```typescript
// ✅ BOM: Carregamento paralelo
const [messages, activities, suggestions] = await Promise.all([
  getLeadMessagesAction(leadId),
  getLeadActivitiesAction(leadId),
  getLeadAISuggestionsAction(leadId),
]);

// ❌ RUIM: Carregamento sequencial (mais lento)
const messages = await getLeadMessagesAction(leadId);
const activities = await getLeadActivitiesAction(leadId);
const suggestions = await getLeadAISuggestionsAction(leadId);
```

#### Tratamento de Erros em Promise.all
- Sempre trate erros individualmente em cada promise para evitar que uma falha quebre todo o carregamento:

```typescript
// ✅ BOM: Tratamento de erro individual
Promise.all([
  getData1().catch((error) => {
    console.error("Error loading data1:", error);
    return defaultValue1; // Retorna valor padrão
  }),
  getData2().catch((error) => {
    console.error("Error loading data2:", error);
    return defaultValue2;
  }),
]).then(([data1, data2]) => {
  // Processa dados mesmo se algum falhou
});

// ❌ RUIM: Se uma promise falhar, Promise.all falha completamente
Promise.all([getData1(), getData2()]).then(...);
```

#### Uso de startTransition para Carregamento Não Bloqueante
- Use `useTransition` e `startTransition` para tornar atualizações de estado não bloqueantes, mantendo a UI responsiva durante carregamentos:

```typescript
import { useTransition } from 'react';

function MyComponent() {
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      // Carregamento de dados em background
      Promise.all([...]).then((results) => {
        startTransition(() => {
          // Atualizações de estado não bloqueiam UI
          setData(results);
        });
      });
    });
  }, []);
}
```

#### Preloading de Dados
- Inicie o carregamento de dados antes de realmente precisar deles para melhorar a percepção de velocidade:

```typescript
// Preload quando o usuário está prestes a abrir um drawer/modal
const handleOpenDrawer = (lead: Lead) => {
  setSelectedLead(lead);
  setIsOpen(true);
  
  // Preload em paralelo antes do drawer abrir completamente
  void Promise.all([
    getLeadMessagesAction(lead.id).catch(() => []),
    getLeadActivitiesAction(lead.id).catch(() => []),
  ]);
};
```

#### Otimizações Gerais
- Lazy load de componentes pesados quando apropriado
- Server Actions devem ser eficientes (evite operações custosas desnecessárias)
- Use cache quando apropriado
- Centralize autenticação e verificações de workspace para evitar chamadas redundantes

## Exemplo de Fluxo

### Criação de uma Nova Feature

1. **Criar estrutura de diretórios:**
   ```
   src/features/nova-feature/
   ├── actions/
   ├── components/
   ├── hooks/
   └── lib/
   ```

2. **Definir tipos:**
   - Tipos específicos → `features/nova-feature/types/` ou inline
   - Tipos compartilhados → `shared/types/`

3. **Criar Server Actions:**
   - Arquivo em `features/nova-feature/actions/`
   - Marcar com `"use server"`
   - Implementar validação e segurança

4. **Criar componentes:**
   - Componentes específicos em `features/nova-feature/components/`
   - Usar componentes de `shared/components` quando necessário

5. **Criar hooks (se necessário):**
   - Hooks específicos em `features/nova-feature/hooks/`

6. **Criar utilitários (se necessário):**
   - Funções auxiliares em `features/nova-feature/lib/`

7. **Integrar com a aplicação:**
   - Usar componentes e actions nas rotas em `app/`

## Checklist de Verificação

Ao criar ou modificar código, verifique:

- [ ] Arquivo está no local correto de acordo com sua função?
- [ ] Nomenclatura segue as convenções?
- [ ] Server Actions estão em `features/[feature]/actions/`?
- [ ] Server Actions têm `"use server"` no topo?
- [ ] Código compartilhado está em `shared`?
- [ ] Código específico está na feature correspondente?
- [ ] Não há dependências desnecessárias entre features?
- [ ] Tipos estão no local apropriado?
- [ ] Imports usam paths absolutos configurados?
