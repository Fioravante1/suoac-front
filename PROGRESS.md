# Histórico de Progresso - SUOAC Frontend

Este documento mantém o registro da evolução do projeto frontend, separando por conquistas e etapas concluídas para facilitar o rastreamento do que já foi implementado.

## Status Atual

**Fase:** Pages placeholder e navegacao interna

---

## Entregas Concluidas

### 1. Setup Base e Infraestrutura

- Configuracao do projeto com **Next.js 16** (App Router) e **React 19**.
- Setup rigoroso do **TypeScript** (`strict: true`).
- Configuracao da **Feature-Sliced Design (FSD)** como arquitetura oficial.
- Implantacao das validacoes de arquitetura via **Steiger** e **ESLint** (`eslint-plugin-boundaries`).
- Setup da suite de testes com **Vitest** e **React Testing Library**, incluindo o `cleanup` automatico pos-testes.

### 2. Design System e Estilizacao

- Definicao do Design System ("Verde Organizacao") com tokens CSS globais.
- Tipografia oficializada (Inter).
- Substituicao do favicon padrao do Next.js pelo logotipo vetorial do SUOAC (`app/icon.png`).

### 3. Componentes Compartilhados (Shared UI)

Criacao dos componentes base reutilizaveis na camada `shared`, todos acompanhados de testes unitarios:

- **Button:** Variantes `primary`, `secondary` e `ghost`, `fullWidth`, animacoes de hover/disabled.
- **TextField:** Inputs com suporte a icones, labels vinculadas, estados de erro e IDs autogerados.
- **Card:** Container com fundo e bordas arredondadas padronizadas (`radius-xl`).

### 4. Autenticacao

- **Feature `sign-in`:**
  - `SignInForm` com React Hook Form + Zod + `zodResolver`.
  - `signInAction` (Server Action) conectando ao backend via `httpClient`.
  - `signOutAction` para logout com limpeza de sessao.
  - Testes unitarios para validacao e submissao.

- **Sessao e Auth Context:**
  - `shared/auth/session` com cookies HttpOnly (`suoac-access-token`, `suoac-refresh-token`, `suoac-session`).
  - `shared/auth/auth-context` com `AuthProvider` e `useAuth`.
  - `AppProviders` compondo `AuthProvider` + `QueryProvider`.

- **Cliente HTTP:**
  - `shared/api/http-client` com tipagem, tratamento de erros (`HttpError`), endpoints centralizados.

- **Proxy (protecao de rotas):**
  - `proxy.ts` na raiz, auto-detectado pelo Next.js 16.
  - Redireciona usuarios nao autenticados para `/login`.
  - Redireciona usuarios autenticados tentando acessar `/login` para `/dashboard`.

### 5. Camada de Paginas

- **Page `login`:**
  - Pagina visual na camada FSD (`src/pages/login`).
  - Conectada ao roteamento via `app/(auth)/login/page.tsx`.

- **Page `dashboard`:**
  - Pagina placeholder na camada FSD (`src/pages/dashboard`).
  - Exibe heading "Dashboard" e saudacao com nome do usuario via `useAuth`.
  - Conectada ao roteamento via `app/(private)/dashboard/page.tsx`.

- **Redirect na raiz:**
  - `app/page.tsx` redireciona `/` para `/dashboard`.

### 6. App Shell (Widget)

- **Widget `app-shell`** (`src/widgets/app-shell`):
  - `app-shell` — Server Component que compoe sidebar + main content + bottom nav.
  - `desktop-sidebar` — Client Component com logo, 6 itens de navegacao, highlight ativo, nome do usuario e logout.
  - `mobile-bottom-nav` — Client Component com 4 itens de navegacao + botao de sair.
  - Responsivo: sidebar visivel em desktop (>=768px), bottom nav fixa em mobile.
  - Testes unitarios para sidebar, bottom nav e dashboard page.

- **Route group `(private)`:**
  - `app/(private)/layout.tsx` usa `AppShell` como layout autenticado.

### 7. Rotas

- `shared/config/routes.ts` com: `home`, `login`, `dashboard`, `events`, `congregations`, `passengers`, `financial`, `settings`.

### 8. Pages Placeholder (Rotas Internas)

- **Pages FSD criadas** para todas as rotas internas do app-shell:
  - `events` — Eventos (assembleias e congressos).
  - `congregations` — Congregacoes do circuito.
  - `passengers` — Passageiros e inscricoes.
  - `financial` — Pagamentos e resumos financeiros.
  - `settings` — Configuracoes do sistema.
- Cada page segue o padrao: Server Component com heading + descricao, CSS Modules com design tokens, teste unitario co-localizado e public API via `index.ts`.
- Rotas conectadas ao App Router via `app/(private)/{rota}/page.tsx`.
- Navegacao pelo sidebar e bottom nav funciona sem 404.

---

## Proximos Passos
- [ ] Implementar filtragem de navegacao por role (RBAC).
- [ ] Criar entities com model e queries reais (event, passenger, payment, congregation).
- [ ] Criar features do MVP (create-event, enroll-passenger, register-payment).
- [ ] Integracao real das requisicoes assincronas com TanStack Query.
