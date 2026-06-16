# SUOAC — Fluxo de Autenticacao

**Versao:** 2.0
**Data:** 15/06/2026
**Escopo:** Autenticacao, sessao, protecao de rotas, troca de senha obrigatoria e autorizacao no frontend Next.js

---

## Indice

1. [Visao geral](#1-visao-geral)
2. [Arquitetura BFF](#2-arquitetura-bff)
3. [Fluxo de login](#3-fluxo-de-login)
   3.5. [Troca de senha obrigatoria (primeiro acesso)](#35-troca-de-senha-obrigatoria-primeiro-acesso)
4. [Fluxo de logout](#4-fluxo-de-logout)
5. [Gerenciamento de sessao](#5-gerenciamento-de-sessao)
6. [Protecao de rotas](#6-protecao-de-rotas)
7. [Contexto de autenticacao no client](#7-contexto-de-autenticacao-no-client)
8. [Validacao client-side](#8-validacao-client-side)
9. [Tratamento de erros](#9-tratamento-de-erros)
10. [Seguranca](#10-seguranca)
11. [Mapa de arquivos](#11-mapa-de-arquivos)
12. [Fronteira server/client no Next.js](#12-fronteira-serverclient-no-nextjs)
13. [Decisoes arquiteturais](#13-decisoes-arquiteturais)
14. [Testes](#14-testes)
15. [Limitacoes e evolucoes futuras](#15-limitacoes-e-evolucoes-futuras)

---

## 1. Visao geral

O SUOAC implementa autenticacao baseada em tokens JWT emitidos pelo backend, mas o **frontend
nunca manipula tokens em JavaScript**. O servidor Next.js atua como BFF (Backend for Frontend),
recebendo os tokens do backend e armazenando-os em cookies httpOnly inacessiveis ao navegador.

Resumo do modelo:

- O **backend** autentica credenciais e retorna tokens + dados do usuario no body da resposta.
- O **servidor Next.js** (Server Action) recebe essa resposta, cria cookies httpOnly e redireciona.
- O **navegador** recebe os cookies automaticamente, mas nao tem acesso ao conteudo dos tokens.
- O **proxy** (ex-middleware do Next.js 16) verifica a existencia do cookie para proteger rotas.

```txt
Navegador                    Servidor Next.js (BFF)                Backend API
   |                                |                                  |
   |-- submit credenciais --------->|                                  |
   |                                |-- POST /auth/login ------------->|
   |                                |<-- { accessToken, user } --------|
   |                                |                                  |
   |                                |-- Set-Cookie: httpOnly --------->|
   |<-- 303 redirect + cookies ----|                                  |
   |                                |                                  |
   |-- GET / (com cookies) -------->|                                  |
   |                                |-- le cookie, renderiza SSR ----->|
   |<-- HTML com dados do usuario --|                                  |
```

---

## 2. Arquitetura BFF

### 2.1 O que e o BFF

BFF (Backend for Frontend) e um padrao onde o servidor do frontend atua como proxy entre o
navegador e a API real. No SUOAC, o servidor Node.js do Next.js desempenha esse papel.

### 2.2 Por que usar BFF

| Sem BFF                                  | Com BFF (SUOAC)                                  |
| ---------------------------------------- | ------------------------------------------------ |
| Tokens armazenados em `localStorage`     | Tokens armazenados em cookies httpOnly           |
| JavaScript do navegador acessa os tokens | JavaScript do navegador **nao** acessa os tokens |
| Vulneravel a XSS (roubo de token)        | Tokens inacessiveis mesmo com XSS                |
| Frontend conhece a URL da API            | Apenas o servidor conhece `API_BASE_URL`         |
| CORS entre frontend e backend            | Sem CORS — servidor faz fetch server-side        |

### 2.3 Responsabilidades

| Componente       | Responsabilidade                                                   |
| ---------------- | ------------------------------------------------------------------ |
| Backend API      | Validar credenciais, emitir tokens, revogar tokens                 |
| Servidor Next.js | Proxy de requisicoes, criar/destruir cookies, renderizar SSR       |
| Proxy (edge)     | Verificar existencia do cookie, redirecionar rotas                 |
| Navegador        | Enviar cookies automaticamente, renderizar UI, validar formularios |

---

## 3. Fluxo de login

### 3.1 Diagrama passo a passo

```txt
1. Usuario preenche e-mail e senha no formulario
2. React Hook Form valida client-side com Zod
3. Se valido, onSubmit cria FormData e chama signInAction()
4. signInAction() roda no SERVIDOR (Server Action):
   a. Re-valida os dados com signInSchema.safeParse()
   b. Chama httpClient<SignInResponseDto>("/auth/login", { method: "POST", body })
   c. Backend retorna { accessToken, refreshToken, user }
   d. createSession() seta 3 cookies no navegador
   e. redirect("/dashboard") com HTTP 303
5. Proxy ve o cookie → permite acesso a "/dashboard"
6. RootLayout renderiza AppProviders:
   a. getSession() le o cookie suoac-user
   b. AuthProvider recebe os dados do usuario
7. PrivateLayout renderiza AppShell (sidebar + bottom nav)
8. DashboardPage usa useAuth() e exibe "Bem-vindo, {nome}!"
```

### 3.2 Server Action: `signInAction`

Arquivo: `src/features/sign-in/api/sign-in-action.ts`

```ts
"use server";

export async function signInAction(_prevState: SignInState | undefined, formData: FormData): Promise<SignInState>;
```

Comportamento:

1. Extrai `email` e `password` do `FormData`.
2. Valida com `signInSchema.safeParse()` (reusa o mesmo schema do client).
3. Chama `POST /auth/login` via `httpClient`.
4. Em caso de sucesso, chama `createSession()` com os tokens e dados do usuario (incluindo a flag
   `mustChangePassword`).
5. Em caso de erro 401, retorna `{ error: "E-mail ou senha incorretos." }`.
6. Em caso de erro inesperado, retorna `{ error: "Ocorreu um erro inesperado. Tente novamente." }`.
7. O redirect e chamado **fora do try/catch** (o Next.js lanca internamente ao redirecionar, e
   capturar essa excecao impediria o redirect):
   - Se `user.mustChangePassword === true` → `redirect(routes.changePassword)` (`/change-password`),
     ignorando o `returnUrl`.
   - Caso contrario → `redirect(returnUrl seguro ?? routes.dashboard)`.

### 3.3 Contrato com o backend

Endpoint: `POST /auth/login`

Request body:

```json
{
  "email": "coordenador@suoac.dev",
  "password": "Senha@123"
}
```

Response body (200):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "f8b6c15f-6ebf-4712-a8e3-930f0019c33a",
    "name": "Coordenador de Circuito",
    "email": "coordenador@suoac.dev",
    "role": "CIRCUIT_COORDINATOR",
    "isActive": true,
    "mustChangePassword": false,
    "circuitId": "2eb3651e-06c6-46d3-b141-16a616eae18a",
    "congregationId": null
  }
}
```

> `mustChangePassword` e opcional no contrato (tokens/usuarios antigos podem nao envia-la).
> Ausencia e tratada como `false`.

Response body (401):

```json
{
  "message": "Invalid credentials"
}
```

DTO no frontend: `src/features/sign-in/api/sign-in.dto.ts`

```ts
import type { User } from "@/entities/user";

export interface SignInResponseDto {
  accessToken: string;
  refreshToken: string;
  user: User;
}
```

### 3.4 Redirect 303

O `redirect()` do Next.js dentro de uma Server Action retorna HTTP 303 (See Other). Isso instrui
o navegador a fazer um GET na URL de destino, implementando o padrao PRG (Post-Redirect-Get).
Se o usuario apertar F5 apos o login, o navegador repete o GET em `/` em vez de reenviar as
credenciais.

---

## 3.5 Troca de senha obrigatoria (primeiro acesso)

Usuarios criados via seed ou pela API recebem uma senha temporaria definida por um coordenador.
No primeiro acesso (ou apos um reset por admin) o backend marca `mustChangePassword: true` e
**bloqueia toda a API com 403** ate a senha ser trocada — exceto `POST /auth/change-password` e
`POST /auth/logout`. A obrigatoriedade e **imposta pelo servidor**; o front apenas reflete a
experiencia.

### 3.5.1 Diagrama

```txt
Login (senha temporaria) ──► 200 + user.mustChangePassword: true
        │  (createSession persiste a flag no cookie suoac-user)
        ▼
signInAction → redirect(/change-password)
        │  (qualquer outra rota e barrada pelo proxy / API responde 403)
        ▼
ChangePasswordForm → changePasswordAction → POST /auth/change-password
        │
        ▼
200 + NOVO par de tokens (mustChangePassword: false)
        │  (createSession substitui os tokens) → redirect(/dashboard)
        ▼
Acesso liberado
```

### 3.5.2 Imposicao em tres camadas

| Camada                | Papel                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.ts`            | Le `mustChangePassword` do cookie `suoac-user` e prende a navegacao em `/change-password` (cobre F5/URL forcada).               |
| `signInAction`        | Apos login com a flag, redireciona direto para `/change-password`.                                                              |
| Rede de seguranca 403 | `httpClient` propaga o 403; `useServerError`/`query-client` detectam e redirecionam (chamadas de API em paginas ja carregadas). |

### 3.5.3 Server Action: `changePasswordAction`

Arquivo: `src/features/change-password/api/change-password-action.ts`

```ts
"use server";

export async function changePasswordAction(
  _prevState: ChangePasswordState | undefined,
  formData: FormData,
): Promise<ChangePasswordState>;

interface ChangePasswordState {
  error?: string;
  field?: "currentPassword" | "newPassword"; // erro inline no campo correspondente
}
```

Comportamento:

1. Valida `currentPassword`, `newPassword` e `confirmPassword` com `changePasswordSchema`
   (nova senha 8–100 chars, confirmacao coincide, nova != atual).
2. Chama `POST /auth/change-password` com `{ currentPassword, newPassword }` (o `confirmPassword`
   nao vai ao backend).
3. Em caso de sucesso, `createSession()` **substitui** os tokens pelos novos (flag ja `false`).
4. `redirect(routes.dashboard)` **fora do try/catch**.
5. Mapeamento de erros (`mapChangePasswordError`, com early returns):

| Status / sinal                             | Retorno                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| `SESSION_EXPIRED_MESSAGE` (refresh falhou) | `{ error: SESSION_EXPIRED_MESSAGE }` → relogin                                 |
| `401` "Credenciais invalidas"              | `{ error: SESSION_EXPIRED_MESSAGE }` → relogin                                 |
| `401` "Senha atual incorreta"              | `{ field: "currentPassword", error: "Senha atual incorreta." }`                |
| `422`                                      | `{ field: "newPassword", error: "A nova senha deve ser diferente da atual." }` |
| `400`                                      | `{ error: "Verifique os campos e tente novamente." }`                          |
| outro                                      | `{ error: "Não foi possível alterar a senha. Tente novamente." }`              |

> **Importante:** substituir os tokens apos o 200 e obrigatorio. Continuar com o token antigo
> (que ainda carrega `mustChangePassword: true`) manteria o 403 ate ele expirar.

### 3.5.4 Rede de seguranca (403 global)

A constante `PASSWORD_CHANGE_REQUIRED_MESSAGE` (`src/shared/auth/constants`) corresponde a
mensagem do backend. A deteccao e o redirect espelham o fluxo de sessao expirada:

- `isPasswordChangeRequiredError` / `redirectToPasswordChangeRequired` em `shared/auth/session-redirect`
  (hard navigation para `/change-password`, compartilhando o gate `isRedirecting`).
- Consumido por `useServerError` (mutations) e pelo `query-client` (`onError`, `retry`,
  `throwOnError`).

A navegacao normal ja e coberta pelo proxy; o 403 e a rede de seguranca para chamadas de API
disparadas em paginas ja carregadas ou apos rotacao de token.

---

## 4. Fluxo de logout

### 4.1 Diagrama passo a passo

```txt
1. Usuario clica em "Sair"
2. <form action={signOutAction}> submete ao servidor
3. signOutAction() roda no SERVIDOR (Server Action):
   a. Le o access token do cookie
   b. Chama POST /auth/logout com Authorization: Bearer {token} (best-effort)
   c. deleteSession() remove os 3 cookies
   d. redirect("/login") com HTTP 303
4. Proxy ve que nao ha cookie → permite acesso a "/login"
5. Pagina de login e renderizada
```

### 4.2 Server Action: `signOutAction`

Arquivo: `src/features/sign-in/api/sign-out-action.ts`

```ts
"use server";

export async function signOutAction(): Promise<void>;
```

Comportamento:

1. Le o access token do cookie via `getAccessToken()`.
2. Se o token existir, chama `POST /auth/logout` com o header `Authorization: Bearer {token}`.
3. A chamada ao backend e best-effort: se falhar (rede, token expirado), o erro e ignorado.
4. `deleteSession()` remove os 3 cookies independentemente do resultado da chamada ao backend.
5. `redirect(routes.login)` redireciona para a pagina de login.

A limpeza local tem prioridade sobre a revogacao remota. Mesmo que o backend esteja indisponivel,
o usuario consegue sair do sistema.

---

## 5. Gerenciamento de sessao

### 5.1 Cookies

O gerenciamento de sessao e feito via cookies no servidor Next.js. O modulo responsavel e
`src/shared/auth/session/session.ts`, que importa `"server-only"` para impedir uso acidental no
client.

| Cookie                | httpOnly | Conteudo                 | Proposito                                 |
| --------------------- | -------- | ------------------------ | ----------------------------------------- |
| `suoac-access-token`  | sim      | JWT de acesso            | Autenticar requisicoes ao backend         |
| `suoac-refresh-token` | sim      | JWT de refresh           | Renovar o access token (futuro)           |
| `suoac-user`          | nao      | JSON com dados do perfil | Disponibilizar dados do usuario no client |

Configuracao dos cookies:

```ts
{
  httpOnly: true | false,       // conforme tabela acima
  secure: process.env.NODE_ENV === "production",  // HTTPS apenas em producao
  sameSite: "lax",              // protege contra CSRF em requests cross-origin
  path: "/",                    // disponivel em todas as rotas
  maxAge: 604800,               // 7 dias em segundos
}
```

### 5.2 Por que `suoac-user` nao e httpOnly

O cookie `suoac-user` contem apenas dados de perfil publicos (nome, email, role) — **nenhum
segredo**. Ele nao e httpOnly para que o `AuthProvider` possa ser hidratado no client sem
necessidade de uma chamada extra ao servidor em cada navegacao.

Dados sensiveis (tokens) ficam exclusivamente nos cookies httpOnly e nunca sao acessiveis via
JavaScript.

### 5.3 Funcoes do modulo `session.ts`

| Funcao            | Assinatura                                                        | Descricao                                   |
| ----------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| `createSession`   | `(accessToken, refreshToken, user: SessionUser) => Promise<void>` | Cria os 3 cookies apos login                |
| `getSession`      | `() => Promise<SessionUser \| null>`                              | Le e parseia o cookie `suoac-user`          |
| `getAccessToken`  | `() => Promise<string \| null>`                                   | Retorna o access token do cookie httpOnly   |
| `getRefreshToken` | `() => Promise<string \| null>`                                   | Retorna o refresh token do cookie httpOnly  |
| `deleteSession`   | `() => Promise<void>`                                             | Remove os 3 cookies                         |
| `hasSession`      | `() => Promise<boolean>`                                          | Verifica se o cookie de access token existe |

### 5.4 Interface `SessionUser`

```ts
interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  circuitId: string;
  congregationId: string | null;
  mustChangePassword?: boolean; // troca obrigatoria no primeiro acesso (ausencia = false)
}
```

Esta interface e definida em `session.ts` e nao depende de `entities/user` para evitar
acoplamento entre shared e entities (regra FSD).

---

## 6. Protecao de rotas

### 6.1 Proxy (ex-middleware)

No Next.js 16, o middleware foi renomeado para **proxy**. O arquivo `proxy.ts` fica na raiz do
projeto e executa antes de cada requisicao que corresponda ao matcher.

Arquivo: `proxy.ts`

Logica:

```txt
Se NAO tem cookie "suoac-access-token":
  Se a rota NAO e publica (/login):
    → Redireciona para /login
  Senao:
    → Permite (NextResponse.next())

Se TEM cookie "suoac-access-token":
  Se mustChangePassword (lido do cookie suoac-user) e a rota != /change-password:
    → Redireciona para /change-password
  Se NAO ha pendencia e a rota e /login ou /change-password:
    → Redireciona para /dashboard

Caso contrario:
  → Permite a requisicao (NextResponse.next())
```

A logica usa early returns (sem ifs aninhados). A flag `mustChangePassword` e lida do cookie
`suoac-user` (nao-httpOnly); ausencia/JSON invalido e tratado como `false`.

### 6.2 Matcher

O proxy exclui rotas que nao precisam de protecao:

```ts
export const config = {
  matcher: ["/((?!_next/static|_next/image|api|.*\\.\\w+$).*)"],
};
```

Rotas excluidas:

| Padrao         | Motivo                                       |
| -------------- | -------------------------------------------- |
| `_next/static` | Assets estaticos gerados pelo Next.js        |
| `_next/image`  | Otimizacao de imagens do Next.js             |
| `api`          | Route handlers (se houver no futuro)         |
| `.*\.\w+$`     | Qualquer arquivo com extensao (icones, etc.) |

### 6.3 Rotas publicas vs protegidas

| Rota               | Tipo                 | Comportamento                                                                                                    |
| ------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/login`           | Publica              | Acessivel sem autenticacao. Redireciona para `/dashboard` se logado (ou `/change-password` se houver pendencia). |
| `/change-password` | Autenticada/especial | Requer cookie. So permanece aqui quem tem `mustChangePassword`; sem pendencia → `/dashboard`.                    |
| `/`                | Protegida            | Redireciona para `/dashboard`.                                                                                   |
| `/dashboard`       | Protegida            | Requer cookie. Redireciona para `/login` se nao autenticado, ou `/change-password` se pendente.                  |
| `/*`               | Protegida            | Qualquer outra rota segue a mesma regra.                                                                         |

### 6.4 Limitacao de seguranca do proxy

O proxy verifica apenas a **existencia** do cookie, nao sua validade. Ele e uma barreira
otimista — impede que usuarios claramente deslogados vejam paginas protegidas, mas nao garante
que o token seja valido.

A verificacao real de autorizacao deve acontecer:

- Nas **Server Actions** antes de executar mutacoes (verificar token com o backend).
- Nos **Server Components** ao carregar dados (passar token como header ao backend).
- No **backend** ao receber cada requisicao (validar JWT, verificar permissoes).

---

## 7. Contexto de autenticacao no client

### 7.1 AuthProvider

Arquivo: `src/shared/auth/auth-context/auth-context.tsx`

O `AuthProvider` e um Client Component que recebe os dados do usuario como prop (injetados pelo
Server Component `AppProviders`) e os disponibiliza via React Context.

```txt
RootLayout (Server Component)
  └─ AppProviders (Server Component async)
       ├─ getSession() → le cookie suoac-user
       └─ AuthProvider user={session} (Client Component)
            └─ QueryProvider (Client Component)
                 └─ children
```

### 7.2 Hook `useAuth()`

```ts
const { user, isAuthenticated } = useAuth();
```

| Campo             | Tipo                  | Descricao                        |
| ----------------- | --------------------- | -------------------------------- |
| `user`            | `SessionUser \| null` | Dados do usuario logado, ou null |
| `isAuthenticated` | `boolean`             | `true` se `user !== null`        |

O hook de mais alto nivel `useAuthPermissions()` (`src/shared/auth/use-auth-permissions`) deriva
de `useAuth()` campos prontos como `userCircuitId`, `userCongregationId`, `isCircuitUser` e os
booleanos por role.

### 7.3 Tipo do usuario no contexto

O contexto usa diretamente a interface `SessionUser` (secao 5.4) — nao ha um tipo `AuthUser`
separado. `SessionUser` ja carrega `role: UserRole` e a flag `mustChangePassword`.

### 7.4 Por que `shared/auth` e nao `app/`

Pelas regras do FSD + ESLint boundaries, a camada `pages` nao pode importar de `app`. Como
paginas precisam do `useAuth()`, o contexto foi colocado em `shared/auth`, acessivel por todas
as camadas.

---

## 8. Validacao client-side

### 8.1 Schema Zod

Arquivo: `src/features/sign-in/model/sign-in-schema.ts`

```ts
const signInSchema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido."),
  password: z.string().min(6, "A senha deve conter no mínimo 6 caracteres."),
});
```

### 8.2 React Hook Form

O formulario usa `useForm` com `zodResolver(signInSchema)`. A validacao ocorre no client antes
de chamar a Server Action, proporcionando feedback imediato ao usuario.

Erros de campo sao exibidos inline abaixo de cada `TextField`. O erro do servidor (banner) e
exibido acima dos campos com `role="alert"`.

### 8.3 Dupla validacao

O mesmo schema e usado tanto no client (React Hook Form) quanto no servidor (Server Action).
Isso garante que:

- O **client** impede submissoes invalidas com feedback instantaneo.
- O **servidor** revalida para impedir bypass (ex: requisicoes forjadas sem o formulario).

---

## 9. Tratamento de erros

### 9.1 Erros na Server Action

| Cenario                           | Codigo HTTP | Mensagem retornada ao client                              |
| --------------------------------- | ----------- | --------------------------------------------------------- |
| Dados invalidos (safeParse falha) | —           | "Dados invalidos. Verifique os campos e tente novamente." |
| Credenciais incorretas            | 401         | "E-mail ou senha incorretos."                             |
| Erro inesperado (rede, 500, etc.) | qualquer    | "Ocorreu um erro inesperado. Tente novamente."            |

### 9.2 HttpError

Arquivo: `src/shared/api/http-client/http-client.ts`

```ts
class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
```

O `httpClient` lanca `HttpError` para qualquer resposta com status nao-OK. A mensagem e extraida
do campo `message` do body JSON do backend, com fallback para uma mensagem generica.

### 9.3 Exibicao no formulario

```txt
┌─────────────────────────────────────┐
│ ⚠ E-mail ou senha incorretos.      │  ← .errorBanner (role="alert")
├─────────────────────────────────────┤
│ E-mail                              │
│ ┌─────────────────────────────────┐ │
│ │ seu.email@exemplo.com           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Senha                               │
│ ┌─────────────────────────────────┐ │
│ │ ••••••••                        │ │
│ └─────────────────────────────────┘ │
│                                     │
│             Esqueceu a senha?       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │           Entrar                │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

O banner usa tokens do design system:

```css
.errorBanner {
  background-color: var(--suoac-color-critical-soft); /* #FDECEC */
  color: var(--suoac-color-critical); /* #D64545 */
  border-radius: var(--suoac-radius-sm); /* 8px    */
}
```

### 9.4 Erros na troca de senha

A tela `/change-password` distingue erro de campo (inline via `setError`) de erro global (banner):

| Cenario                                         | Tratamento no front                                          |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `401` "Senha atual incorreta"                   | Inline no campo **senha atual** (`field: "currentPassword"`) |
| `422` nova == atual                             | Inline no campo **nova senha** (`field: "newPassword"`)      |
| `400` validacao                                 | Banner global                                                |
| `401` "Credenciais invalidas" / sessao expirada | Redireciona para `/login` (relogin)                          |

### 9.5 Sessao expirada e redirects globais

Quando o refresh falha, o `httpClient` lanca `HttpError(401, SESSION_EXPIRED_MESSAGE)` e apaga a
sessao. A deteccao por **valor de retorno** (`ActionResult.error`/`SessionState.error`) e confiavel
em producao — diferente de erros lancados por Server Actions, cuja mensagem o Next.js sanitiza no
build. O modulo `shared/auth/session-redirect` centraliza a deteccao e o hard redirect:

| Sinal                              | Detector                        | Acao                                                      |
| ---------------------------------- | ------------------------------- | --------------------------------------------------------- |
| `SESSION_EXPIRED_MESSAGE`          | `isSessionExpiredError`         | `redirectToSessionExpired()` → `/login`                   |
| `PASSWORD_CHANGE_REQUIRED_MESSAGE` | `isPasswordChangeRequiredError` | `redirectToPasswordChangeRequired()` → `/change-password` |

Ambos sao consumidos por `useServerError` (mutations), `query-client` (queries) e pelo
`SessionGuard` (estado de sessao), e compartilham um unico gate (`isRedirecting`).

---

## 10. Seguranca

### 10.1 Tokens nunca expostos ao JavaScript

Os tokens JWT (`accessToken` e `refreshToken`) sao armazenados em cookies httpOnly. Isso
significa que:

- `document.cookie` **nao** lista esses cookies.
- Mesmo que exista uma vulnerabilidade XSS, o atacante nao consegue ler os tokens.
- Apenas o servidor Next.js (via `cookies()` de `next/headers`) acessa os valores.

### 10.2 `server-only`

No Next.js, Server Components e Client Components compartilham o mesmo codebase. Nada impede
visualmente que um Client Component importe um modulo que so deveria rodar no servidor. Sem
nenhuma protecao, o erro seria silencioso — o codigo compilaria, o bundler incluiria o modulo
no bundle do navegador, e:

- `cookies()` de `next/headers` lancaria erro em runtime no browser.
- `process.env.API_BASE_URL` retornaria `undefined` no client (sem prefixo `NEXT_PUBLIC_`).
- A logica de sessao inteira seria exposta no JavaScript que o usuario recebe.

O pacote `server-only` resolve isso. Ao adicionar `import "server-only"` no topo de um arquivo,
o Next.js **falha o build imediatamente** se qualquer Client Component tentar importar aquele
modulo — diretamente ou via barrel export. O erro e explicito e acontece em tempo de compilacao,
nao em runtime.

No SUOAC, os arquivos que usam `server-only` no fluxo de auth sao:

| Arquivo                                          | Motivo                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `shared/api/http-client/http-client.ts`          | Contem `process.env.API_BASE_URL` (segredo server-side) e faz fetch direto ao backend |
| `shared/auth/session/session.ts`                 | Usa `cookies()` de `next/headers` para manipular cookies httpOnly                     |
| `shared/auth/refresh-session/refresh-session.ts` | Renova tokens via backend lendo/gravando cookies httpOnly                             |

Foi exatamente o `server-only` que revelou o problema do barrel export descrito na
[secao 12](#12-fronteira-serverclient-no-nextjs): quando o barrel `src/shared/api/index.ts`
re-exportava esses modulos junto com codigo client-safe, o `server-only` impediu o build e
forcou a separacao correta. Sem ele, o codigo teria compilado e falhado de formas mais dificeis
de diagnosticar.

### 10.3 `API_BASE_URL` nunca exposta

A variavel de ambiente `API_BASE_URL` nao tem prefixo `NEXT_PUBLIC_`, portanto so e acessivel
no servidor. O navegador nunca descobre a URL real da API — todas as requisicoes passam pelo
servidor Next.js.

### 10.4 `sameSite: "lax"`

Os cookies usam `sameSite: "lax"`, que impede o envio automatico em requisicoes cross-origin
POST (protecao contra CSRF). O cookie e enviado apenas em navegacoes top-level (cliques em
links) e em requisicoes same-origin.

### 10.5 `secure` em producao

Em producao (`NODE_ENV === "production"`), os cookies sao marcados como `secure`, exigindo HTTPS.
Em desenvolvimento, essa flag e desabilitada para permitir `http://localhost`.

### 10.6 Validacao server-side obrigatoria

A Server Action `signInAction` revalida os dados com Zod no servidor, mesmo que o client ja tenha
validado. Isso impede bypass da validacao por requisicoes forjadas.

### 10.7 Modelo de ameacas simplificado

| Ameaca                     | Mitigacao                                                 |
| -------------------------- | --------------------------------------------------------- |
| XSS (roubo de token)       | Tokens em cookies httpOnly — inacessiveis via JS          |
| CSRF                       | `sameSite: "lax"` impede envio cross-origin em POST       |
| Interceptacao de rede      | `secure: true` em producao exige HTTPS                    |
| Bypass de validacao        | Server Action revalida com Zod                            |
| Exposicao da URL da API    | `API_BASE_URL` sem `NEXT_PUBLIC_` — so server-side        |
| Import acidental no client | `import "server-only"` causa erro de build                |
| Token expirado             | (futuro) Refresh token rotation                           |
| Token roubado via cookie   | httpOnly + secure + sameSite reduzem superficie de ataque |

---

## 11. Mapa de arquivos

### 11.1 Infraestrutura (shared)

Cada modulo fica no seu proprio subdiretorio com `index.ts` como API publica (regra FSD).

```txt
src/shared/api/
  http-client/
    http-client.ts        HTTP client server-side + HttpError + refresh on 401 (import "server-only")
    endpoints.ts          Mapa de endpoints { auth.login, auth.changePassword, ... }
    types.ts              ActionResult<T>, PaginatedResponse
    index.ts
  query-client/
    query-client.ts       TanStack Query client; trata sessao expirada e troca de senha
    query-keys.ts
    index.ts
  index.ts                Barrel — exporta APENAS modulos client-safe

src/shared/auth/
  session/                createSession/getSession/getAccessToken/getRefreshToken/... (import "server-only")
  refresh-session/        refreshSession() — rotation de tokens (import "server-only")
  session-redirect/       deteccao + hard redirect (sessao expirada e troca de senha)
  session-guard/          SessionGuard + SessionExpiredOverlay ("use client")
  auth-context/           AuthProvider + useAuth ("use client")
  use-auth-permissions/   useAuthPermissions() ("use client")
  rbac/                   NavItem, filterNavItems, isCircuitRole
  constants/              SESSION_EXPIRED_MESSAGE, PASSWORD_CHANGE_REQUIRED_MESSAGE
  index.ts                Barrel publico (client-safe)

src/shared/config/
  routes/                 Mapa de rotas { home, login, changePassword, dashboard, events, ... }
  index.ts                Barrel publico
```

### 11.2 Entidades (entities)

```txt
src/entities/user/
  model/user.ts           Tipos User e UserRole
  index.ts                Barrel — exporta types
```

### 11.3 Features (features)

```txt
src/features/sign-in/
  api/
    sign-in-action.ts       Server Action de login ("use server")
    sign-out-action.ts      Server Action de logout ("use server")
    sign-in.dto.ts          DTO da resposta do backend
  model/
    sign-in-schema.ts       Schema Zod de validacao
  ui/
    sign-in-form.tsx        Formulario de login ("use client")
    sign-in-form.module.css
    sign-in-form.test.tsx
  index.ts                  Barrel — exporta SignInForm e signOutAction

src/features/change-password/
  api/
    change-password-action.ts   Server Action de troca de senha ("use server")
    change-password.dto.ts       DTO da resposta (novos tokens + user)
  model/
    change-password-schema.ts    Schema Zod (atual/nova/confirmacao)
  ui/
    change-password-form.tsx     Formulario de troca ("use client")
    change-password-form.module.css
    change-password-form.test.tsx
  index.ts                       Barrel — exporta ChangePasswordForm
```

### 11.4 Providers (app)

```txt
src/app/providers/
  app-providers.tsx       Server Component async — getSession() + AuthProvider
  query-provider.tsx      Client Component — QueryClientProvider
```

### 11.5 Rotas (Next.js App Router)

```txt
app/
  layout.tsx              RootLayout — <AppProviders>
  page.tsx                Redireciona "/" para "/dashboard"
  (auth)/
    layout.tsx            Layout visual para rotas de autenticacao
    login/
      page.tsx            Exporta LoginPage de @/pages/login
  change-password/
    page.tsx              Exporta ChangePasswordPage de @/pages/change-password (tela focada, sem AppShell)
  (private)/
    layout.tsx            Layout autenticado — <AppShell>
    dashboard/
      page.tsx            Exporta DashboardPage de @/pages/dashboard

src/pages/change-password/
  ui/change-password-page.tsx   Tela "Defina sua senha" (layout 2 colunas, espelha o login)
  index.ts

src/widgets/app-shell/
  ui/
    app-shell/            Server Component — sidebar + main + bottom nav
    desktop-sidebar/      Client Component — navegacao desktop + logout
    mobile-bottom-nav/    Client Component — navegacao mobile + logout
  index.ts                Barrel — exporta AppShell

proxy.ts                  Protecao de rotas (edge)
```

---

## 12. Fronteira server/client no Next.js

### 12.1 O problema dos barrel exports

No Next.js, Client Components e Server Components coexistem na mesma arvore. Quando um barrel
(`index.ts`) re-exporta modulos server-only junto com modulos client-safe, o bundler tenta incluir
tudo no bundle do client, causando erro.

Exemplo do problema:

```ts
// src/shared/api/index.ts — ERRADO
export { createQueryClient } from "./query-client"; // client-safe
export { httpClient } from "./http-client"; // import "server-only" ← BOOM
export { getSession } from "./session"; // import "server-only" ← BOOM
```

Quando `query-provider.tsx` (`"use client"`) importa de `@/shared/api`, o bundler resolve o
barrel inteiro e encontra os imports de `server-only`, causando erro de build.

### 12.2 A solucao adotada

Barrels exportam **apenas** codigo client-safe. Modulos server-only sao importados diretamente
pelo caminho especifico:

```ts
// Server Action — importa direto os modulos server-only
import { httpClient } from "@/shared/api/http-client";
import { createSession } from "@/shared/auth/session";

// Client Component — importa pelo barrel client-safe
import { createQueryClient } from "@/shared/api";
```

### 12.3 Impacto no Steiger (FSD)

O Steiger (validador FSD) possui a regra `no-public-api-sidestep` que proibe imports que
contornam o barrel. Como os imports diretos sao necessarios por limitacao do Next.js, a regra
e desabilitada para arquivos que precisam importar modulos server-only:

```js
// steiger.config.mjs
{
  files: [
    "src/**/api/*-action.ts",
    "src/**/api/*.queries.ts",
    "src/**/api/**/*-query.ts",
    "src/app/providers/**",
    "src/pages/**/ui/**",
  ],
  rules: {
    "fsd/no-public-api-sidestep": "off",
  },
}
```

Essa excecao e estritamente scoped:

- `src/**/api/*-action.ts` — Server Actions que importam httpClient/session
- `src/**/api/*.queries.ts` e `**/*-query.ts` — queries que importam o http-client
- `src/app/providers/**` — AppProviders que importa getSession
- `src/pages/**/ui/**` — Paginas que importam Server Actions diretamente

A protecao arquitetural permanece ativa para todos os outros arquivos do projeto. Observacao: o
caso da feature `change-password` mostrou o outro lado da regra — `SESSION_EXPIRED_MESSAGE` faz
parte da API publica `@/shared/auth`, entao deve ser importado de la (e nao de
`@/shared/auth/constants`), sob pena de `no-public-api-sidestep`.

---

## 13. Decisoes arquiteturais

### 13.1 Por que nao NextAuth/Auth.js

O SUOAC usa um backend proprio que emite tokens JWT. NextAuth e projetado para OAuth providers
e sessoes gerenciadas por ele mesmo. Integrar NextAuth com um backend customizado adicionaria
complexidade sem beneficio real.

### 13.2 Por que Server Actions e nao Route Handlers

Server Actions sao funcoes que rodam no servidor e podem ser chamadas diretamente de Client
Components. Vantagens:

- Nao precisam de `fetch` manual no client.
- Tipagem end-to-end (TypeScript infere o tipo de retorno).
- Integram com `redirect()`, `revalidatePath()` e `cookies()`.
- Sao a abordagem recomendada pelo Next.js para mutacoes.

### 13.3 Por que `suoac-user` nao e httpOnly

O cookie de usuario contem apenas dados de perfil (nome, email, role). Nao contem segredos.
Tornar httpOnly exigiria uma chamada extra ao servidor em cada renderizacao para obter os dados
do usuario no client. A abordagem atual permite que o `AuthProvider` seja hidratado diretamente
a partir do cookie.

### 13.4 Por que o logout e best-effort

Se a chamada `POST /auth/logout` ao backend falhar (rede, timeout, token ja expirado), o logout
local ainda acontece: os cookies sao removidos e o usuario e redirecionado. A alternativa seria
bloquear o logout ate o backend confirmar, o que criaria uma experiencia ruim quando o backend
estiver indisponivel.

### 13.5 Por que validar duas vezes (client + server)

- **Client**: UX rapida — erros inline sem roundtrip.
- **Server**: Seguranca — impede bypass por requisicoes forjadas (curl, Postman, XSS).

O mesmo schema Zod e reutilizado em ambos os lados.

---

## 14. Testes

### 14.1 Testes do formulario

Arquivo: `src/features/sign-in/ui/sign-in-form.test.tsx`

| Teste                                                 | Tipo         |
| ----------------------------------------------------- | ------------ |
| Renderiza os campos e o botao corretamente            | Renderizacao |
| Exibe erros de validacao ao submeter formulario vazio | Validacao    |
| Valida formato de e-mail                              | Validacao    |
| Chama signInAction com dados validos                  | Integracao   |
| Exibe erro do servidor quando a action retorna erro   | Erro         |

A Server Action e mockada via `vi.mock("../api/sign-in-action")` para isolar o teste do
servidor e do backend.

### 14.2 Testes do HTTP client

Arquivo: `src/shared/api/http-client/http-client.test.ts`

| Teste                                                           | Tipo    |
| --------------------------------------------------------------- | ------- |
| Faz requisicao GET e retorna dados                              | Sucesso |
| Faz requisicao POST com body JSON                               | Sucesso |
| Lanca HttpError para resposta nao-ok com mensagem do backend    | Erro    |
| Lanca HttpError com mensagem padrao quando body nao tem message | Erro    |

Os modulos `server-only` e `fetch` sao mockados.

### 14.3 Testes da sessao

Arquivo: `src/shared/auth/session/session.test.ts`

| Teste                                                   | Tipo        |
| ------------------------------------------------------- | ----------- |
| createSession seta 3 cookies com os valores corretos    | Criacao     |
| getSession retorna usuario quando cookie existe         | Leitura     |
| getSession retorna null quando cookie nao existe        | Leitura     |
| getSession retorna null quando cookie tem JSON invalido | Erro        |
| getAccessToken retorna token quando cookie existe       | Leitura     |
| getAccessToken retorna null quando cookie nao existe    | Leitura     |
| deleteSession limpa os 3 cookies                        | Remocao     |
| hasSession retorna true/false conforme cookie           | Verificacao |

Os modulos `server-only` e `next/headers` (`cookies()`) sao mockados.

### 14.4 Testes da troca de senha

| Arquivo                                                            | Cobertura                                                                  |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `features/change-password/api/change-password-action.test.ts`      | Endpoint/payload, troca de sessao, redirect, mapeamento 400/401/422/sessao |
| `features/change-password/ui/change-password-form.test.tsx`        | Render, validacao, erro por campo vs banner, chamada da action             |
| `features/change-password/model/change-password-schema.test.ts`    | Regras do schema (min 8, confirmacao, nova != atual)                       |
| `pages/change-password/ui/change-password-page.test.tsx`           | Render da tela, instrucao, botao "Sair da conta"                           |
| `shared/auth/session-redirect/session-redirect.test.ts`            | `isPasswordChangeRequiredError` + `redirectToPasswordChangeRequired`       |
| `shared/lib/use-server-error` e `shared/api/query-client` (testes) | Redirect para `/change-password` no sinal de 403                           |

---

## 15. Limitacoes e evolucoes futuras

### 15.1 Ja implementado (desde a v1.0 deste doc)

| Recurso                     | Onde                                                              |
| --------------------------- | ----------------------------------------------------------------- |
| Refresh token rotation      | `shared/auth/refresh-session` + retry de 401 no `httpClient`      |
| Interceptor de 401 global   | `httpClient` tenta refresh e, se falhar, sinaliza sessao expirada |
| Feedback de sessao expirada | `SessionGuard` + `SessionExpiredOverlay` + `session-redirect`     |
| Troca de senha obrigatoria  | Secao 3.5 (proxy + `change-password` + rede de seguranca 403)     |
| Hook de permissoes por role | `useAuthPermissions` (`shared/auth/use-auth-permissions`)         |

### 15.2 Limitacoes atuais

| Limitacao                                                         | Impacto                                                                             |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Proxy verifica existencia do cookie + flag, nao validade do token | Token adulterado/expirado nao e detectado no proxy (validacao real fica no backend) |
| Proxy nao diferencia rotas por role                               | Autorizacao por papel depende de backend/UI                                         |
| Nao ha Data Access Layer (DAL)                                    | Server Components nao revalidam sessao antes de carregar dados                      |

### 15.3 Evolucoes planejadas

1. **DAL (Data Access Layer)**: Criar `verifySession()` que valida o token antes de carregar
   dados em Server Components, com `cache()` do React para deduplicar na mesma requisicao.

2. **Protecao por role no proxy**: Expandir o proxy para redirecionar com base na role do cookie
   `suoac-user` (ex: congregacao nao acessa rotas exclusivas de circuito).

3. **Migrar para `unauthorized()` + `unauthorized.tsx`**: quando a flag `experimental.authInterrupts`
   do Next.js estabilizar, substituir o mecanismo de `session-redirect`/`SessionGuard`.
