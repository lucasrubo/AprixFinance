# 📱 AprixFinance PWA (Progressive Web App)

O AprixFinance agora está configurado como PWA! Você pode instalar e usar como um aplicativo nativo.

## ✅ O que foi configurado

### 🔧 Dependências

- **next-pwa**: Biblioteca principal para suporte PWA no Next.js
- Configuração automática de Service Worker

### 📋 Manifest (manifest.json)

- Nome: AprixFinance
- Descrição: Plataforma de gestão financeira pessoal com IA
- Tema: Azul (#0066cc)
- Modo standalone (tela cheia como app nativo)
- Ícones responsivos (72x72 até 512x512px)
- Orientação portrait
- Categoria: finance, productivity, business
- Idioma: pt-BR

### 🎨 Configurações de Layout

- Meta tags para PWA
- Viewport configurado para mobile
- Apple Touch Icon support
- Theme color definido
- Status bar style configurado

## 📲 Como instalar no celular

### 📱 iPhone (Safari)

1. Acesse o site pelo Safari
2. Toque no ícone de **Compartilhar** (quadrado com seta para cima)
3. Role para baixo e selecione **"Adicionar à Tela de Início"**
4. Confirme o nome e toque em **"Adicionar"**

### 🤖 Android (Chrome/Edge)

1. Acesse o site pelo navegador
2. Toque no menu (3 pontos) do navegador
3. Selecione **"Adicionar à tela inicial"** ou **"Instalar app"**
4. Confirme a instalação

### 💻 Desktop (Chrome/Edge)

1. Acesse o site
2. Procure pelo ícone de **instalação** na barra de endereços
3. Ou vá no menu → **"Instalar AprixFinance..."**

## 🚀 Funcionalidades PWA Ativas

✅ **Instalação como app nativo**
✅ **Funciona offline (básico)**
✅ **Ícone na tela inicial**
✅ **Splash screen automática**
✅ **Modo standalone (sem barra do navegador)**
✅ **Push notifications (preparado)**
✅ **Atualização automática**

## 🔄 Service Worker

O Service Worker é gerado automaticamente pelo next-pwa e oferece:

- Cache inteligente de recursos
- Funcionamento offline básico
- Atualizações automáticas
- Background sync (preparado)

## 🎯 Próximos passos (opcional)

### 🔔 Push Notifications

Para implementar notificações push, você precisará:

- Configurar Firebase Cloud Messaging
- Adicionar chaves VAPID
- Implementar service worker personalizado

### 🌐 Melhorar Cache Offline

- Configurar estratégias de cache específicas
- Implementar sync em background
- Cache de dados da API

### 🍎 Quando considerar Capacitor?

Mude para Capacitor apenas se precisar de:

- **Acesso profundo ao Bluetooth**
- **FaceID/TouchID para autenticação**
- **Publicação na App Store/Play Store**
- **APIs nativas específicas**

## 🛠️ Arquivos criados/modificados

```
✅ next.config.js - Configuração PWA
✅ public/manifest.json - Manifesto da aplicação
✅ public/icon.svg - Ícone base (substitua por ícones PNG)
✅ src/app/layout.tsx - Meta tags e viewport
```

## 📋 Para produção

1. **Substitua os ícones**:
   - Crie ícones PNG nas dimensões do manifest.json
   - Use ferramentas como RealFaviconGenerator.com
   - Substitua o icon.svg por ícones reais

2. **Teste em dispositivos reais**:
   - iPhone (Safari)
   - Android (Chrome)
   - Desktop (Chrome/Edge)

3. **Configure HTTPS**:
   - PWAs requerem HTTPS em produção
   - Vercel/Netlify já fornecem HTTPS automático

## 🔍 Como verificar se está funcionando

1. **F12 → Application → Manifest**: Veja as configurações
2. **F12 → Application → Service Workers**: Veja se está ativo
3. **F12 → Lighthouse → Progressive Web App**: Score de qualidade PWA
4. **Teste a instalação** em diferentes dispositivos

---

## 🔧 Correções de Build (Next.js 16)

### Problemas Resolvidos

- **Dynamic Server Usage**: Páginas que usam cookies foram marcadas como `export const dynamic = 'force-dynamic'`
- **useSearchParams Suspense**: Componente envolvido em `<Suspense>` boundary
- **Páginas Corrigidas**:
  - `/dashboard` - Adicionado `dynamic = 'force-dynamic'`
  - `/dashboard/agent` - Adicionado `dynamic = 'force-dynamic'`
  - `/dashboard/fixed-expenses` - Adicionado `dynamic = 'force-dynamic'`
  - `/dashboard/receipts` - Envolvido em Suspense boundary

### Arquivos Modificados

```
✅ src/app/dashboard/page.tsx - dynamic directive
✅ src/app/dashboard/agent/page.tsx - dynamic directive
✅ src/app/dashboard/fixed-expenses/page.tsx - dynamic directive
✅ src/app/dashboard/receipts/page.tsx - Suspense wrapper
```
