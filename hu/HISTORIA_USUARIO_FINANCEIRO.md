# Historia de Usuario — Pagina Financeira

## Titulo

Implementar pagina financeira com resumo de pagamentos por evento

## Descricao

**Como** coordenador ou assistente (de circuito ou congregacao),
**quero** ver um resumo financeiro detalhado do evento com a situacao de pagamento de cada
passageiro,
**para** saber exatamente quem ja pagou, quem esta pendente e quanto falta arrecadar.

## Contexto

A pagina financeira (`src/pages/financial`) existe como placeholder — exibe apenas um titulo e
uma descricao estatica. O MVP precisa de uma tela que permita ao coordenador acompanhar e cobrar
pagamentos de forma organizada.

A pagina de detalhe do evento (`src/pages/event-detail`) ja lista passageiros e permite registrar
pagamentos individualmente. A pagina financeira complementa com uma **visao focada em dinheiro**:
consolidados, filtros por status de pagamento e identificacao rapida de quem esta devendo.

Existem dois perfis com visoes diferentes:

- **Coordenador/Assistente do Circuito**: ve o financeiro de todas as congregacoes.
- **Coordenador/Assistente da Congregacao**: ve apenas o financeiro da propria congregacao.

## Requisitos de referencia

- `docs/SUOAC_REQUISITOS_v2.md` — secoes 2.4.1, 2.4.2 e 2.4.3
- `docs/SUOAC — Identidade Visual Oficial.md` — design system e tokens visuais
- `docs/Design System Overview.png` — referencia visual

## Escopo MVP da pagina financeira

### Selecao de evento

- Seletor de evento no topo da pagina (dropdown ou similar)
- Por padrao, selecionar o evento ativo (status `OPEN`) se houver
- Permitir selecionar eventos passados para consulta

### Cards de resumo financeiro

Exibir cards no topo com os totais do evento selecionado:

- **Valor total esperado** — soma de `totalAmount` de todos os `EventPassenger`
- **Valor total recebido** — soma de `paidAmount`
- **Valor pendente** — diferenca (esperado - recebido)
- **Percentual recebido** — barra de progresso ou indicador visual

Para coordenador de circuito, esses totais sao de todas as congregacoes. Para coordenador de
congregacao, apenas da propria.

### Tabela de passageiros com foco financeiro

Tabela usando `DataTable` de `@/shared/ui/data-table` com as colunas:

| Coluna | Descricao |
|---|---|
| Nome | Nome do passageiro |
| Congregacao | Nome da congregacao (visivel apenas para perfil de circuito) |
| Dias | Quantidade de dias inscritos |
| Valor total | `totalAmount` formatado |
| Valor pago | `paidAmount` formatado |
| Pendente | Diferenca, com destaque visual se > 0 |
| Status | Badge de `paymentStatus` (Pendente / Parcial / Pago / Isento) |

### Filtro por status de pagamento

- Filtros clicaveis (chips ou tabs) para filtrar a tabela:
  - Todos
  - Pendente (`PENDING`)
  - Parcial (`PARTIAL`)
  - Pago (`PAID`)
  - Isento (`EXEMPT`)
- O filtro selecionado deve destacar visualmente a contagem (ex: "Pendente (12)")

### Visao por congregacao (apenas perfil de circuito)

- Acima ou abaixo da tabela de passageiros, exibir um resumo por congregacao:
  - Nome da congregacao
  - Total de inscritos
  - Valor esperado
  - Valor recebido
  - Valor pendente
  - Indicador visual de progresso (ex: barra ou percentual)
- Ordenar por valor pendente decrescente (quem deve mais aparece primeiro)

## API e dados

| Dado | Endpoint | Observacao |
|---|---|---|
| Lista de eventos | `GET /circuits/:circuitId/events` | Para o seletor de evento |
| Passageiros do evento | `GET /events/:eventId/passengers` | Retorna `totalAmount`, `paidAmount`, `paymentStatus` |
| Congregacoes | `GET /circuits/:circuitId/congregations` | Para agrupar por congregacao |

> **Nota**: os totais financeiros (soma de `totalAmount`, soma de `paidAmount`) provavelmente
> precisam ser calculados no frontend a partir da lista de passageiros, ou o backend precisa
> fornecer um endpoint de agregacao. Se a lista de passageiros for paginada, calcular totais no
> front com os dados de uma pagina nao sera preciso. Verificar com o backend se existe ou sera
> necessario um endpoint como `GET /events/:eventId/financial-summary`. Alinhar antes de
> implementar.

### Query keys existentes

```ts
queryKeys.events.list(circuitId, page)
queryKeys.eventPassengers.list(eventId, page)
queryKeys.congregations.list(circuitId, page)
```

### Constantes de dominio existentes

```ts
// entities/event-passenger/model
PAYMENT_STATUSES        // { PENDING, PARTIAL, PAID, EXEMPT }
PAYMENT_STATUS_LABELS   // { PENDING: "Pendente", ... }
PAYMENT_STATUS_BADGE_VARIANTS  // { PENDING: "warning", ... }
```

## Arquitetura FSD

```text
src/pages/financial/
  ui/
    financial-page.tsx          — pagina principal (client component)
    financial-page.module.css
    financial-page.test.tsx
  index.ts

src/widgets/financial-summary/  — widget com cards de resumo e tabela
  ui/
    financial-summary.tsx
    financial-summary.module.css
    financial-summary.test.tsx
  index.ts
```

> A estrutura acima e uma sugestao. O desenvolvedor pode organizar de forma diferente desde que
> respeite as regras de FSD documentadas em `AGENTS.md`.

## Regras de UI e UX

- Mobile-first: cards empilhados no mobile, grid no desktop
- Usar `DataTable` para a tabela de passageiros (nunca montar primitivos manualmente)
- Usar `InfoCard` ou cards customizados para os totais financeiros
- Skeleton loading enquanto os dados carregam
- Empty state se nao houver passageiros inscritos no evento selecionado
- Paginacao na tabela de passageiros via `usePagination` de `@/shared/lib`
- Filtro de status deve resetar a paginacao para pagina 1 ao mudar
- Cores semanticas:
  - Verde para pago/quitado
  - Amarelo para parcial
  - Vermelho para pendente
  - Cinza/azul para isento
- Valores monetarios formatados com `formatCurrency` de `@/shared/lib`
- Badge de status usando constantes de `entities/event-passenger`

## Criterios de aceite

- [ ] Pagina exibe resumo financeiro real do evento selecionado
- [ ] Seletor de evento funciona e atualiza os dados ao trocar
- [ ] Tabela de passageiros com informacoes financeiras renderiza corretamente
- [ ] Filtro por status de pagamento filtra a tabela
- [ ] Perfil de circuito ve dados de todas as congregacoes + resumo por congregacao
- [ ] Perfil de congregacao ve apenas dados da propria congregacao
- [ ] Empty state quando nao ha passageiros inscritos
- [ ] Skeleton loading durante carregamento
- [ ] Erro com retry se a API falhar
- [ ] Paginacao funcional na tabela
- [ ] Layout responsivo (mobile e desktop)
- [ ] Segue design system (cores, tipografia, espacamento, tokens)
- [ ] Testes unitarios co-localizados
- [ ] `yarn run check` passa sem erros

## Fora do escopo (pos-MVP)

- Exportacao de relatorio financeiro (PDF/planilha)
- Ranking de congregacoes por percentual de pagamento
- Graficos de evolucao financeira
- Comparativo entre eventos
- Relatorio de inadimplencia
