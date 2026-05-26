# Progresso do Projeto - SUOAC Frontend

**Atualizado em:** 25/05/2026
**Fase atual:** Domínio MVP - eventos

Este arquivo acompanha o estado do frontend, o que já foi entregue e quais frentes ainda precisam avançar.

## Estado Geral

| Frente                 | Estado      | Observação                                                                               |
| ---------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| Fundação Next.js + FSD | Concluído   | Estrutura base, App Router em `/app`, FSD em `src/`, Steiger e ESLint configurados.      |
| Design system base     | Concluído   | Tokens globais, componentes compartilhados e padrões visuais iniciais.                   |
| Autenticação e sessão  | Concluído   | Login, logout, sessão via cookies HttpOnly, proxy de proteção e RBAC de navegação.       |
| App shell autenticado  | Concluído   | Sidebar desktop, bottom nav mobile e rotas privadas.                                     |
| Congregações           | Parcial     | Listagem, criação, edição e exclusão já integradas ao backend.                           |
| Eventos                | Parcial     | Listagem, criação, publicação, edição, exclusão e cancelamento já integrados ao backend. |
| Passageiros            | Placeholder | Tela existe, domínio e fluxo ainda não implementados.                                    |
| Pagamentos             | Placeholder | Tela existe, domínio e fluxo ainda não implementados.                                    |
| Dashboards             | Placeholder | Tela inicial existe, widgets de domínio ainda não implementados.                         |

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

## Validação Mais Recente

Última validação completa executada após o redesign dos cards e ajuste das regras de cancelamento:

```bash
yarn run check
```

Resultado: passou com typecheck, lint, architecture check, 229 testes unitários e Prettier.

## Próximos Passos Recomendados

1. Implementar `entities/passenger` e `features/enroll-passenger`.
2. Implementar `entities/payment` e `features/register-payment`.
3. Evoluir widgets `event-overview` e `financial-summary` para alimentar dashboards reais.

## Pendências Conhecidas

- O arquivo `EVENTS.txt` contém o contrato usado para esta fase e está fora da documentação oficial versionada em `docs/`.
