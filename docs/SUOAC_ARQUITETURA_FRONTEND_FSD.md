# SUOAC — Arquitetura Frontend com Feature-Sliced Design

**Versao:** 0.1  
**Data:** 18/05/2026  
**Escopo:** Frontend Next.js do SUOAC  
**Base metodologica:** Feature-Sliced Design v2.1

---

## 1. Objetivo

Este documento define a arquitetura frontend do SUOAC usando Feature-Sliced Design (FSD).
Ele deve guiar a criacao de pastas, modulos, imports, testes e fronteiras de responsabilidade
desde o inicio do projeto.

O objetivo nao e apenas organizar arquivos. O objetivo e reduzir acoplamento, manter linguagem
de negocio no codigo e permitir que o sistema evolua com seguranca conforme entram eventos,
passageiros, pagamentos, dashboards, relatorios e permissoes.

---

## 2. Principios

### 2.1 Arquitetura guiada pelo produto

As principais pastas de dominio devem usar termos do SUOAC:

- `event`
- `event-day`
- `passenger`
- `congregation`
- `payment`
- `user`
- `invitation`
- `audit-log`

Nomes genericos como `components`, `hooks`, `types`, `utils`, `services` e `helpers` devem ser
evitados como segmentos principais. Quando algo parecer caber nesses nomes, a pergunta correta e:
qual e o proposito desse codigo?

### 2.2 Regra de dependencia

Uma camada so pode importar de camadas abaixo dela.

Ordem adotada:

```txt
app
pages
widgets
features
entities
shared
```

Permitido:

```txt
features/register-payment -> entities/payment
features/register-payment -> entities/passenger
features/register-payment -> shared/ui
pages/event-details -> widgets/event-dashboard
widgets/event-dashboard -> features/register-payment
```

Proibido:

```txt
entities/payment -> features/register-payment
features/register-payment -> features/enroll-passenger
widgets/event-dashboard -> widgets/financial-summary
shared/api -> entities/user
```

### 2.3 Slices independentes

Dentro de uma mesma camada, slices nao devem importar umas das outras.

Exemplo proibido:

```txt
entities/passenger -> entities/congregation
features/enroll-passenger -> features/register-payment
widgets/dashboard-summary -> widgets/payment-panel
```

Quando duas entidades realmente precisarem se conhecer, a preferencia e mover a composicao para
uma camada superior. Se a relacao for inevitavel no dominio, o uso de `@x` pode ser aceito apenas
em `entities`, de forma explicita e documentada.

### 2.4 API publica obrigatoria

Cada slice deve expor um contrato publico via `index.ts`.

Codigo externo ao slice deve importar somente pela API publica:

```ts
import { PassengerCard } from "@/entities/passenger";
import { EnrollPassengerForm } from "@/features/enroll-passenger";
```

Codigo interno do proprio slice deve usar imports relativos e caminho completo:

```ts
import { passengerSchema } from "../model/passenger-schema";
```

Nao usar `export *` como padrao. A API publica deve expor apenas o necessario para consumidores
externos.

---

## 3. Decisao Next.js + FSD

O Next.js App Router usa uma pasta `app` como roteador fisico. O FSD tambem possui uma camada
chamada `app`. Para reduzir conflito conceitual e manter compatibilidade com ferramentas oficiais
do FSD, adotaremos a estrutura recomendada para Next.js:

- `/app`: roteador fisico do Next.js, com `layout.tsx`, `page.tsx`, route groups e route handlers.
- `/pages`: placeholder para impedir uso acidental do Pages Router legado.
- `src/app`: camada App do FSD, com providers, estilos globais, configuracoes de aplicacao e
  bootstrap.
- `src/pages`: camada Pages do FSD, contendo as telas reais importadas pelo roteador do Next.

Essa decisao faz com que o roteador do Next fique fora da arvore FSD validada pelo Steiger. A arvore
`src/**` fica reservada para a arquitetura Feature-Sliced Design.

Regra pratica:

```txt
/app/**          = arquivos especiais e rotas do Next.js
/pages/**        = placeholder do Pages Router legado
src/app/**       = camada App do FSD
src/pages/**     = camada Pages do FSD
```

Arquivos em `/app` devem ser finos. Eles devem reexportar ou compor paginas vindas de `src/pages` e
providers vindos de `src/app`.

Exemplo alvo:

```tsx
// app/(private)/dashboard/page.tsx
export { DashboardPage as default, metadata } from "@/pages/dashboard";
```

---

## 4. Estrutura alvo

```txt
app/                           # Next.js App Router
  layout.tsx
  page.tsx
  globals.css
  (auth)/
    login/
      page.tsx
  (private)/
    dashboard/
      page.tsx
    events/
      page.tsx
      [eventId]/
        page.tsx

pages/                         # placeholder; nao usar Pages Router
  README.md

src/
  app/                         # FSD App layer
    providers/
      query-provider.tsx
      theme-provider.tsx
      auth-provider.tsx
    styles/
      globals.css
      theme-tokens.ts
    config/
      metadata.ts

  pages/                       # FSD Pages layer
    login/
      index.ts
      ui/
        login-page.tsx
      model/
        login-schema.ts

    dashboard/
      index.ts
      ui/
        dashboard-page.tsx

    events/
      index.ts
      ui/
        events-page.tsx

    event-details/
      index.ts
      ui/
        event-details-page.tsx

    passengers/
      index.ts
      ui/
        passengers-page.tsx

    financial/
      index.ts
      ui/
        financial-page.tsx

  widgets/                     # blocos grandes, autocontidos
    app-shell/
      index.ts
      ui/
        app-shell/
          app-shell.tsx
          app-shell.module.css
          index.ts
        desktop-sidebar/
          desktop-sidebar.tsx
          desktop-sidebar.module.css
          desktop-sidebar.test.tsx
          index.ts
        mobile-bottom-nav/
          mobile-bottom-nav.tsx
          mobile-bottom-nav.module.css
          mobile-bottom-nav.test.tsx
          index.ts

    event-overview/
      index.ts
      ui/
        event-overview.tsx

    congregation-status-list/
      index.ts
      ui/
        congregation-status-list.tsx

    financial-summary/
      index.ts
      ui/
        financial-summary.tsx

  features/                    # acoes de usuario com valor de negocio
    sign-in/
      index.ts
      ui/
        sign-in-form.tsx
      model/
        sign-in-schema.ts
      api/
        sign-in.mutation.ts

    create-event/
      index.ts
      ui/
        create-event-form.tsx
      model/
        create-event-schema.ts
      api/
        create-event.mutation.ts

    publish-event/
      index.ts
      ui/
        publish-event-button.tsx
      api/
        publish-event.mutation.ts

    enroll-passenger/
      index.ts
      ui/
        enroll-passenger-form.tsx
      model/
        enroll-passenger-schema.ts
      api/
        enroll-passenger.mutation.ts

    select-event-days/
      index.ts
      ui/
        event-day-selector.tsx
      model/
        calculate-passenger-total.ts

    register-payment/
      index.ts
      ui/
        register-payment-form.tsx
      model/
        payment-schema.ts
      api/
        register-payment.mutation.ts

    finalize-congregation-list/
      index.ts
      ui/
        finalize-list-button.tsx
      api/
        finalize-list.mutation.ts

  entities/                    # conceitos do dominio
    circuit/
      index.ts
      model/
        circuit.ts
      api/
        circuit.queries.ts

    congregation/
      index.ts
      ui/
        congregation-badge.tsx
      model/
        congregation.ts
      api/
        congregation.queries.ts

    user/
      index.ts
      model/
        user.ts
        role.ts
      api/
        user.queries.ts

    event/
      index.ts
      ui/
        event-status-chip.tsx
      model/
        event.ts
        event-status.ts
      api/
        event.queries.ts

    event-day/
      index.ts
      ui/
        event-day-chip.tsx
      model/
        event-day.ts

    passenger/
      index.ts
      ui/
        passenger-row.tsx
      model/
        passenger.ts
      api/
        passenger.queries.ts

    payment/
      index.ts
      ui/
        payment-status-chip.tsx
      model/
        payment.ts
        payment-status.ts

    invitation/
      index.ts
      model/
        invitation.ts

    audit-log/
      index.ts
      model/
        audit-log.ts

  shared/                      # base tecnica e UI sem regra de negocio especifica
    api/
      client.ts
      errors.ts
      query-client.ts
      query-keys.ts

    config/
      env.ts
      routes.ts

    ui/
      button/
        index.ts
        button.tsx
      text-field/
        index.ts
        text-field.tsx
      status-chip/
        index.ts
        status-chip.tsx
      card/
        index.ts
        card.tsx

    lib/
      date/
        README.md
        format-date.ts
      currency/
        README.md
        format-currency.ts
      masks/
        README.md
        rg-mask.ts

    auth/
      session.ts
      permissions.ts
```

---

## 5. Responsabilidades por camada

### 5.1 `shared`

Fundacao tecnica do frontend.

Pode conter:

- Cliente HTTP.
- Query client.
- Configuracao de ambiente.
- Rotas nomeadas.
- UI kit sem regra de negocio especifica.
- Formatadores de data/moeda.
- Permissoes genericas e sessao, quando forem necessarias para o cliente HTTP.

Nao deve conter:

- Regras como "passageiro paga valor da passagem vezes dias selecionados".
- Componentes como `PassengerCard`, `EventStatusPanel` ou `CongregationPaymentTable`.
- Tipos globais de dominio em uma pasta `types`.

### 5.2 `entities`

Conceitos do dominio SUOAC.

Cada entidade pode conter:

- `model`: tipos, enums, schemas e funcoes puras do dominio da entidade.
- `ui`: representacoes pequenas e reutilizaveis.
- `api`: queries ligadas diretamente a entidade.

Exemplo:

```txt
entities/event/model/event.ts
entities/event/model/event-status.ts
entities/event/ui/event-status-chip.tsx
entities/event/api/event.queries.ts
```

Regra importante: entidade nao executa caso de uso completo. Ela fornece blocos de dominio para
features, widgets e pages.

### 5.3 `features`

Acoes que o usuario quer executar.

No SUOAC, bons candidatos:

- Entrar no sistema.
- Criar evento.
- Publicar evento.
- Inscrever passageiro.
- Selecionar dias do evento.
- Registrar pagamento.
- Marcar isencao.
- Finalizar lista da congregacao.

Uma feature pode importar varias entidades e `shared`, mas nao outra feature.

Se duas features precisarem ser usadas juntas, a composicao deve acontecer em `widgets` ou `pages`.

### 5.4 `widgets`

Blocos grandes e autocontidos de interface.

No SUOAC:

- `app-shell`
- `event-overview`
- `financial-summary`
- `congregation-status-list`
- `passenger-table`
- `event-capacity-panel`

Um widget pode combinar features e entities. Deve representar um bloco visivel e relativamente
independente da tela.

### 5.5 `pages`

Telas de produto.

No SUOAC:

- `login`
- `dashboard`
- `events`
- `event-details`
- `passengers`
- `financial`
- `reports`
- `settings`

Pages podem compor widgets, features e entities. Pequenas logicas especificas de uma unica tela
podem ficar dentro da propria page. Nao criar feature prematuramente para codigo usado uma vez.

### 5.6 `/app` e `src/app`

`/app` pertence ao Next.js:

- Rotas.
- Layouts especiais.
- Route handlers.
- Loading/error/not-found.

#### Error boundaries

Error boundaries (`error.tsx` e `global-error.tsx`) ficam em `/app` e sao Client Components.

- Usam `shared/ui/error-state` para o layout visual (ilustracao, titulo, descricao, acoes).
- Navegacao de saida usa `window.location.href` em vez de `useRouter().push()` porque a arvore
  de componentes esta em estado de erro e o router client-side nao funciona confiavelmente.
- `global-error.tsx` replica o visual com inline styles porque renderiza fora da arvore do app,
  sem acesso a CSS Modules, providers ou tokens globais.

`src/app` pertence ao FSD:

- Providers globais.
- Tema.
- QueryProvider.
- AuthProvider.
- Metadata padrao.
- Bootstrap de bibliotecas.

---

## 6. Dominio inicial do SUOAC

### 6.1 Entidades iniciais

| Entidade       | Responsabilidade                                      |
| -------------- | ----------------------------------------------------- |
| `circuit`      | Raiz multi-tenant do sistema                          |
| `congregation` | Congregacoes do circuito                              |
| `user`         | Usuario, papel e estado de acesso                     |
| `event`        | Evento, status, prazos, local e valor da passagem     |
| `event-day`    | Dia especifico do evento, horario e status            |
| `passenger`    | Cadastro base de passageiro por congregacao           |
| `payment`      | Pagamentos, status, valores e isencao                 |
| `invitation`   | Convites de primeiro acesso                           |
| `audit-log`    | Registro de auditoria exibido ou consultado no painel |

### 6.2 Features iniciais do MVP

| Feature                       | Camada  | Observacao                                |
| ----------------------------- | ------- | ----------------------------------------- |
| `sign-in`                     | feature | Login por e-mail/senha e futuro OAuth     |
| `create-event`                | feature | Criacao de assembleia/congresso           |
| `publish-event`               | feature | Mudanca de status para inscricoes abertas |
| `update-event-day`            | feature | Edicao de horarios de saida/retorno       |
| `cancel-event-day`            | feature | Cancelamento de dia individual do evento  |
| `enroll-passenger`            | feature | Inscricao em evento                       |
| `select-event-days`           | feature | Escolha de dias e calculo de valor        |
| `register-payment`            | feature | Pagamento total/parcial/isento            |
| `finalize-congregation-list`  | feature | Fechamento da lista da congregacao        |
| `export-event-passenger-list` | feature | Exportacao futura                         |
| `check-in-passenger`          | feature | Pos-MVP                                   |
| `start-bus-tracking-session`  | feature | Pos-MVP, dependente do servico Go         |

---

## 7. API, DTOs e server state

### 7.1 Cliente HTTP

O cliente HTTP base fica em:

```txt
src/shared/api/client.ts
```

Responsabilidades:

- Base URL.
- Headers comuns.
- JSON serialization.
- Tratamento padrao de erro.
- Refresh token quando a decisao de auth estiver definida.

### 7.2 Requests

Regra inicial:

- Requests reutilizaveis e query factories por entidade ficam em `entities/{entity}/api`.
- Requests usados por uma unica feature ficam em `features/{feature}/api`.
- Infra comum fica em `shared/api`.

Evitar colocar todos os endpoints em `shared/api/endpoints` se eles ja tiverem dono claro no
dominio. `shared/api` nao deve virar um monolito de requests.

### 7.3 DTOs e mappers

DTO e a forma que vem do backend. Model e a forma usada pelo frontend.

Regra:

- DTO fica perto do request que o consome.
- Mapper fica perto do DTO.
- Entity model nao deve depender diretamente de detalhes instaveis do backend.

Exemplo:

```txt
entities/event/api/get-event.ts
entities/event/api/event.dto.ts
entities/event/api/map-event.ts
entities/event/model/event.ts
```

### 7.4 TanStack Query

Quando TanStack Query for instalado:

```txt
src/shared/api/query-client.ts
src/_app/providers/query-provider.tsx
```

Query factories devem ficar proximas do dominio:

```txt
entities/event/api/event.queries.ts
entities/passenger/api/passenger.queries.ts
entities/payment/api/payment.queries.ts
```

Mutations devem ficar perto do caso de uso:

```txt
features/register-payment/api/register-payment.mutation.ts
features/enroll-passenger/api/enroll-passenger.mutation.ts
```

Nao misturar queries e mutations no mesmo arquivo por conveniencia.

---

## 8. Autenticacao e permissoes

### 8.1 Auth

O SUOAC tera JWT com refresh token em cookie HttpOnly no backend. No frontend, a preferencia e:

- Sessao/current user em `entities/user`.
- Cliente HTTP e tratamento de erro em `shared/api`.
- Providers e guards globais em `src/_app/providers`.
- Formularios e fluxos de login em `features/sign-in` e `pages/login`.

### 8.2 RBAC

Papeis definidos em `shared/auth/session/user-role.ts` via const `USER_ROLES`:

- `CIRCUIT_COORDINATOR` — Coordenador do circuito.
- `CIRCUIT_ASSISTANT` — Assistente do circuito.
- `CONGREGATION_COORDINATOR` — Coordenador da congregacao.
- `CONGREGATION_ASSISTANT` — Assistente da congregacao.

O tipo `UserRole` e derivado da const via `typeof`, garantindo ponto unico de definicao.

Helpers de permissao e filtragem de navegacao ficam em `shared/auth/rbac/`:

```txt
shared/auth/session/user-role.ts    # const USER_ROLES e tipo UserRole
shared/auth/rbac/rbac.ts            # isCircuitRole, filterNavItems, NavItem
```

Se a regra depender fortemente de `User`, mover ou expor composicoes via `entities/user/model`.
Regras especificas de features ficam na propria feature:

```txt
features/publish-event/model/...    # regra especifica para publicar evento
```

---

## 9. Formularios e validacao

O projeto usa **React Hook Form + Zod + `@hookform/resolvers`** como padrao para formularios.

- Schema especifico de uma feature fica em `features/{feature}/model`.
- Schema de uma page simples fica em `pages/{page}/model`.
- Schema de entidade, se representar invariantes estaveis do dominio, fica em `entities/{entity}/model`.
- Formularios com React Hook Form devem ser Client Components e declarar `"use client"`.
- Use `zodResolver` para conectar schemas Zod ao React Hook Form.
- Nao criar pasta global `schemas`.
- Nao colocar regras reutilizaveis diretamente dentro do componente.
- Tipos do formulario devem ser derivados do schema com `z.infer` sempre que possivel.

Exemplos:

```txt
features/create-event/model/create-event-schema.ts
features/enroll-passenger/model/enroll-passenger-schema.ts
features/register-payment/model/payment-schema.ts
entities/passenger/model/rg-schema.ts
```

Regra: validacao de formulario nao deve ser confundida com regra de dominio. Se uma regra vale
independentemente da tela, extraia para `entities` ou para a feature dona do caso de uso.

Exemplo de padrao:

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createEventSchema, type CreateEventFormValues } from "../model/create-event-schema";

export function CreateEventForm() {
  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
  });

  // ...
}
```

---

## 10. Design system e UI

### 10.0 Estrategia de estilo

A estrategia padrao do projeto e **CSS Modules + CSS Custom Properties**.

Decisao:

- Nao usar `styled-components` como padrao inicial.
- Tokens globais em CSS variables ficam em `app/globals.css`.
- Tokens tipados para uso em TypeScript ficam em `src/app/styles/theme-tokens.ts`.
- Componentes devem usar `.module.css` co-localizado sempre que possivel.
- Estilos dinamicos devem priorizar data attributes, classes e CSS variables antes de introduzir
  runtime CSS-in-JS.

Motivo: essa abordagem reduz runtime no cliente, preserva Server Components do Next, funciona bem
com FSD e atende melhor a natureza operacional/mobile-first do SUOAC.

### 10.1 `shared/ui`

Componentes genericos:

- Badge.
- Button.
- Card.
- ConfirmDialog.
- EmptyState.
- ErrorState.
- Modal.
- PageHeader.
- Pagination.
- Skeleton.
- Spinner.
- Table.
- TextField.

Cada componente deve ter seu proprio diretorio e `index.ts`:

```txt
shared/ui/button/button.tsx
shared/ui/button/index.ts
```

Import correto:

```ts
import { Button } from "@/shared/ui/button";
```

Evitar um unico barrel `shared/ui/index.ts` exportando tudo, para preservar tree-shaking e reduzir
custo de build em escala.

### 10.2 UI de dominio

Componentes que carregam linguagem SUOAC pertencem a entidades, features ou widgets:

```txt
entities/event/ui/event-status-chip.tsx
entities/payment/ui/payment-status-chip.tsx
features/register-payment/ui/register-payment-form.tsx
widgets/financial-summary/ui/financial-summary.tsx
```

---

## 11. Testes

Nesta fase inicial, o projeto deve crescer com testes unitarios co-localizados. Testes de integracao
e E2E ficam fora da configuracao por enquanto para reduzir complexidade operacional enquanto a base
do frontend ainda esta sendo formada.

### 11.1 Testes unitarios

Foco:

- Funcoes puras.
- Schemas.
- Mappers.
- Regras de negocio de frontend.
- Componentes pequenos sem muita composicao.

Localizacao padrao: co-localizado com o codigo testado.

```txt
features/register-payment/model/payment-schema.test.ts
entities/payment/model/calculate-payment-status.test.ts
shared/lib/currency/format-currency.test.ts
```

Regra de nome:

```txt
*.test.ts
*.test.tsx
```

O diretorio `tests/` deve ser usado apenas para setup global, fixtures compartilhadas ou utilitarios
de teste que nao pertencem a um slice especifico.

### 11.2 Testes de integracao

Por decisao atual, testes de integracao ficam fora da configuracao inicial. Quando voltarem, devem
continuar co-localizados no slice/camada que representa o fluxo integrado.

Foco futuro:

- Feature inteira com formulario e validacao.
- Widget montando features/entities.
- Page FSD com fluxo principal simulado.

Localizacao futura:

```txt
features/register-payment/ui/register-payment-form.integration.test.tsx
widgets/financial-summary/ui/financial-summary.integration.test.tsx
pages/dashboard/ui/dashboard-page.integration.test.tsx
```

Regra de nome:

```txt
*.integration.test.ts
*.integration.test.tsx
```

### 11.3 E2E

Por decisao atual, E2E tambem fica fora da configuracao inicial. Quando voltar:

- Usar Playwright.
- Cobrir fluxos criticos: login, criar evento, inscrever passageiro, registrar pagamento.
- Manter separado dos testes Vitest.

---

## 12. Convencoes de nomes

### 12.1 Pastas

Usar kebab-case:

```txt
register-payment
event-details
finalize-congregation-list
```

### 12.2 Arquivos

Usar kebab-case:

```txt
create-event-form.tsx
event-status-chip.tsx
payment-status.ts
```

### 12.3 Componentes e tipos

Usar PascalCase:

```ts
CreateEventForm;
EventStatusChip;
PaymentStatus;
```

### 12.4 Hooks

Usar camelCase com prefixo `use`:

```ts
useRegisterPayment;
useCurrentUser;
```

---

## 13. Regras praticas de decisao

### 13.1 Onde colocar um codigo novo?

1. E fundacao tecnica, UI generica ou integracao externa?
   - `shared`
2. E um conceito do dominio SUOAC?
   - `entities`
3. E uma acao que o usuario executa?
   - `features`
4. E um bloco grande de tela composto por varias partes?
   - `widgets`
5. E uma tela completa ou logica usada apenas por uma rota?
   - `pages`
6. E provider, bootstrap, tema ou configuracao global?
   - `src/_app`
7. E arquivo especial do Next?
   - `src/app`

### 13.2 Quando criar uma feature?

Criar feature quando:

- Representa uma acao nomeavel pelo usuario.
- Tem valor de negocio claro.
- Tende a ser reutilizada em mais de uma page/widget.
- Tem UI + model/api proprios.

Nao criar feature quando:

- E apenas um botao visual.
- E logica usada uma unica vez e simples.
- E somente um wrapper de componente generico.

### 13.3 Quando criar um widget?

Criar widget quando:

- A interface e um bloco grande e reconhecivel.
- O bloco combina multiplas features/entities.
- O bloco e reutilizado em paginas diferentes ou ajuda a separar uma page complexa.

Nao criar widget quando:

- O bloco e pequeno.
- O bloco pertence somente a uma page simples.
- O widget so existe para esconder imports.

---

## 14. Anti-padroes proibidos

### 14.1 Pasta `shared/types`

Nao criar.

Tipos devem morar perto do proposito:

- DTO perto do request.
- Entidade em `entities/{entity}/model`.
- Tipo utilitario documentado em `shared/lib/utility-types`, se realmente reutilizavel.

### 14.2 Pasta `shared/utils`

Nao criar.

Usar bibliotecas focadas:

```txt
shared/lib/date
shared/lib/currency
shared/lib/masks
shared/lib/storage
```

Cada biblioteca em `shared/lib` deve ter uma responsabilidade clara.

### 14.3 Cross-import casual

Nao importar slices da mesma camada entre si. Se parecer necessario:

1. Mover a composicao para camada superior.
2. Reavaliar se as slices deveriam ser uma so.
3. Usar `@x` apenas em `entities` e como excecao documentada.

### 14.4 Public API enorme

Nao exportar tudo por comodidade.

Evitar:

```ts
export * from "./ui/passenger-row";
export * from "./model/passenger";
export * from "./api/passenger.queries";
```

Preferir:

```ts
export { PassengerRow } from "./ui/passenger-row";
export type { Passenger } from "./model/passenger";
export { passengerQueries } from "./api/passenger.queries";
```

### 14.5 Entidades excessivas

Nem todo substantivo vira entidade. Exemplos que devem ser avaliados com cuidado:

- `dashboard`
- `form`
- `table`
- `filter`
- `modal`

Esses nomes geralmente sao page/widget/shared UI, nao entidade de negocio.

---

## 15. Validacao Arquitetural

A arquitetura FSD deve ser validada automaticamente pelo Steiger.

O projeto usa duas camadas de protecao:

- ESLint com `eslint-plugin-boundaries`: feedback imediato no editor e no comando `yarn lint`.
- Steiger com `@feature-sliced/steiger-plugin`: validacao FSD completa no pipeline.

Comando:

```bash
yarn architecture:check
```

Esse comando roda:

```bash
steiger ./src
```

O Steiger valida a arvore FSD em `src/**`. O App Router do Next fica fora dessa arvore em `/app` e
deve permanecer fino, apenas conectando rotas, layouts e pages FSD.

Regras importantes cobertas pelo ESLint durante a edicao:

- Proibir `shared` importar `entities`, `features`, `widgets`, `pages` ou `app`.
- Proibir `entities` importar `features`, `widgets`, `pages` ou `app`.
- Proibir `features` importar `widgets`, `pages` ou `app`.
- Proibir `widgets` importar `pages` ou `app`.
- Proibir `pages` importar `app`.

Regras importantes cobertas pelo Steiger:

- Proibir imports de camadas superiores.
- Proibir cross-imports indevidos entre slices.
- Proibir bypass da Public API de um slice.
- Exigir Public API em slices e segmentos relevantes.
- Detectar nomes de camadas incorretos.
- Detectar estrutura de segmentos fora do padrao FSD.

Excecoes atuais:

- `fsd/insignificant-slice` fica desligada enquanto a arquitetura esta scaffoldada antes da
  implementacao real dos slices. Quando os principais slices do MVP estiverem em uso, essa regra
  deve ser reavaliada.
- `@next/next/no-img-element` esta desligada para error boundaries (`app/**/error.tsx` e
  `app/global-error.tsx`). Error boundaries renderizam quando a arvore do app esta quebrada, entao
  depender do pipeline de otimizacao de imagem do Next.js seria arriscado. `global-error.tsx` monta
  seu proprio `<html>` e nao tem acesso aos providers do Next, tornando `<Image />` inviavel.

O script `yarn check` deve executar a validacao arquitetural junto com typecheck, lint, teste e
formatacao. Assim, uma violacao de arquitetura falha localmente e tambem falhara no pipeline de CI.

---

## 16. Roadmap arquitetural inicial

### Fase 1 — Fundacao (concluida)

- Criar estrutura FSD vazia. (concluido)
- Manter o App Router do Next em `/app`. (concluido)
- Manter a camada App do FSD em `src/app`. (concluido)
- Mover tela inicial para `src/pages/dashboard`. (concluido)
- Criar `src/app/providers`. (concluido)
- Criar `shared/config/routes`. (concluido)
- Criar `shared/ui` minimo alinhado ao design system. (concluido)
- Criar `shared/ui/error-state` com layout horizontal, animacoes e suporte a acao secundaria. (concluido)
- Criar error boundaries em `/app` (`(auth)/error.tsx`, `(private)/error.tsx`, `global-error.tsx`). (concluido)
- Configurar Steiger como validador arquitetural. (concluido)

### Fase 2 — Dominio MVP

- Criar entidades `event`, `event-day`, `passenger`, `payment`, `congregation`, `user`. (parcial — `event` e `event-day` implementadas; `congregation` e `user` ja possuem base funcional)
- Criar features `create-event`, `publish-event`, `update-event`, `delete-event`, `update-event-day`, `cancel-event-day`, `enroll-passenger`, `register-payment`. (parcial — eventos e dias implementados; passageiros e pagamentos pendentes)
- Criar widgets `event-overview`, `financial-summary`.

Status atual da fatia de eventos:

- `entities/event` contem model, constantes de status/tipo, labels, variants, helpers de regra de negocio para dias (`canUpdateEventDayTimes`, `canCancelEventDay`), queries e query options para listagem e detalhe.
- `entities/event-day` contem model, queries e query options para listagem e detalhe de dias.
- `features/create-event` contem schema Zod, mapper de DTO, Server Action e modal de criacao.
- `features/update-event-day` contem schema Zod (horarios HH:mm), DTO com deteccao de alteracoes, Server Action (PATCH) e modal de edicao de horarios.
- `features/cancel-event-day` contem Server Action para cancelamento de dia (PATCH /event-days/:id/cancel).
- `pages/events` consome eventos por circuito via TanStack Query, exibe cards paginados e abre o modal de criacao.
- `pages/event-detail` exibe detalhe do evento com acoes de editar, excluir, publicar, editar horarios de dia e cancelar dia.
- A grade de eventos usa dois cards por linha em telas maiores e um card por linha em telas menores.
- A publicacao do evento (`DRAFT` -> `OPEN`) foi implementada em `features/publish-event`.
- A edicao por campos permitidos em cada status foi implementada em `features/update-event`.
- A exclusao de eventos em rascunho foi implementada em `features/delete-event`.

### Fase 3 — Server state

- Instalar TanStack Query. (concluido)
- Instalar React Hook Form + Zod + resolvers. (concluido)
- Criar `shared/api/client`. (concluido — `shared/api/http-client`)
- Criar `shared/api/query-client`. (concluido)
- Criar query factories por entidade. (parcial — `congregation`, `event` e `event-day`)
- Criar mutations por feature. (parcial — `create-event`, `congregations`)

### Fase 4 — Permissoes e fluxo autenticado (concluida)

- Criar `features/sign-in`. (concluido)
- Criar `entities/user`. (concluido — model basico)
- Criar `shared/auth`. (concluido — session, auth-context, AuthProvider)
- Criar protecao de rotas via proxy. (concluido)
- Criar widget `app-shell` com sidebar e bottom nav. (concluido)
- Criar route group `(private)` com layout autenticado. (concluido)
- Criar filtragem de navegacao por papel (RBAC). (concluido)

### Fase 5 — Relatorios e pos-MVP

- Exportacao PDF/XLSX.
- Check-in.
- Modo offline.
- Tracking em tempo real com servico Go.

---

## 17. Fontes

- Feature-Sliced Design — Overview: https://feature-sliced.design/docs/get-started/overview
- Feature-Sliced Design — Layers: https://feature-sliced.design/docs/reference/layers
- Feature-Sliced Design — Slices and segments: https://feature-sliced.design/docs/reference/slices-segments
- Feature-Sliced Design — Public API: https://feature-sliced.design/docs/reference/public-api
- Feature-Sliced Design — Usage with Next.js: https://feature-sliced.design/docs/guides/tech/with-nextjs
- Feature-Sliced Design — Handling API Requests: https://feature-sliced.design/docs/guides/examples/api-requests
- Feature-Sliced Design — Usage with React Query: https://feature-sliced.design/docs/guides/tech/with-react-query
- Feature-Sliced Design — Types: https://feature-sliced.design/docs/guides/examples/types
- Feature-Sliced Design — Authentication: https://feature-sliced.design/docs/guides/examples/auth
- Feature-Sliced Design — Cross-import: https://feature-sliced.design/docs/guides/issues/cross-imports
