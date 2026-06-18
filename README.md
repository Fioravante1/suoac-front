# SUOAC Frontend

Frontend do **SUOAC — Sistema Unificado de Ônibus para Assembleias e Congressos**.

O projeto implementa a interface web responsiva do sistema, com foco mobile-first, organização
operacional, controle de eventos, passageiros, pagamentos e dashboards.

---

## Stack

- Node.js `v24.x`
- Yarn `v1.x`
- Next.js `16.2.6` com App Router
- React `19.2.4`
- TypeScript com `strict: true`
- TanStack Query para server state
- React Hook Form + Zod para formulários
- CSS Modules + CSS Custom Properties para estilos
- Vitest + React Testing Library para testes unitários
- ESLint Flat Config + Prettier
- Feature-Sliced Design validado com Steiger
- `eslint-plugin-boundaries` para feedback arquitetural no editor

---

## Documentação

Leia estes arquivos antes de implementar funcionalidades:

- [Requisitos](docs/product/SUOAC_REQUISITOS_v2.md)
- [ERD](docs/product/SUOAC_ERD.md)
- [Identidade Visual](docs/design/SUOAC%20%E2%80%94%20Identidade%20Visual%20Oficial.md)
- [Arquitetura Frontend FSD](docs/architecture/SUOAC_ARQUITETURA_FRONTEND_FSD.md)

Para alterações no Next.js, consulte também a documentação local instalada:

```bash
node_modules/next/dist/docs/
```

---

## Instalação

```bash
yarn install
```

---

## Desenvolvimento

```bash
yarn dev
```

A aplicação roda em:

```text
http://localhost:3000
```

---

## Variáveis de ambiente

Definidas em `.env.local` (local) e no painel da Vercel (deploy). Variáveis sem o
prefixo `NEXT_PUBLIC_` só existem no servidor.

| Variável         | Descrição                                                               |
| ---------------- | ----------------------------------------------------------------------- |
| `API_BASE_URL`   | URL base da API backend.                                                |
| `SESSION_SECRET` | Segredo HMAC que assina o cookie de sessão (`suoac-user`). Ver abaixo.  |
| `FLAGS`          | Chave do Vercel Flags usada pelo `vercelAdapter()`. Gerada pela Vercel. |
| `FLAGS_SECRET`   | Segredo do Flags SDK (Flags Explorer e precompute). Gerado pela Vercel. |

`FLAGS` e `FLAGS_SECRET` são sincronizadas com `vercel env pull`.

### `SESSION_SECRET`

O cookie de sessão do usuário é assinado com HMAC-SHA256 para ser à prova de
adulteração (impede editar `circuitId`/`role` no navegador para escalar acesso).
É **obrigatório** em todos os ambientes; sem ele o login falha e nenhuma sessão é
considerada válida (fail-closed).

Gere um valor aleatório forte e cadastre na Vercel (Production, Preview e
Development) e no seu `.env.local`:

```bash
node -e 'console.log(require("crypto").randomBytes(32).toString("base64url"))'
```

> Trocar o valor invalida todas as sessões ativas (usuários precisam logar de novo).

## Feature flags

Usamos o [Flags SDK](https://flags-sdk.dev) (`flags/next`) com o provedor **Vercel Flags**
(`@flags-sdk/vercel`). As flags são declaradas em `src/shared/feature-flags/`,
expostas via `@/shared/feature-flags` e avaliadas server-side (`await flag()`).
Por dependerem de APIs server-only (`async_hooks`), são mantidas fora de `@/shared/config`
(consumido por Client Components) e só devem ser importadas em Server Components.

| Flag                      | Tipo    | Descrição                                                                                    |
| ------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| `SHOW_PENDING_MENU_ITEMS` | boolean | Exibe itens de menu cujas páginas ainda não foram implementadas (Financeiro, Configurações). |

Os valores das flags são gerenciados no painel do Vercel Flags (ou via `vercel flags`),
por ambiente (production/preview/development).

---

## Arquitetura

O projeto segue **Feature-Sliced Design**.

```text
app/                  # Next.js App Router
pages/                # placeholder para evitar uso do Pages Router legado
src/
  app/                # FSD App layer: providers, config, bootstrap, tokens
  pages/              # FSD Pages layer: telas de produto
  widgets/            # blocos grandes de interface
  features/           # ações de usuário com valor de negócio
  entities/           # conceitos de domínio
  shared/             # base técnica e UI genérica
```

Regra de dependência:

```text
app -> pages -> widgets -> features -> entities -> shared
```

Arquivos em `/app` devem ser finos e apenas conectar rotas do Next às pages FSD.

Exemplo:

```tsx
// app/(private)/dashboard/page.tsx
export { default } from "@/pages/dashboard";
```

---

## Validação Arquitetural

O projeto usa duas camadas de validação:

- `eslint-plugin-boundaries`: acusa violações no editor e em `yarn lint`
- Steiger: valida FSD em `yarn architecture:check`

Rodar validação arquitetural:

```bash
yarn architecture:check
```

---

## Scripts

```bash
yarn dev                 # inicia o servidor de desenvolvimento
yarn build               # build de produção
yarn start               # inicia build de produção
yarn lint                # ESLint
yarn lint:fix            # ESLint com autofix
yarn format              # formata com Prettier
yarn format:check        # checa formatação
yarn typecheck           # TypeScript sem emit
yarn test                # Vitest em watch mode
yarn test:unit           # testes unitários em modo run
yarn test:coverage       # cobertura de testes
yarn architecture:check  # valida FSD com Steiger
yarn run check           # validação completa
yarn validate            # alias seguro para yarn run check
```

Observação: em Yarn v1, `yarn check` pode chamar um comando interno do Yarn. Use `yarn run check`
ou `yarn validate`.

---

## Testes

Nesta fase inicial, o projeto usa apenas testes unitários.

Regras:

- Testes co-localizados com o arquivo testado
- Padrão: `*.test.ts` ou `*.test.tsx`
- Setup global em `tests/setup/vitest.setup.ts`

Exemplo:

```text
src/pages/home/ui/home-page.tsx
src/pages/home/ui/home-page.test.tsx
```

---

## Fluxo de Trabalho

### Branches

O projeto usa duas branches protegidas:

- **`main`** — branch de produção. Recebe merges apenas de `develop`.
- **`develop`** — branch de desenvolvimento. Toda nova tarefa parte dela.

Para trabalhar em uma funcionalidade ou correção:

1. Crie uma branch a partir de `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/minha-feature
   ```
2. Desenvolva, faça commits e rode `yarn run check` antes de finalizar.
3. Abra um PR para `develop`.
4. Após aprovação e merge em `develop`, abra um PR de `develop` para `main` quando for
   preparar uma release.

### Proteção de branches

As branches `main` e `develop` possuem as seguintes regras:

| Regra               | Descrição                                           |
| ------------------- | --------------------------------------------------- |
| PR obrigatório      | Não é permitido push direto; todo merge requer PR   |
| Revisão obrigatória | PRs de colaboradores precisam de aprovação do owner |
| Force push restrito | Apenas o owner do repositório pode fazer force push |

PRs abertos pelo owner do repositório não precisam de revisor.

### CI (GitHub Actions)

Todo push e PR para `main` ou `develop` aciona a pipeline de CI, que executa 5 jobs:

```text
lint ──────────┐
typecheck ─────┤
test ──────────┼──▶ build (só roda se todos passarem)
architecture ──┘
```

- **lint** — ESLint + Prettier (`yarn lint` + `yarn format:check`)
- **typecheck** — TypeScript (`yarn typecheck`)
- **test** — Vitest com coverage (`yarn test:coverage`)
- **architecture** — Steiger FSD (`yarn architecture:check`)
- **build** — Next.js production build (`yarn build`), executa somente após os 4 checks

A configuração fica em `.github/workflows/ci.yml`.

---

## Qualidade

Antes de concluir qualquer alteração de código, rode:

```bash
yarn run check
```

Esse comando executa:

- TypeScript
- ESLint
- Steiger
- Vitest
- Prettier check

---

## Regras Para Assistentes

As instruções de trabalho para agentes ficam em:

- [AGENTS.md](AGENTS.md)
- [CLAUDE.md](CLAUDE.md)
- [GEMINI.md](GEMINI.md)
