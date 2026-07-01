# Progresso do Projeto - SUOAC Frontend

**Atualizado em:** 30/06/2026
**Fase atual:** Domínio MVP - eventos, passageiros, pagamentos e dashboard

Este arquivo acompanha o estado do frontend, o que já foi entregue e quais frentes ainda precisam avançar.

## Estado Geral

| Frente                 | Estado    | Observação                                                                                                               |
| ---------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| Fundação Next.js + FSD | Concluído | Estrutura base, App Router em `/app`, FSD em `src/`, Steiger e ESLint configurados.                                      |
| Design system base     | Concluído | Tokens globais, componentes compartilhados e padrões visuais iniciais.                                                   |
| Autenticação e sessão  | Concluído | Login, logout, sessão via cookies HttpOnly, refresh, proxy, RBAC de navegação e troca de senha obrigatória no 1º acesso. |
| App shell autenticado  | Concluído | Sidebar desktop, bottom nav mobile e rotas privadas.                                                                     |
| Congregações           | Parcial   | Listagem, criação, edição e exclusão já integradas ao backend.                                                           |
| Eventos                | Parcial   | Listagem, criação, publicação, edição, exclusão e cancelamento já integrados ao backend.                                 |
| Passageiros            | Parcial   | `entities/passenger`, CRUD, inscrição em eventos (`enroll-passenger`) e exportação de inscritos em PDF integrados.       |
| Pagamentos             | Parcial   | `entities/payment` e `register-payment` integrados; resumo financeiro no dashboard.                                      |
| Dashboards             | Parcial   | Dashboard com stats, progresso de pagamentos, presença por dia e resumo por congregação.                                 |
| Financeiro             | Parcial   | Página financeira por evento: cards de totais, resumo por congregação (circuito), tabela com filtro por status.          |
| Segurança              | Parcial   | Cookies de sessão assinados com HMAC-SHA256, headers de segurança e Content-Security-Policy via proxy/route-guard.       |

## Entregas Concluídas

### 1. Fundação e Arquitetura

- Projeto configurado com Next.js 16, React 19, TypeScript strict e Yarn v1.
- App Router físico mantido em `/app`.
- Camadas FSD organizadas em `src/app`, `src/pages`, `src/widgets`, `src/features`, `src/entities` e `src/shared`.
- Validação arquitetural com Steiger e `eslint-plugin-boundaries`.
- Scripts de validação centralizados em `yarn run check`.

### 2. Shared UI e Design System

- Tokens globais em `app/globals.css`.
- Componentes compartilhados com testes co-localizados:
  - `Button`
  - `TextField`
  - `Card`
  - `Badge`
  - `Table`
  - `Skeleton`
  - `Spinner`
  - `Modal`
  - `ConfirmDialog`
  - `EmptyState`
  - `ErrorState`
  - `Pagination`
  - `PageHeader`

### 3. Autenticação, Sessão e Permissões

- `features/sign-in` com formulário, schema Zod e Server Actions.
- `shared/auth` com sessão por cookies HttpOnly, refresh de sessão, `AuthProvider` e `useAuth`.
- `proxy.ts` protegendo rotas privadas.
- `app-shell` autenticado com navegação filtrada por papel.
- Troca de senha obrigatória no primeiro acesso (ver entrega 11 e `docs/architecture/SUOAC_AUTENTICACAO.md` §3.5).

### 4. API e Server State

- `shared/api/http-client` com `Authorization: Bearer`, refresh automático em 401 e tratamento de erros.
- Endpoints centralizados em `shared/api/http-client/endpoints.ts`.
- Query client e query keys em `shared/api/query-client`.
- TanStack Query integrado às páginas que já consomem backend.

### 5. Congregações

- `entities/congregation` com model e queries.
- Página `congregations` com listagem paginada, empty state, criação, edição, exclusão e confirmação destrutiva.

### 6. Eventos - Primeira Fatia MVP

- `entities/event` criado com tipos de domínio, constantes de status/tipo, labels, variants, queries e query options.
- `entities/event-day` criado com tipos de domínio e queries.
- Endpoints adicionados para:
  - listar/criar/detalhar/atualizar/deletar eventos;
  - alterar status de evento;
  - cancelar evento (endpoint dedicado `PATCH /events/:id/cancel`);
  - listar/detalhar/atualizar/cancelar dias de evento.
- Query keys adicionadas para `events` e `eventDays`.
- `features/create-event` implementada com:
  - schema Zod com validação de assembleia e congresso regional;
  - DTO mapper para o contrato do backend em `EVENTS.txt`;
  - Server Action `createEventAction`;
  - modal com React Hook Form, validação inline e feedback de erro.
- Página `events` deixou de ser placeholder e agora possui:
  - listagem paginada por circuito;
  - cards responsivos, dois por linha em telas maiores e um por linha em telas menores;
  - empty state;
  - estado de erro com retry;
  - skeleton de carregamento;
  - modal de criação de evento;
  - ação para publicar eventos em rascunho, disponível apenas para papéis de circuito.

### 7. Publicação de Eventos

- `features/publish-event` implementada com Server Action `publishEventAction`.
- A ação chama `PATCH /events/:id/status` com `{ status: "OPEN" }`.
- A página de eventos exibe o botão "Publicar evento" apenas para eventos em `DRAFT` e para papéis de circuito.
- Em sucesso, as queries de eventos são invalidadas para atualizar a listagem.
- Em erro, a página mostra mensagem recuperável no topo da listagem.

### 8. Edição e Exclusão de Eventos

- `features/update-event` implementada com schema Zod, mapper por status, Server Action e modal de edição.
- A edição respeita os campos permitidos por status conforme contrato do backend:
  - `DRAFT`: todos os campos editáveis pelo endpoint;
  - `OPEN`: sem alteração de prazo de inscrição;
  - `CLOSED`: apenas observações;
  - `FINISHED`: sem edição.
- `features/delete-event` implementada com Server Action.
- A exclusão aparece apenas para eventos em `DRAFT` e exige confirmação via dialog.
- Regras de campos editáveis e exclusão por status ficam centralizadas em `entities/event/model`.

### 9. Cancelamento de Eventos

- `features/cancel-event` implementada com Server Action `cancelEventAction`.
- A ação chama o endpoint dedicado `PATCH /events/:id/cancel` (sem body). Anteriormente usava o endpoint genérico de transição de status; agora usa endpoint específico conforme contrato do backend.
- Helpers de domínio em `entities/event/model`:
  - `canCancelEventStatus(status)` — retorna `true` apenas para `OPEN`. Eventos em `DRAFT` devem ser excluídos via DELETE.
  - `canCancelEventDay(eventStatus, dayStatus)` — retorna `true` apenas quando evento está `OPEN` e dia está `ACTIVE`. Dias de eventos em `DRAFT` não podem ser cancelados individualmente.
  - `isLastActiveDayInEvent(days)` — retorna `true` quando há exatamente 1 dia ativo.
- A página de detalhe exibe o botão "Cancelar evento" apenas para `CIRCUIT_COORDINATOR` em eventos `OPEN`.
- A página de detalhe exibe o botão "Cancelar dia" apenas quando o evento está `OPEN` (coordenador).
- A página de listagem exibe o botão "Cancelar evento" no card, com as mesmas regras de visibilidade.
- Ao cancelar o último dia ativo de um evento, o dialog de cancelamento do dia avisa que o evento também será cancelado.
- Cancelamento exige confirmação via dialog destrutivo em ambas as páginas.
- Após cancelar, o evento continua visível com status atualizado (sem redirecionamento).

### 10. Redesign dos Cards de Eventos

- Componente `Button` (`shared/ui/button`) agora suporta prop `size` com valores `"default"` (44px) e `"small"` (36px, fonte menor, padding reduzido).
- Token `--suoac-button-height-sm` adicionado ao design system (`globals.css` e `theme-tokens.ts`).
- Cards de evento na página de listagem redesenhados:
  - Header: tipo do evento + badge de status sempre na mesma linha.
  - Título: elemento standalone abaixo do header, linkável para a página de detalhe.
  - Metadata: ícones 16px, gap mais apertado, layout em linha no tablet+.
  - Footer unificado: preço e local na mesma linha com separador "·", link "Ver detalhes" ao lado.
  - Ações com `size="small"` e grid `auto-fit` com `minmax(7rem, max-content)` que distribui botões em 2 colunas no mobile e linha única no tablet, alinhados à direita.
  - Ordem dos botões: Editar → Excluir → Cancelar evento → Publicar evento (CTA principal sempre por último à direita).

### 11. Troca de Senha Obrigatória no Primeiro Acesso

- `features/change-password` com schema Zod (atual/nova/confirmação, nova ≠ atual), Server Action `changePasswordAction` e formulário (`"use client"`).
- `pages/change-password` (tela "Defina sua senha" em layout de duas colunas, espelhando o login) e rota `app/change-password`.
- `SessionUser`/`User` ganharam a flag opcional `mustChangePassword`; `signInAction` redireciona para `/change-password` quando ativa.
- Imposição em três camadas: `proxy.ts` (lê a flag do cookie e prende a navegação), redirect pós-login e rede de segurança de 403 (`PASSWORD_CHANGE_REQUIRED_MESSAGE` detectada em `useServerError`/`query-client`/`session-redirect`).
- Sucesso substitui os tokens via `createSession` e redireciona ao dashboard. Erros mapeados por campo (401 → senha atual, 422 → nova senha) e sessão inválida força relogin.
- Detalhado em `docs/architecture/SUOAC_AUTENTICACAO.md` §3.5.

### 12. Dashboard — Presença por Dia e Micro-interações

- Endpoint de dashboard passou a expor `passengersByDay`; nova seção "Presença por dia" (gráfico de colunas ancorado ao total de inscritos), renderizada só em eventos multi-dia.
- "Presença por dia" e "Pagamentos" lado a lado (grid responsivo) com hover-lift nos cards, animação de revelação das barras e tooltip por setor na barra de pagamentos (respeitando `prefers-reduced-motion`).
- Formatador global `formatWeekdayShort` em `shared/lib/date`.

### 13. Feature Flags (Vercel)

- Integração com o Flags SDK (`flags/next` + `@flags-sdk/vercel`) em `shared/feature-flags` (segmento isolado por ser server-only).
- Flag `SHOW_PENDING_MENU_ITEMS` controla a exibição de itens de menu cujas páginas ainda não foram implementadas.

### 14. Exportação de Inscritos (PDF e Excel)

- `features/export-event-passengers` (renomeada de `export-event-passengers-pdf` ao ganhar Excel):
  - schema Zod de opções de exportação (`model/export-form`, com `congregationId` e `format`) e
    modelo de opções (`model/export-options`, `format` sempre presente na URL, default `pdf`);
  - domínio de formato em `model/export-format` (`EXPORT_FORMATS`, labels, content-types e
    `parseExportFormat` para validar a query);
  - proxy server-only em `api/export-event-passengers-response` (valida o formato → 400, repassa o
    binário com Content-Type/Content-Disposition ou normaliza o erro em JSON);
  - botão de exportação (`ui/export-passengers-button`) com escolha de formato (PDF · Excel),
    feedback de loading por botão e erro via toast.
- Route Handler em `app/api/events/[eventId]/passengers/export/route.ts` faz a ponte com o backend
  (`export.pdf`/`export.xlsx`), repassando `congregationId`, `variant` e `format`.
- `shared/api/http-client` suporta respostas binárias (blob) para download de arquivos.
- Helper `shared/lib/download` dispara o download no browser lendo o `Content-Disposition`.
- Botão de exportação disponível na seção de inscritos do evento (`event-enrollments-section`).

### 15. Refinamento da Lista de Inscritos

- `event-enrollments-section` otimizada na exibição de dias e status de pagamento.
- Ajuste no estilo de `shared/ui/badge` para refletir os estados de pagamento.
- Query de `entities/event-passenger` ajustada para a nova exibição.

### 16. Assinatura HMAC-SHA256 dos Cookies de Sessão

- `shared/auth/session/session-signature.ts` assina e valida os cookies de sessão com HMAC-SHA256.
- `session.ts` passou a gravar/ler o payload assinado, rejeitando cookies adulterados.
- Documentado no `README.md`.

### 17. Headers de Segurança e Content-Security-Policy

- `next.config.ts` configura headers de segurança na resposta.
- `shared/security/content-security-policy` centraliza a montagem da política de CSP.
- `shared/auth/route-guard` extraído para padronizar a proteção de rotas no `proxy.ts`.

### 18. Página Financeira

- Implementada conforme `docs/plans/PLANO_PAGINA_FINANCEIRA.md` e `docs/product/hus/HISTORIA_USUARIO_FINANCEIRO.md`.
- Domínio financeiro consolidado em `entities/event-passenger` (sem cross-import entre entidades):
  tipos `FinancialSummary`/`FinancialTotals`/`CongregationFinancial`/`PaymentStatusCounts`/
  `EventPassengersFinancialResponse`, mapa `PAYMENT_STATUS_COUNT_KEYS`, query `fetchFinancialSummary`
  e a variante `fetchEventPassengersFinancial` (filtro por `paymentStatus`, key própria
  `eventPassengers.financialList`).
- `fetchActiveEvent`/`activeEventOptions` movidos de `pages/dashboard` para `entities/event` e novo
  `eventSelectOptions` (seletor de eventos, espelhando `congregationSelectOptions`).
- Novo componente genérico `shared/ui/select`.
- Widgets `financial-summary` (cards de totais + resumo por congregação ordenado por pendente) e
  `financial-passengers` (filtro de status com contagem + tabela paginada via `DataTable`).
- Página `pages/financial`: seletor de evento (default no ativo), escopo por papel (circuito vê todas
  as congregações; congregação vê só a própria, coluna "Congregação" só para circuito), estados de
  loading/erro/empty. Nome da congregação resolvido por join no front (`congregationSelectOptions`).
- Mutations financeiras (`register-payment`, inscrições) passam a invalidar `financialSummary.all`.
- Item de menu "Financeiro" segue `pending` na sidebar e na bottom nav (só visível com a flag
  `SHOW_PENDING_MENU_ITEMS` ligada): a página ainda não será liberada ao usuário final.
- Pendência: confirmar com o backend os endpoints `GET /events/:id/financial-summary` e o filtro
  `?paymentStatus=` em `/events/:id/passengers` (Fase 0 do plano — implementado conforme contrato da HU).

## Validação Mais Recente

Última validação completa executada após a implementação da página financeira:

```bash
yarn run check
```

Resultado: passou com typecheck, lint, architecture check, 701 testes unitários (119 arquivos) e Prettier.

## Próximos Passos Recomendados

1. Data Access Layer (`verifySession()`) para revalidar a sessão em Server Components.
2. Proteção por role no proxy (cookie `suoac-user`).
3. Ampliar relatórios e exportações sobre os dados de eventos/passageiros/pagamentos (PDF de inscritos
   já entregue na entrega 14; exportação do relatório financeiro segue pós-MVP).

## Pendências Conhecidas

- O arquivo `EVENTS.txt` contém o contrato usado para esta fase e está fora da documentação oficial versionada em `docs/`.
