<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# SUOAC Frontend — Regras para AI Agents

Estas instrucoes se aplicam a qualquer assistente trabalhando neste repositorio frontend.

---

## 1. Stack Tecnologica e Versoes

- **Runtime**: Node.js `v24.x`
- **Package manager**: Yarn `v1.x` (`yarn.lock` e a fonte de verdade)
- **Framework**: Next.js `16.2.6` com App Router
- **React**: `19.2.4`
- **Linguagem**: TypeScript com `strict: true`
- **Server state**: TanStack Query `@tanstack/react-query`
- **Formularios**: React Hook Form + Zod + `@hookform/resolvers`
- **Testes unitarios**: Vitest + React Testing Library + jsdom
- **Arquitetura**: Feature-Sliced Design (FSD)
- **Validador FSD**: Steiger + `@feature-sliced/steiger-plugin`
- **Arquitetura no editor**: ESLint + `eslint-plugin-boundaries`
- **Formatacao**: Prettier
- **Documentacao do projeto**: pasta `docs/`, contendo:
  - `SUOAC_REQUISITOS_v2.md` — requisitos funcionais, regras de negocio e stack prevista
  - `SUOAC_ERD.md` — entidades e relacionamentos do dominio
  - `SUOAC — Identidade Visual Oficial.md` — identidade visual, UX e design system
  - `Design System Overview.png` — referencia visual
  - `SUOAC_ARQUITETURA_FRONTEND_FSD.md` — arquitetura frontend obrigatoria

Antes de implementar qualquer funcionalidade, leia a documentacao relevante em `docs/`.

---

## 2. Next.js 16

Este projeto usa uma versao de Next.js com mudancas relevantes. Nao assuma APIs, convencoes ou
estrutura com base apenas em memoria.

Regras:

- Antes de alterar arquivos do App Router, leia a documentacao local em `node_modules/next/dist/docs/`.
- O App Router fisico fica em `/app`, nao em `src/app`.
- A camada FSD `app` fica em `src/app`.
- O diretorio `/pages` existe apenas como placeholder para evitar uso acidental do Pages Router.
- Arquivos em `/app` devem ser finos: conectar rotas/layouts do Next a pages/providers FSD.
- Componentes sao Server Components por padrao. Use `"use client"` apenas em fronteiras que exigem estado, efeitos, event handlers, browser APIs ou providers client-side.
- Nao marque paginas/layouts inteiros como Client Components se apenas uma parte interativa precisa disso.

Exemplo correto:

```tsx
// app/page.tsx
export { default } from "@/pages/home";
```

---

## 3. Arquitetura e Organizacao (Feature-Sliced Design)

A arquitetura obrigatoria esta documentada em:

```text
docs/SUOAC_ARQUITETURA_FRONTEND_FSD.md
```

### Estrutura de Diretórios

```text
app/                  # Next.js App Router
pages/                # placeholder do Pages Router legado; nao colocar rotas aqui
src/
  app/                # FSD App layer: providers, config, bootstrap, tokens globais
  pages/              # FSD Pages layer: telas de produto
  widgets/            # blocos grandes e autocontidos de UI
  features/           # acoes de usuario com valor de negocio
  entities/           # conceitos de dominio
  shared/             # base tecnica e UI generica
```

### Regra de Dependencia

Uma camada so pode importar camadas abaixo dela:

```text
app
pages
widgets
features
entities
shared
```

Permitido:

```ts
// features -> entities/shared
import { queryKeys } from "@/shared/api";
import { EventStatusChip } from "@/entities/event";
```

Proibido:

```ts
// shared nunca importa dominio
import { EventStatusChip } from "@/entities/event";
```

### Public API

Cada slice deve expor API publica via `index.ts`.

Codigo externo ao slice deve importar pela Public API:

```ts
import { HomePage } from "@/pages/home";
import { createQueryClient } from "@/shared/api";
```

Evite bypass:

```ts
// Errado fora do proprio slice
import { createQueryClient } from "@/shared/api/query-client";
```

Codigo interno do proprio slice deve usar import relativo.

### Organizacao interna de segmentos

Dentro de qualquer segmento (`api`, `auth`, `ui`, `lib`, `model`, `config`), em qualquer camada
(`shared`, `entities`, `features`, `widgets`, `pages`, `app`), cada modulo deve ter seu proprio
subdiretorio com arquivos co-localizados e um `index.ts` como public API do modulo.

Nao deixe arquivos soltos na raiz de um segmento. Agrupe por responsabilidade.

Estrutura correta:

```text
shared/api/
  http-client/
    http-client.ts
    http-client.test.ts
    index.ts
  query-client/
    query-client.ts
    query-keys.ts
    index.ts
  index.ts

features/sign-in/api/
  sign-in-action/
    sign-in-action.ts
    sign-in.dto.ts
    index.ts
  sign-out-action/
    sign-out-action.ts
    index.ts
  index.ts
```

Errado:

```text
shared/api/
  http-client.ts
  http-client.test.ts
  query-client.ts
  query-keys.ts
  types.ts
  index.ts
```

Excecoes:

- Quando um segmento possui apenas um arquivo alem do `index.ts`, o subdiretorio e desnecessario.
  O arquivo pode ficar direto no segmento.
- `shared/ui` nao deve ter `index.ts` na raiz. Como tende a crescer com muitos componentes, um
  barrel re-exportando todos prejudica tree-shaking. Imports devem apontar para o subdiretorio do
  componente: `import { Button } from "@/shared/ui/button"`.

### Cross-imports

Slices da mesma camada nao devem importar uns aos outros.

Proibido:

```text
features/register-payment -> features/enroll-passenger
entities/passenger -> entities/congregation
widgets/event-overview -> widgets/financial-summary
```

Se a composicao for necessaria, mova para uma camada superior.

---

## 4. Validação Arquitetural

O projeto possui duas protecoes:

- **ESLint + `eslint-plugin-boundaries`**: acusa violacoes no editor e em `yarn lint`.
- **Steiger**: valida FSD completo em `yarn architecture:check`.

Regras atuais:

- `shared` nao pode importar `entities`, `features`, `widgets`, `pages` ou `app`.
- `entities` so pode importar `shared`.
- `features` pode importar `entities` e `shared`.
- `widgets` pode importar `features`, `entities` e `shared`.
- `pages` pode importar `widgets`, `features`, `entities` e `shared`.
- `app` pode importar todas as camadas abaixo.

Nunca resolva uma violacao arquitetural com `eslint-disable` sem justificativa tecnica forte e
documentada. A solucao padrao e mover o codigo para a camada correta ou expor uma Public API
adequada.

Observacao: a regra `fsd/insignificant-slice` esta temporariamente desligada no Steiger porque os
slices foram scaffoldados antes da implementacao real.

---

## 5. Server State, API e DTOs

### TanStack Query

- Query client central: `src/shared/api/query-client.ts`
- Provider: `src/app/providers/query-provider.tsx`
- Imports externos devem usar `src/shared/api/index.ts`

Quando queries reais forem criadas:

- Queries reutilizaveis por entidade ficam em `entities/{entity}/api`.
- Mutations ficam perto do caso de uso em `features/{feature}/api`.
- Infra comum fica em `shared/api`.

Exemplos:

```text
entities/event/api/event.queries.ts
features/register-payment/api/register-payment.mutation.ts
shared/api/query-client.ts
```

### HTTP Client

- O cliente HTTP fica em `src/shared/api/http-client/`.
- Paths de API sao valores de dominio e devem ser centralizados em `endpoints.ts`, nunca usados
  como strings soltas no codigo. Novos endpoints devem ser adicionados ao objeto `endpoints`.

```ts
// Correto
import { httpClient, endpoints } from "@/shared/api/http-client";
await httpClient(endpoints.auth.login, { method: "POST", body });

// Errado
await httpClient("/auth/login", { method: "POST", body });
```

- Metodos HTTP (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) sao um conjunto fixo e padrao do
  protocolo. Devem ser usados como string literal diretamente, sem constantes ou enums. O tipo
  `HttpMethod` no client ja restringe os valores aceitos em compilacao.

```ts
// Correto — string literal restrita pelo tipo HttpMethod
await httpClient(endpoints.auth.login, { method: "POST", body });

// Errado — nao criar objetos/enums para metodos HTTP
HttpMethod.POST; // desnecessario
```

### DTOs e Mappers

- DTO e a forma do backend.
- Model e a forma usada no frontend.
- DTOs e mappers devem ficar perto do request que os consome.
- Nao espalhe tipos de backend por componentes.
- Nao crie `shared/types`.

### Formularios

- Use React Hook Form + Zod + `zodResolver`.
- Formularios com React Hook Form devem ser Client Components e declarar `"use client"`.
- Schema especifico de uma feature fica em `features/{feature}/model`.
- Schema de uma page simples fica em `pages/{page}/model`.
- Schema de entidade reutilizavel fica em `entities/{entity}/model`.
- Nao crie pasta global `schemas`.
- Nao coloque regras reutilizaveis diretamente no componente.
- Derive tipos com `z.infer` sempre que possivel.

Exemplo de organizacao:

```text
src/features/register-payment/
  ui/register-payment-form.tsx
  model/register-payment-schema.ts
  api/register-payment.mutation.ts
```

---

## 6. UI, Design System e UX

Baseie UI e copy visual nos documentos:

- `docs/SUOAC — Identidade Visual Oficial.md`
- `docs/Design System Overview.png`

Diretrizes:

- Mobile-first.
- Interface operacional, clara e densa o bastante para uso real.
- Evite landing page quando a solicitacao for criar funcionalidade do sistema.
- Use linguagem do dominio SUOAC nos componentes de dominio.
- Componentes genericos ficam em `shared/ui`.
- Componentes com regra/semantica de dominio ficam em `entities`, `features` ou `widgets`.
- Nao use `components/`, `hooks/`, `utils/`, `services/` como pastas genericas na raiz.
- A estrategia de estilo padrao e CSS Modules + CSS Custom Properties.
- Nao adicione `styled-components` sem nova decisao arquitetural explicita.
- Estilos de componente devem ficar co-localizados em `*.module.css`.
- Nao espalhe valores visuais soltos em componentes ou CSS Modules (`#1f6e5a`, `24px`, sombras,
  radius, z-index, alturas de controles, etc.) quando eles representarem uma decisao de design.
- Se um valor visual for reutilizavel, semantico ou parte do design system, crie/atualize o token
  correspondente em `app/globals.css` e em `src/app/styles/theme-tokens.ts`.
- CSS Modules devem consumir tokens via `var(--suoac-...)` sempre que possivel.
- Valores locais so sao aceitaveis quando forem especificos de layout daquele componente e nao
  tiverem significado reutilizavel no design system.

Tokens atuais ficam em:

```text
app/globals.css
src/app/styles/theme-tokens.ts
```

---

## 7. Estilo de Codigo, Tipagem e Lint

- TypeScript em strict mode.
- Nao use `any`.
- Prefira `import type` para imports apenas de tipo.
- Funcoes exportadas com logica relevante devem ter retorno claro/inferivel; se a inferencia ficar
  ambigua, anote explicitamente.
- Nao deixe imports, variaveis ou parametros sem uso.
- Nao crie barrel exports globais que exportam tudo sem criterio.
- Nao use `console.log` em codigo de producao frontend.
- Use nomes em kebab-case para arquivos e pastas.
- Componentes e tipos usam PascalCase.
- Hooks usam camelCase com prefixo `use`.

### Prettier

O padrao real do projeto esta em `.prettierrc.json`.

Nao gere codigo fora desse padrao. Rode `yarn format` quando necessario.

---

## 8. Testes

O projeto esta configurado inicialmente apenas com testes unitarios.

- Framework: Vitest.
- DOM/testing: React Testing Library + jsdom.
- Setup global: `tests/setup/vitest.setup.ts`.
- Testes devem ser co-localizados com o arquivo testado.
- Padrao de nome: `*.test.ts` ou `*.test.tsx`.

Exemplo:

```text
src/pages/home/ui/home-page.tsx
src/pages/home/ui/home-page.test.tsx
```

Regras:

- Toda logica de negocio implementada deve ter teste unitario correspondente.
- Testes devem descrever comportamento esperado em portugues quando forem de negocio.
- Nao use `.skip` para esconder teste quebrado.
- Nao adicione testes de integracao ou E2E sem decisao explicita. Eles foram deixados fora por
  enquanto para reduzir complexidade inicial.

Scripts:

```bash
yarn test          # watch mode do Vitest
yarn test:unit     # vitest run
yarn test:coverage # coverage com V8
```

---

## 9. Scripts Obrigatorios

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

## 10. Conventional Commits

Ao gerar mensagens de commit, use Conventional Commits em portugues e no imperativo:

- `feat(events): adiciona listagem de eventos`
- `fix(auth): corrige redirecionamento apos login`
- `chore(deps): atualiza dependencias de teste`
- `refactor(fsd): reorganiza slices de passageiros`
- `test(payment): adiciona testes de calculo de pagamento`

---

## 11. Fluxo de Trabalho para AI Assistant

Quando solicitado para implementar uma funcionalidade:

1. Leia os documentos relevantes em `docs/`.
2. Se tocar Next.js, consulte `node_modules/next/dist/docs/`.
3. Defina a camada FSD correta antes de criar arquivos.
4. Exponha apenas o necessario via `index.ts`.
5. Preserve a regra de dependencia entre camadas.
6. Adicione teste unitario co-localizado para logica nova.
7. Atualize `docs/SUOAC_ARQUITETURA_FRONTEND_FSD.md` se a arquitetura mudar.
8. Atualize `README.md` se mudar setup, dependencias, scripts ou instrucoes.
9. Rode `yarn run check` antes de concluir.

Nao implemente atalhos que enfraquecam type safety, lint, arquitetura ou testes. Se uma regra
parecer inadequada, explique o motivo e proponha ajuste explicito em vez de contornar localmente.
