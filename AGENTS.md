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
docs/architecture/SUOAC_ARQUITETURA_FRONTEND_FSD.md
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

### Invalidacao de cache e atualizacao do Dashboard

- Toda mutation deve invalidar as queries cujo dado ela alterou. Apos `mutateAsync`/`mutate` com
  sucesso, chame `queryClient.invalidateQueries({ queryKey: queryKeys.X })` para cada conjunto de
  dados afetado. Nao confie em `staleTime` para "consertar sozinho": com `refetchOnWindowFocus`
  desligado e `staleTime` de 60s, dados em cache permanecem defasados ate o usuario recarregar.
- **O Dashboard agrega dados produzidos em outras telas** (inscricoes, pagamentos, dias, etc.). Por
  isso vale a regra obrigatoria: **sempre que uma acao em qualquer lugar do sistema alterar um dado
  que o Dashboard exibe ou agrega, a mutation correspondente deve invalidar `queryKeys.dashboard.all`**
  (alem das queries diretas da propria tela).
- Isso inclui, no minimo: inscrever/remover passageiro em evento, editar dias da inscricao, registrar
  ou remover pagamento, e qualquer mudanca em valores financeiros, contagens ou status que componham
  os cards/graficos do Dashboard. Na duvida sobre se um dado aparece no Dashboard, invalide.
- O Dashboard normalmente esta fora de tela no momento da acao. `invalidateQueries` marca a query
  como stale e o refetch acontece ao remontar (quando o usuario volta), entao a invalidacao funciona
  mesmo sem a tela montada — nao tente "atualizar na mao" nem forcar navegacao.
- Centralize as invalidacoes de uma feature em uma unica funcao `invalidateQueries()` local e
  reutilize-a em todos os `onSuccess` daquela feature, para nao esquecer nenhum conjunto de dados.

```ts
// Exemplo: mutation que afeta a tela atual E o Dashboard
function invalidateQueries() {
  queryClient.invalidateQueries({ queryKey: queryKeys.eventPassengers.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(event.id) });
  // Obrigatorio: o Dashboard agrega contagens/valores das inscricoes.
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
}
```

### Paginacao

- Listas paginadas devem usar `usePagination` de `@/shared/lib` em vez de `useState(1)` local para controlar pagina. Use `setPage` como handler de `Pagination` e `reset()` quando filtros, busca ou contexto da lista precisarem voltar para a primeira pagina.

### Formatadores reutilizaveis

- Formatadores genericos e reutilizaveis devem ficar em bibliotecas focadas dentro de `shared/lib`, como `shared/lib/date` e `shared/lib/currency`, e ser consumidos via `@/shared/lib`. Nao duplique `Intl.DateTimeFormat` ou `Intl.NumberFormat` em pages, widgets, features ou entities quando o formato for compartilhado.

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

### DTOs, Models e Valores de Dominio

- DTO e a forma do backend.
- Model e a forma usada no frontend.
- DTOs e mappers devem ficar perto do request que os consome.
- Nao espalhe tipos de backend por componentes.
- Nao crie `shared/types`.
- Valores de dominio fechados devem ter uma unica fonte de verdade na entidade dona do conceito,
  normalmente em `entities/{entity}/model`, e devem ser expostos pela Public API da entidade.
- Status, tipos, estados, papeis especificos de dominio, labels e variantes visuais derivadas desses
  valores nao devem ficar como strings soltas em pages, features, widgets ou testes. Crie constantes
  tipadas como `EVENT_STATUSES`, `EVENT_TYPES`, `EVENT_STATUS_LABELS` e `EVENT_STATUS_BADGE_VARIANTS`
  no model da entidade correspondente.
- Use essas constantes em schemas Zod, DTO mappers, Server Actions, componentes e testes. Assim, o
  contrato do dominio fica centralizado e mudancas futuras nao exigem procurar literais espalhados.
- Excecao: metodos HTTP continuam sendo string literals diretamente, conforme regra da secao HTTP
  Client. Eles pertencem ao protocolo, nao ao dominio SUOAC.

### Formularios

- Use React Hook Form + Zod + `zodResolver`.
- Qualquer UI que colete e submeta dados do usuario deve ser modelada como formulario com React Hook Form, mesmo quando for simples (ex.: selecao de checkboxes em modal). Evite `useState` para armazenar valores de campos submetidos; reserve `useState` para estado visual ou de controle que nao faz parte do payload.
- Formularios com React Hook Form devem ser Client Components e declarar `"use client"`.
- Schema especifico de uma feature fica em `features/{feature}/model`.
- Schema de uma page simples fica em `pages/{page}/model`.
- Schema de entidade reutilizavel fica em `entities/{entity}/model`.
- Nao crie pasta global `schemas`.
- Nao coloque regras reutilizaveis diretamente no componente.
- Derive tipos com `z.infer` sempre que possivel.
- Erros de servidor em formularios, modais e fluxos de submissao devem usar `useServerError` de `@/shared/lib` em vez de `useState<string | null>(null)` local para `serverError`. Use `clearServerError()` antes de reenviar ou fechar e `showServerError(error, fallbackMessage?)` para exibir a falha com fallback humano.

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

- `docs/design/SUOAC — Identidade Visual Oficial.md`
- `docs/design/Design System Overview.png`

**Antes de construir qualquer interface, leia esses dois documentos.** Eles sao a fonte de verdade
para cores, tipografia, espacamento, radius, iconografia e tom visual.

### Mentalidade de construcao

Toda interface deve ser construida com mentalidade de UX senior. Nao basta funcionar — deve ser
bonita, clara, intuitiva e agradavel de usar. O SUOAC e um sistema operacional real usado por
coordenadores; a interface deve transmitir organizacao, confianca e modernidade.

Referencia visual: Material 3, Linear, Stripe, Notion, Google Workspace.

Principios obrigatorios:

- **Desktop-first**: telas novas sao projetadas para desktop, com largura minima de 1280px.
  A regra anterior de mobile-first foi **descontinuada** em 09/10/2026. O SUOAC e operado por
  coordenadores sentados, planejando viagem; o uso em celular e pontual e sera tratado como um
  recorte proprio, com as funcionalidades essenciais de campo, **depois** do redesign (ver
  `docs/architecture/SUOAC_ESTRATEGIA_REDESIGN.md`, Fatia 10). Nao gaste esforco adaptando telas
  novas para telas pequenas enquanto o redesign estiver em andamento, e **nao altere** a
  responsividade das telas ainda nao redesenhadas.
- **Minimalismo funcional**: cada elemento deve ter proposito. Remova o que nao agrega.
- **Espacamento generoso**: usar a escala oficial (4, 8, 12, 16, 20, 24, 32, 40, 48px). Nunca
  comprimir conteudo. Ar entre elementos transmite clareza.
- **Hierarquia visual clara**: titulos, subtitulos, labels e body devem seguir a escala tipografica
  do design system (H1 32px/700, H2 24px/700, H3 20px/600, Body 16px/400, Small 14px/400,
  Labels 13px/600).
- **Cards como unidade base**: o sistema e fortemente baseado em cards (fundo branco, radius 20px,
  sombra leve, padding generoso). Prefira cards a tabelas brutas sempre que o conteudo permitir.
- **Cores semanticas**: use a paleta oficial para comunicar significado. Verde = sucesso/ativo,
  amarelo = atencao/parcial, vermelho = erro/pendente, azul = informacao/link. Nunca use cor
  apenas como decoracao.

### Experiencia do usuario

O objetivo e uso rapido, com poucos cliques e baixa carga cognitiva. Sempre que construir uma
interface, pergunte: "como posso tornar isso mais facil e agradavel para o usuario?"

Padroes obrigatorios:

- **Empty states**: nunca deixe uma tela vazia sem orientacao. Quando uma lista, tabela ou secao
  nao tem dados, exiba um empty state com icone relevante (Lucide, outline), mensagem explicativa
  e, quando aplicavel, uma acao primaria (ex: botao "Criar primeiro evento"). O empty state deve
  orientar o usuario sobre o que fazer, nao apenas dizer "nenhum resultado".
- **Feedback instantaneo**: toda acao do usuario deve ter resposta visual imediata. Botoes devem
  mostrar estado de loading ao submeter. Formularios devem exibir validacao inline conforme o
  usuario digita (nao apenas no submit). Acoes concluidas devem confirmar sucesso com toast ou
  mensagem visual.
- **Estados de erro com recuperacao**: mensagens de erro devem ser humanas e indicar como resolver.
  Evite textos tecnicos ("Error 500"). Prefira "Nao foi possivel salvar. Verifique sua conexao e
  tente novamente." Sempre ofereça um caminho de recuperacao (botao de retry, link para suporte).
- **Confirmacao para acoes destrutivas**: exclusoes e acoes irreversiveis devem exigir confirmacao
  via dialog. O dialog deve descrever claramente a consequencia e usar botao vermelho para a acao
  destrutiva.
- **Transicoes e micro-interacoes**: use transicoes CSS suaves (150–250ms) para hover, focus,
  abertura de modais e mudancas de estado. Evite transicoes longas ou chamativas. O objetivo e
  fluidez, nao espetaculo.
- **Hover e focus visiveis**: todo elemento interativo deve ter estados hover e focus distintos.
  Focus deve ser visivel para acessibilidade (outline ou ring). Hover deve ser sutil (mudanca de
  background ou opacidade).
- **Areas de toque generosas**: no mobile, botoes e alvos de toque devem ter no minimo 44x44px.
  Inputs devem ser grandes e mobile-friendly. Evite alvos de toque pequenos ou proximos demais.
- **Informacao progressiva**: nao sobrecarregue o usuario com tudo de uma vez. Use expansoes,
  tooltips, popovers ou secoes colapsaveis para informacoes secundarias. Mostre o essencial
  primeiro e permita aprofundar sob demanda.

### Organizacao tecnica

- Componentes genericos ficam em `shared/ui`.
- Componentes com regra/semantica de dominio ficam em `entities`, `features` ou `widgets`.
- Nao use `components/`, `hooks/`, `utils/`, `services/` como pastas genericas na raiz.
- Use linguagem do dominio SUOAC nos componentes de dominio.
- Evite landing page quando a solicitacao for criar funcionalidade do sistema.
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

### Iconografia

- Biblioteca padrao: Lucide Icons (estilo outline, minimalista).
- Icones complementam texto e ajudam na escaneabilidade. Use em botoes de acao, headers de cards,
  empty states, itens de navegacao e badges de status.
- Nao use icones decorativos sem significado. Cada icone deve reforcar a compreensao do elemento.
- Nao use emojis na interface do sistema. Prefira sempre icones Lucide.

### Padrao de feedback de carregamento

- **Skeleton** (`shared/ui/skeleton`): usar para carregamento de paginas, listas, tabelas e blocos
  de conteudo. O Skeleton mostra placeholders animados no formato aproximado do conteudo que sera
  exibido, transmitindo progresso sem layout shift.
- **Spinner** (`shared/ui/spinner`): usar apenas em acoes pontuais e inline, como botoes de salvar,
  enviar formulario ou confirmar exclusao. Nao usar Spinner como indicador de carregamento de
  pagina inteira.

Exemplos corretos:

```tsx
// Carregamento de lista — Skeleton
{
  isLoading && <SkeletonTableRows rows={5} />;
}

// Botao de salvar — Spinner
<Button disabled={isPending}>{isPending ? <Spinner size="small" /> : "Salvar"}</Button>;
```

### Tabelas de dados

- Tabelas que renderizam listas de dados devem usar `DataTable` de `shared/ui/data-table`, nunca
  montar `TableHeader`/`TableRow`/`TableHead`/`TableCell` manualmente.
- Defina as colunas com `ColumnDef<T>[]` de forma declarativa. Cada coluna tem `id`, `header`,
  `cell(item)` e, opcionalmente, `visible`, `headerClassName` e `cellClassName`.
- Use `visible` para colunas condicionais em vez de `{condition && <TableHead>}`.
- Os primitivos de `shared/ui/table` (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`,
  `TableCell`, `TableWrapper`) existem como base interna. Codigo de produto deve consumir
  `DataTable`, nao os primitivos diretamente.

```tsx
// Correto — declarativo via DataTable
import { DataTable, type ColumnDef } from "@/shared/ui/data-table";

const columns: ColumnDef<Item>[] = [
  { id: "name", header: "Nome", cell: (item) => item.name },
  { id: "status", header: "Status", cell: (item) => <Badge>{item.status}</Badge> },
  { id: "extras", header: "Extras", cell: (item) => item.extras, visible: showExtras },
];

<DataTable columns={columns} data={items} getRowKey={(item) => item.id} />;
```

```tsx
// Errado — montar primitivos manualmente em codigo de produto
<TableHeader>
  <TableRow>
    <TableHead>Nome</TableHead>
    <TableHead>Status</TableHead>
  </TableRow>
</TableHeader>
```

### Checklist visual

Antes de concluir qualquer interface nova, verifique:

- [ ] Segue a paleta de cores e tokens do design system?
- [ ] Tipografia respeita a hierarquia (H1/H2/H3/Body/Small/Labels)?
- [ ] Espacamento usa a escala oficial (4–48px)?
- [ ] Border radius usa a escala oficial (8, 12, 16, 20px)?
- [ ] Tem empty state quando a lista/tabela pode estar vazia?
- [ ] Tem feedback de loading (Skeleton ou Spinner conforme o caso)?
- [ ] Tem feedback de sucesso e erro para acoes do usuario?
- [ ] Acoes destrutivas pedem confirmacao?
- [ ] Estados hover e focus sao visiveis?
- [ ] Funciona bem no mobile (areas de toque, layout responsivo)?
- [ ] Icones sao Lucide, outline, e reforçam o significado?

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
- Evite blocos `if` aninhados ("nested ifs"). Prefira sempre o uso de "early returns" (retorno antecipado) para manter o codigo limpo, legivel e reduzir a complexidade ciclomatica.
- **Identificadores de codigo sao sempre em ingles**: nomes de funcoes, variaveis, parametros,
  tipos, propriedades, constantes e chaves de objeto. O portugues fica para o que e lido por
  pessoas — comentarios, textos de interface, mensagens de erro e descricoes de teste
  (`describe`/`it`). Nao misture os dois num mesmo identificador.

```ts
// Correto
function getAppliedTheme(): ResolvedTheme {}
const paymentStatus = "paid";
it("volta para o claro quando o tema escolhido é escuro", () => {});

// Errado
function temaVigente(): TemaResolvido {}
const statusPagamento = "pago";
```

- Use nomes em kebab-case para arquivos e pastas.
- Componentes e tipos usam PascalCase.
- Hooks usam camelCase com prefixo `use`.

### Prettier

O padrao real do projeto esta em `.prettierrc.json`.

Nao gere codigo fora desse padrao. Rode `yarn format` quando necessario.

---

## 8. Testes

O projeto tem duas camadas de teste, **ambas obrigatorias**:

- **Unitario** — Vitest + React Testing Library + jsdom, co-localizado com o codigo.
- **End-to-end** — Playwright, em `tests/e2e/` (ver subsecao propria).

### Testes unitarios

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

- **Todo artefato novo deve ter teste unitario co-localizado**, sem excecao:
  - **Componentes** (`*.tsx`): renderizacao, props, estados visuais e interacoes.
  - **Hooks** (`use*.ts`): comportamento do estado inicial, transicoes e valores retornados.
  - **Funcoes utilitarias e servicos** (`*.ts`): casos normais, bordas e erros esperados.
- Testes devem descrever comportamento esperado em portugues quando forem de negocio.
- Nao use `.skip` para esconder teste quebrado.

Scripts:

```bash
yarn test          # watch mode do Vitest
yarn test:unit     # vitest run
yarn test:coverage # coverage com V8
```

### Repeticao em testes: o que extrair e o que manter

Teste nao segue DRY da mesma forma que codigo de producao. O corpo de um teste precisa contar a
historia inteira — quem le tem que entender o caso sem pular para outro arquivo. Extrair demais
produz testes que passam, falham e ninguem sabe por que.

**Extraia** o setup mecanico que se repete entre arquivos e nao diz nada sobre o caso: stubs de
ambiente (`matchMedia`, `fetch`, relogio), limpeza de estado global, e o wrapper de `render` com os
providers necessarios.

**Mantenha no teste** o que da sentido ao caso: o cenario sendo montado, os dados relevantes e todos
os `expect`. Se o nome do teste diz "quando o sistema operacional esta em escuro", a linha que
coloca o sistema em escuro pertence ao teste, nao ao helper.

**Nao crie** helper que monta cenario inteiro (`setupTudo()`), nem helper usado por um unico arquivo
— nesse caso a funcao local no proprio arquivo de teste ja resolve, e e o padrao do projeto.

Helpers compartilhados ficam num modulo `*-testing/` dentro do slice a que pertencem
(ex.: `src/shared/theme/theme-testing/`), nunca exportados pela Public API do slice: dependem de
`vitest` e `@testing-library/react`, que sao dependencias de desenvolvimento. Eles sao excluidos da
cobertura, por nao serem codigo de producao.

**Este padrao e obrigatorio para todo teste novo.** Os testes que ja existem vao sendo migrados aos
poucos, pela regra do escoteiro: ao tocar num arquivo de teste existente, se houver duplicacao que o
padrao resolve, migre **aquele arquivo** junto com a mudanca. Nao faca mutirao de migracao, e nao
migre arquivo que voce nao precisou tocar — refatoracao ampla escondida dentro de um PR de
funcionalidade torna a revisao impossivel. Se a migracao de um arquivo for grande o bastante para
competir com o trabalho da vez, ela vira card proprio.

Antes de extrair um helper compartilhado, confirme que ha **pelo menos dois** arquivos que o usam de
verdade. Duplicacao entre arquivos neste projeto e menor do que parece: o levantamento de 09/10/2026
encontrou, em 124 arquivos de teste, apenas tres agrupamentos com repeticao real — mock de
`next/navigation` (5 arquivos), `QueryClientProvider` montado a mao (4) e stub de `fetch` (3). Fora
deles, funcao local no proprio arquivo continua sendo a resposta certa.

### Testes E2E com Playwright

Decisao de 09/10/2026: **Playwright e obrigatorio no projeto**. Substitui a regra anterior, que
proibia E2E sem decisao explicita. Setup em SUC-40.

E2E existe para cobrir o que `jsdom` nao alcanca: navegacao real entre rotas, cookies HttpOnly,
Content-Security-Policy, renderizacao no servidor, tema aplicado antes da primeira pintura e o
fluxo completo que atravessa varias telas.

**O que precisa de E2E**

- Todo fluxo critico de usuario: entrar no sistema, recuperar senha, aceitar convite, autocadastrar
  circuito, inscrever passageiro, registrar pagamento, importar lista, gerar lista de embarque.
- Toda fatia do redesign, antes de a flag dela ser considerada pronta para producao.
- Regressao visual das telas redesenhadas, **nos dois temas**.

**Regras**

- E2E cobre fluxo, nao unidade. Nao duplique em E2E o que o teste unitario ja cobre — a suite fica
  lenta e a lentidao e o que faz uma suite ser ignorada.
- Selecione elementos por papel e texto acessivel (`getByRole`, `getByLabel`), nunca por classe de
  CSS Module, que e gerada e muda sozinha.
- Dados vem de interceptacao de rede (`page.route`), nao de backend real: E2E deve falhar por
  regressao de codigo, nunca porque um dado mudou no servidor. A contrapartida e explicita — a
  integracao real com a API e verificada em staging antes de ligar a flag da fatia, nao aqui.
- Baselines visuais sao capturadas em ambiente padronizado e com animacao desabilitada. Atualizar
  baseline exige inspecionar o diff imagem a imagem, como se revisa codigo.
- Teste intermitente e bug: corrija ou remova. Nunca `.skip`, nunca retry para mascarar.

```bash
yarn test:e2e      # suite Playwright
```

### Simulacao de eventos de usuario

O projeto **nao possui** `@testing-library/user-event` instalado. Use as alternativas abaixo:

- **`fireEvent`** (importado de `@testing-library/react`): suficiente para cliques, submits e
  eventos DOM simples. Preferir em testes de componentes genericos.
- **`userEvent`**: instalar apenas se houver necessidade real de simular digitacao realista,
  tabulacao ou sequencias complexas de teclado. Nao instalar por padrao.

```ts
// Correto — fireEvent para cliques simples
import { render, screen, fireEvent } from "@testing-library/react";

fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

// Errado — nao importar user-event sem o pacote instalado
import userEvent from "@testing-library/user-event";
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

## 10. Padrão de Commits (Conventional Commits)

- Use mensagens no formato: `tipo(escopo opcional): descrição breve no imperativo`, em português.
- Tipos permitidos: `feat`, `fix`, `chore`, `refactor`, `perf`, `docs`, `test`, `build`, `ci`, `style`, `revert`
- Utilize `!` para mudanças incompatíveis e/ou adicione `BREAKING CHANGE:` no corpo
- Cabeçalho até 50 caracteres; corpo e rodapé com linhas até 72 caracteres
- Escreva a descrição no imperativo e em português
- `escopo` é opcional e em `kebab-case` (ex.: `user-form`, `segments-api`)
- Inclua a chave do card no rodapé: `Refs: SUC-XX` (ver §11)
- **Nunca** adicione trailers de atribuição a IA — `Co-Authored-By: Claude`, `Generated with…`,
  `🤖` ou equivalente de qualquer modelo. O histórico do repositório registra autoria humana; a
  ferramenta usada para escrever o código não é informação de commit. Vale também para descrições
  de PR e comentários no Jira.

### Exemplos

```
feat(segments-table): adicionar coluna de permissões por segmento

Adicionar exibição das permissões do usuário diretamente na tabela de
segmentos para melhorar a visibilidade do acesso.
```

```
fix(login): corrigir redirecionamento após autenticação

Ajustar rota de retorno para `/app/home` quando o provider retornar
`redirectTo` vazio.
```

```
refactor(user-service)!: unificar métodos de busca por id e email

BREAKING CHANGE: `getByEmail` removido; usar `getByIdOrEmail`.
Atualizar chamadas nas features de cadastro e perfis.
```

---

## 11. Rastreamento do Trabalho no Jira

O planejamento e o acompanhamento deste projeto vivem no Jira, no projeto **SUOAC (`SUC`)**. A regra
é simples: **todo trabalho feito neste repositório corresponde a um card**. Código sem card é
trabalho invisível — ninguém consegue saber o que está em andamento, o que ficou pela metade nem por
que uma decisão foi tomada.

O site Atlassian é resolvido em tempo de execução via `getAccessibleAtlassianResources`. Não
registre URL nem `cloudId` em arquivos do repositório.

### Antes de começar qualquer tarefa

1. **Localize o card.** Busque por JQL no projeto `SUC` (por épico, label ou texto) antes de
   escrever qualquer linha.
2. **Se o card não existir, crie antes de codificar** — descrevendo o que será feito, não o que já
   foi. Card escrito depois vira relatório, não planejamento, e perde a função de avisar os outros
   do que está em andamento.
3. **Leia o card inteiro, inclusive os comentários.** Decisões de contrato, prazos combinados e
   mudanças de escopo costumam estar lá e não no código.
4. **Mova para `Em andamento`** quando começar de fato. Esse é o sinal que o board dá a quem olha de
   fora.

### Durante a execução

- **Desvio do que está escrito no card**: comente no card explicando o motivo **antes** de seguir.
  Não reescreva a descrição em silêncio — a descrição é o que foi combinado; o comentário é como a
  realidade mudou.
- **Decisão técnica relevante** (contrato de API, formato de dado, troca de abordagem, limite
  descoberto): registre como comentário no card. É o que torna a decisão recuperável meses depois.
- **Trabalho fora do escopo descoberto no caminho**: crie um card novo e siga. Inchar o card atual
  esconde esforço e atrasa o fechamento.
- **Bloqueio**: comente dizendo o que está bloqueando e por quem/pelo quê depende, e deixe o card em
  `Em andamento` ou mova para `A fazer` se for parar de verdade. Bloqueio silencioso é o pior estado
  possível do board.

### Ao concluir

- `yarn run check` precisa passar.
- Comente no card: o que foi entregue, branch/PR, o que ficou de fora e por quê.
- `Em análise` enquanto o PR aguarda revisão; `Concluído` apenas **após o merge**.
- Nunca feche um card cujo trabalho você não executou ou não verificou.

### Commits, branches e PRs

- **Commitar, fazer push e abrir PR acontecem apenas quando o usuário pedir, explicitamente.**
  Terminar a implementação **não** autoriza commitar. O padrão ao concluir um trabalho é deixá-lo na
  árvore de trabalho e avisar que está pronto para revisão — o usuário revisa o diff antes de
  qualquer coisa entrar no histórico. Commitar por conta própria atropela a revisão e obriga a
  desfazer commits.
- **Commits são organizados por significado, sempre.** Cada commit é uma unidade que faz sentido
  sozinha, com um `Refs:` próprio, e pode ser revertida sem derrubar o resto. Nunca agrupe por
  arquivo, por diretório ou pela ordem em que as coisas foram escritas; nunca misture documentação,
  ajuste de ferramenta e código de produto no mesmo commit.
- Branch: `tipo/suc-XX-descricao-curta` (ex.: `feat/suc-23-formulario-login`).
- Commit: Conventional Commits conforme §10, com a chave no rodapé — o cabeçalho continua limitado a
  50 caracteres:

```text
feat(login): adicionar formulario de entrada

Implementa campos, estados do botao e deteccao de Caps Lock
conforme o desenho novo.

Refs: SUC-23
```

- Título do PR começa com a chave: `SUC-23 — formulário de entrada`.
- **O PR segue `.github/PULL_REQUEST_TEMPLATE.md`**, que abre preenchido ao criar o PR. Todas as
  seções são obrigatórias: card, o que muda, por que, como verificar, riscos e checklist. "Nada" é
  resposta válida para riscos; deixar a seção em branco não é.
- Um PR por card, sempre que possível. Quando um PR carregar mais de um card — o que deve ser
  exceção justificada —, o título leva o card principal e a seção **Card** lista todos.

### Convenções do projeto SUC

- Tipos disponíveis: **Epic**, **História**, **Tarefa**, **Subtask**. **Não existe o tipo Bug** —
  use `Tarefa` com a label `bug`.
- **Não há Story Points nem Prioridade** configurados. Não invente campos: a organização é por
  **label**.
- Trabalho de backend fica **no mesmo projeto**, com a label `backend`, dentro do épico da fatia que
  o consome — a dependência entre front e API precisa ser visível no mesmo board.
- Labels em uso: `redesign`, `fatia-N`, `frontend`, `backend`, `design-system`, `feature-flags`,
  `corte-legado`, `divida-temporaria`, `decisao`, `testes`, `documentacao`, `bug`.
- Hierarquia: Epic → História/Tarefa. Histórias descrevem o que o usuário ganha; Tarefas descrevem
  trabalho técnico, de infraestrutura ou de backend.

### Como um card deve ser escrito

Um card é lido por alguém — ou por um agente — que não participou da conversa que o originou. Ele
precisa bastar sozinho.

Todo card tem:

- **Título**: uma ação concreta, não um tema. "Formulário de entrada no sistema", não "Login".
- **Contexto**: por que o card existe e o que há hoje. Quando algo não existe no sistema, diga isso
  explicitamente — é a informação que mais economiza tempo de quem for executar.
- **Escopo** e, quando houver risco de confusão, **fora de escopo**.
- **Critérios de aceite verificáveis**, em checklist, cobrindo também os **casos de erro** e não
  apenas o caminho feliz.
- **Dependências** nomeadas pela chave do card (`Depende de SUC-35`).
- **Decisões pendentes** explicitadas, com quem decide e quando — nunca escondidas numa frase vaga.

Não são aceitáveis: card de uma linha, título genérico ("melhorar a tela"), critério de aceite não
verificável ("ficar bom"), ou escopo que só existe na cabeça de quem escreveu.

### O que não fazer

- Criar card duplicado sem buscar antes.
- Usar o Jira como changelog de commits — o histórico do Git já faz isso. O card registra
  **intenção, decisão e estado**.
- Marcar como `Concluído` algo parcialmente entregue; o correto é comentar o que falta e manter o
  estado real.
- Alterar cards de épicos de fatias futuras para refletir ideias novas sem registrar o porquê.

---

## 12. Diretrizes do Redesign (em andamento)

O sistema esta sendo redesenhado de forma incremental, com a aplicacao atual em producao o tempo
todo. O documento mestre e `docs/architecture/SUOAC_ESTRATEGIA_REDESIGN.md` — leia antes de tocar em
qualquer coisa do redesign. O que segue e o resumo operacional.

### Fonte da verdade do design

- `docs/design_handoff_suoac_redesign/*.dc.html` sao a especificacao final: cores, espacamentos,
  estados e microinteracoes. Quando uma captura em `screenshots/` divergir do HTML, **o HTML vence**.
- Esses arquivos sao artefatos recebidos, nao codigo do projeto. Estao fora do ESLint e do Prettier
  de proposito. **Nao os edite, nao os formate, nao os "corrija".**

### Coexistencia entre o sistema atual e o novo

- O ponto de decisao entre versao antiga e nova e **o arquivo de rota em `/app`**, que ja deve ser
  fino. Nenhum `if (flag)` espalhado pelo resto do codigo.
- O slice novo nasce ao lado do antigo com sufixo `-next` (`src/pages/login-next`).
- `login` e `login-next` **nunca** importam um do outro. Se algo for reaproveitavel, copie para o
  slice novo ou promova para uma camada inferior antes de usar nos dois.
- A URL nunca muda. Nao crie rotas `/v2`.
- O corte do codigo antigo e **PR proprio**, que so apaga, renomeia e remove a flag.

### Feature flags do redesign

- Uma flag por fatia, prefixo `REDESIGN_`, declarada com o helper `booleanFlag` e `defaultValue: false`.
- O PR que cria a flag cria tambem o card de remocao dela.
- Teto de **2 flags `REDESIGN_*` ligadas em producao** sem corte pendente. Na terceira, a prioridade
  passa a ser cortar, nao construir.

### Tema claro e escuro

- Todo token de cor e de sombra precisa de par claro e escuro em `app/globals.css` e em
  `src/app/styles/theme-tokens.ts`. Os tipos de `theme-tokens.ts` quebram a compilacao se faltar um.
- CSS Modules **nunca** declaram cor, sombra ou scrim fora de `var(--suoac-*)`.
- O tema escuro so se aplica mediante opt-in explicito:

| Preferencia | Atributo em `<html>`  | Resultado                                           |
| ----------- | --------------------- | --------------------------------------------------- |
| escuro      | `data-theme="dark"`   | escuro sempre                                       |
| claro       | `data-theme="light"`  | claro sempre                                        |
| sistema     | `data-theme="system"` | decidido por `prefers-color-scheme`, sem JavaScript |
| ausente     | nenhum atributo       | claro, mesmo com o sistema operacional em escuro    |

- O ultimo caso e a trava da transicao: enquanto houver tela nao redesenhada, ninguem recebe tema
  escuro sem ter pedido.
- Interface nova so esta pronta depois de conferida **nos dois temas**.

### Animacao

- Use os `@keyframes` globais do design system, prefixados com `suoac-`: `suoac-rise` (entradas),
  `suoac-fade`, `suoac-modal-in`, `suoac-pop` (toast), `suoac-grow` (barras), `suoac-seat`
  (poltronas), `suoac-draw` (graficos), `suoac-shake` (erro) e `suoac-spin`.
- Duracao e curva vem dos tokens `--suoac-motion-*`. A curva padrao e
  `--suoac-motion-ease-standard`; qualquer outra precisa de motivo.
- Listas entram escalonadas: 25ms por item (`--suoac-motion-stagger-step`), com teto de 400ms
  (`--suoac-motion-stagger-max`). Sem o teto, uma lista de 40 passageiros levaria um segundo para
  terminar de aparecer.
- Nao redeclare esses `@keyframes` em CSS Module: dentro de um module eles sao escopados por
  arquivo, e a mesma animacao acabaria existindo em varias versoes levemente diferentes.
- Animacao especifica de uma tela nasce no CSS Module daquela tela.
- Movimento reduzido ja e tratado globalmente: sob `prefers-reduced-motion`, os tokens de duracao
  caem para valores irrisorios. Nao remova a animacao — entradas com `both`/`forwards` dependem do
  estado final do keyframe para ficarem visiveis.

### Medidas que o handoff usa e a escala atual nao tem

O handoff usa raios de 6px e 14px e alturas de controle de 50px e 54px, fora da escala atual
(8/12/16/20px; 44/48px). Quando uma tela precisar desses valores, **crie o token** em `globals.css` e
no espelho TypeScript — nao escreva o valor solto no CSS Module.

### O que nao fazer

- Redesenhar tela que nao e a da fatia da vez.
- Alterar aparencia ou responsividade de tela ainda nao redesenhada.
- Introduzir dependencia nova (biblioteca de UI, de animacao, de estado) sem decisao explicita
  registrada. O redesign se faz com o que o projeto ja tem.

---

## 13. Fluxo de Trabalho para AI Assistant

Quando solicitado para implementar uma funcionalidade:

0. Localize (ou crie) o card no Jira e mova para `Em andamento` — ver §11.
1. Leia os documentos relevantes em `docs/`.
2. Se tocar Next.js, consulte `node_modules/next/dist/docs/`.
3. Defina a camada FSD correta antes de criar arquivos.
4. Exponha apenas o necessario via `index.ts`.
5. Preserve a regra de dependencia entre camadas.
6. Adicione teste unitario co-localizado para logica nova.
7. Atualize `docs/architecture/SUOAC_ARQUITETURA_FRONTEND_FSD.md` se a arquitetura mudar.
8. Atualize `README.md` se mudar setup, dependencias, scripts ou instrucoes.
9. Rode `yarn run check` antes de concluir.
10. Comente no card o que foi entregue e atualize o estado dele — ver §11.

Nao implemente atalhos que enfraquecam type safety, lint, arquitetura ou testes. Se uma regra
parecer inadequada, explique o motivo e proponha ajuste explicito em vez de contornar localmente.
