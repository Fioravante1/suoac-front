<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# SUOAC Frontend — regras para agentes de IA

Este arquivo e a porta de entrada. As regras detalhadas vivem em `.claude/rules/` (referenciadas
tambem por `.agents/rules.json` para o Gemini / Antigravity) — ver o indice abaixo.

**Obrigatorio para agentes sem injecao automatica de `.claude/rules/` (como OpenAI Codex e Gemini
CLI):** antes de planejar ou editar qualquer arquivo, **leia explicitamente com sua ferramenta de
leitura** as regras sempre ativas (`.claude/rules/redesign.md` e `.claude/rules/compartilhado/*.md`)
e os arquivos de `.claude/rules/` correspondentes aos caminhos listados nas tabelas da secao 2.

---

## 1. Stack Tecnologica e Versoes

- **Runtime**: Node.js `v24.x`
- **Package manager**: Yarn `v1.x` (`yarn.lock` e a fonte de verdade)
- **Framework**: Next.js `16.4.2` com App Router
- **React**: `19.2.4`
- **Linguagem**: TypeScript com `strict: true`
- **Server state**: TanStack Query `@tanstack/react-query`
- **Formularios**: React Hook Form + Zod + `@hookform/resolvers`
- **Testes unitarios**: Vitest + React Testing Library + jsdom
- **Arquitetura**: Feature-Sliced Design (FSD)
- **Validador FSD**: Steiger + `@feature-sliced/steiger-plugin`
- **Arquitetura no editor**: ESLint + `eslint-plugin-boundaries`
- **Formatacao**: Prettier
- **Documentacao do projeto**: pasta `docs/`, organizada em:
  - `docs/product/SUOAC_REQUISITOS_v2.md` — requisitos funcionais, regras de negocio e stack prevista
  - `docs/product/SUOAC_ERD.md` — entidades e relacionamentos do dominio
  - `docs/product/hus/` — historias de usuario
  - `docs/design/SUOAC — Identidade Visual Oficial.md` — identidade visual, UX e design system
  - `docs/design/Design System Overview.png` — referencia visual
  - `docs/architecture/SUOAC_ARQUITETURA_FRONTEND_FSD.md` — arquitetura frontend obrigatoria
  - `docs/architecture/SUOAC_ESTRATEGIA_REDESIGN.md` — estrategia do redesign incremental em curso
  - `docs/architecture/SUOAC_AUTENTICACAO.md` — fluxo de autenticacao
  - `docs/integration/` — guias de integracao com APIs externas

Antes de implementar qualquer funcionalidade, leia a documentacao relevante em `docs/`.

---

## 2. Onde as regras vivem

Cada arquivo em `.claude/rules/` declara no proprio frontmatter os caminhos (`paths:`) e gatilhos
(`trigger:` / `description:`) que o ativam. Mexer em CSS nao carrega as regras de teste; mexer em
teste nao carrega o design system. Se o seu runtime nao injeta `.claude/rules/` automaticamente,
**abra e leia** os arquivos aplicaveis antes de escrever codigo:

| Regra (`.claude/rules/`) | Vale para                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| `arquitetura-fsd.md`     | `src/**`, `app/**`, `pages/**`                                                                            |
| `next-16.md`             | arquivos de rota do App Router (`page.tsx`, `layout.tsx`, `route.ts`…), `middleware.ts`, `next.config.ts` |
| `server-state-e-api.md`  | segmentos `api/` e `model/`, `shared/api`, `shared/lib`                                                   |
| `formularios.md`         | segmentos `ui/` e `model/`                                                                                |
| `ui-e-design-system.md`  | `ui/`, `shared/ui`, CSS Modules, tokens                                                                   |
| `tema-claro-e-escuro.md` | CSS Modules, `globals.css`, tokens                                                                        |
| `animacao.md`            | CSS Modules, `globals.css`, tokens                                                                        |
| `estilo-de-codigo.md`    | `**/*.{ts,tsx}`                                                                                           |
| `testes-unitarios.md`    | `**/*.test.{ts,tsx}`, setup, modulos `*-testing/`                                                         |
| `testes-e2e.md`          | `tests/e2e/**`, `playwright.config.ts`                                                                    |
| `redesign.md`            | sempre — e a estrategia em curso                                                                          |

O subdiretorio `.claude/rules/compartilhado/` vem do repositorio `suoac-ai` por `git subtree` e traz
o que vale igual no backend e no frontend. **Nao edite esses arquivos aqui** — a fonte e
`suoac-ai/rules/`, e a proxima sincronizacao sobrescreve qualquer mudanca local:

| Regra (`.claude/rules/compartilhado/`) | Vale para                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `postura-do-agente.md`                 | sempre — decisoes sao do usuario, dependencias pendentes e verificacao obrigatoria            |
| `jira.md`                              | sempre — rastreamento obrigatorio de cards no projeto `SUC`                                   |
| `branches-e-prs.md`                    | sempre — nome de branch, template de PR e regra de so commitar quando pedido explicitamente   |
| `commits.md`                           | sempre — Conventional Commits em portugues, organizacao por significado, sem trailer de IA    |
| `idioma-do-codigo.md`                  | `**/*.{ts,tsx}`, `**/*.{js,mjs,cjs}` — identificadores em ingles, textos humanos em portugues |
| `aninhamento-e-ternarios.md`           | `**/*.{ts,tsx}` — early returns obrigatorios, proibido `if` ou ternario aninhado              |

Para feature flags (`flags/next`, `@vercel/flags-core`), consulte tambem a skill em
`.claude/skills/flags-sdk/SKILL.md` (espelhada em `.agents/skills/flags-sdk/SKILL.md`).

---

## 3. Scripts obrigatorios

Antes de finalizar mudancas de codigo, rode:

```bash
yarn run check
```

Esse comando executa:

```bash
yarn typecheck
yarn lint
yarn architecture:check
yarn test:unit
yarn format:check
```

Atalhos:

```bash
yarn validate
yarn architecture:check
yarn lint:fix
yarn format
```

Observacao: em Yarn v1, `yarn check` pode chamar um comando interno do Yarn. Prefira
`yarn run check` ou `yarn validate`.

---

## 4. Fluxo de trabalho

Quando solicitado para implementar uma funcionalidade:

1. Localize (ou crie) o card no Jira e mova para `Em andamento` — ver `compartilhado/jira.md`.
2. Leia os documentos relevantes em `docs/`.
3. Se tocar Next.js, consulte `node_modules/next/dist/docs/`.
4. Defina a camada FSD correta antes de criar arquivos, e exponha apenas o necessario via `index.ts`.
5. Adicione teste unitario co-localizado para todo artefato novo.
6. Atualize `docs/architecture/SUOAC_ARQUITETURA_FRONTEND_FSD.md` se a arquitetura mudar, e o
   `README.md` se mudar setup, dependencias, scripts ou instrucoes.
7. Rode `yarn run check` antes de concluir.
8. Comente no card o que foi entregue e atualize o estado dele.

Nao implemente atalhos que enfraquecam type safety, lint, arquitetura ou testes. Se uma regra
parecer inadequada, explique o motivo e proponha o ajuste explicito no arquivo de regra em vez de
contornar localmente.
