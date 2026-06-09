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

- `docs/product/SUOAC_REQUISITOS_v2.md` — secoes 2.4.1, 2.4.2 e 2.4.3
- `docs/design/SUOAC — Identidade Visual Oficial.md` — design system e tokens visuais
- `docs/design/Design System Overview.png` — referencia visual

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

| Coluna      | Descricao                                                     |
| ----------- | ------------------------------------------------------------- |
| Nome        | Nome do passageiro                                            |
| Congregacao | Nome da congregacao (visivel apenas para perfil de circuito)  |
| Dias        | Quantidade de dias inscritos                                  |
| Valor total | `totalAmount` formatado                                       |
| Valor pago  | `paidAmount` formatado                                        |
| Pendente    | Diferenca, com destaque visual se > 0                         |
| Status      | Badge de `paymentStatus` (Pendente / Parcial / Pago / Isento) |

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

### Endpoints

| #   | Endpoint                                          | Quando usar                              |
| --- | ------------------------------------------------- | ---------------------------------------- |
| 1   | `GET /events/:eventId/financial-summary`          | Cards de totais + tabela de congregacoes |
| 2   | `GET /events/:eventId/passengers?paymentStatus=X` | Listagem detalhada com filtro por status |
| 3   | `GET /circuits/:circuitId/events`                 | Seletor de evento                        |

Todos os endpoints requerem `Authorization: Bearer <accessToken>`. Permissoes sao verificadas no
backend pelo token do usuario.

---

### 1. `GET /events/:eventId/financial-summary`

Sem query params. O backend resolve o escopo automaticamente pelo JWT:

- **Circuito** — totais do evento inteiro + array `congregations` com todas
- **Congregacao** — totais da propria congregacao + array `congregations` com 1 item (a propria)

Response (200):

```ts
{
  eventId: string;           // UUID do evento
  eventTitle: string;        // "Assembleia de Circuito"
  ticketPrice: string;       // "25.00" (Decimal como string)

  totals: {
    totalPassengers: number;   // contagem total (inclui isentos)
    totalExpected: string;     // soma de totalAmount dos NAO-isentos
    totalReceived: string;     // soma de paidAmount dos NAO-isentos
    totalPending: string;      // totalExpected - totalReceived
    byStatus: {
      paid: number;            // qtd com status PAID
      partial: number;         // qtd com status PARTIAL
      pending: number;         // qtd com status PENDING
      exempt: number;          // qtd com status EXEMPT
    };
  };

  congregations: Array<{
    congregationId: string;
    congregationName: string;
    totalPassengers: number;   // inclui isentos
    totalExpected: string;     // exclui isentos
    totalReceived: string;     // exclui isentos
    totalPending: string;      // exclui isentos
    byStatus: { paid: number; partial: number; pending: number; exempt: number };
  }>;
  // ordenado por congregationName (A-Z)
}
```

Exemplo real (circuito, 2 congregacoes):

```json
{
  "eventId": "e1e2e3e4-...",
  "eventTitle": "Assembleia de Circuito SP-019 A",
  "ticketPrice": "25.00",
  "totals": {
    "totalPassengers": 48,
    "totalExpected": "1075.00",
    "totalReceived": "625.00",
    "totalPending": "450.00",
    "byStatus": { "paid": 20, "partial": 8, "pending": 15, "exempt": 5 }
  },
  "congregations": [
    {
      "congregationId": "c1...",
      "congregationName": "Central",
      "totalPassengers": 30,
      "totalExpected": "675.00",
      "totalReceived": "425.00",
      "totalPending": "250.00",
      "byStatus": { "paid": 14, "partial": 5, "pending": 8, "exempt": 3 }
    },
    {
      "congregationId": "c2...",
      "congregationName": "Norte",
      "totalPassengers": 18,
      "totalExpected": "400.00",
      "totalReceived": "200.00",
      "totalPending": "200.00",
      "byStatus": { "paid": 6, "partial": 3, "pending": 7, "exempt": 2 }
    }
  ]
}
```

---

### 2. `GET /events/:eventId/passengers`

Query params:

| Param           | Tipo   | Obrigatorio | Default | Valores                        |
| --------------- | ------ | ----------- | ------- | ------------------------------ |
| `page`          | number | nao         | 1       | >= 1                           |
| `limit`         | number | nao         | 20      | 1–100                          |
| `paymentStatus` | string | nao         | —       | PENDING, PARTIAL, PAID, EXEMPT |

Escopo por role (automatico via JWT):

- **Circuito** — todos os passageiros do evento
- **Congregacao** — apenas passageiros da propria congregacao

Response (200):

```ts
{
  data: Array<{
    id: string;                // UUID do eventPassenger
    passenger: {
      id: string;
      name: string;
      rg: string;              // descriptografado
      phone: string | null;
    };
    totalAmount: string;       // "25.00"
    paidAmount: string;        // "10.00"
    paymentStatus: string;     // "PENDING" | "PARTIAL" | "PAID" | "EXEMPT"
    exemptionReason: string | null;
    observations: string | null;
    eventId: string;
    congregationId: string;
    registeredById: string;
    createdAt: string;         // ISO 8601
    updatedAt: string;         // ISO 8601
    days: Array<{
      id: string;
      eventDayId: string;
      dayNumber: number;
      date: string;            // ISO 8601
      label: string;           // "Dia 1 - Sabado"
      checkedIn: boolean;
      checkedInAt: string | null;
    }>;
  }>;

  meta: {
    total: number;       // total FILTRADO (respeita paymentStatus)
    page: number;
    limit: number;
    totalPages: number;
  };

  financialSummary: {
    // totais SEM filtro de paymentStatus (panorama geral sempre)
    totalPassengers: number;
    totalExpected: string;     // exclui isentos
    totalReceived: string;     // exclui isentos
    totalPending: string;      // exclui isentos
    byStatus: { paid: number; partial: number; pending: number; exempt: number };
  };
}
```

Comportamento chave:

- `meta.total` = total **filtrado** (ex: com `?paymentStatus=PENDING`, conta apenas pendentes)
- `financialSummary` = totais **sem filtro** (panorama geral, independente do `paymentStatus` no query)
- Isso permite mostrar "Exibindo 15 pendentes de 48 total" e os cards financeiros ao mesmo tempo

---

### Regra de negocio: EXEMPT nos totais

Valores monetarios (`totalExpected`, `totalReceived`, `totalPending`) **excluem isentos** em todos
os endpoints. Isentos contam em `totalPassengers` e `byStatus.exempt`, mas nao geram expectativa
de cobranca.

```
totalPassengers = paid + partial + pending + exempt
totalExpected   = SUM(totalAmount) WHERE status != EXEMPT
totalPending    = totalExpected - totalReceived
```

---

### Erros possiveis

| Status | Quando                                              |
| ------ | --------------------------------------------------- |
| 401    | Token ausente/expirado                              |
| 403    | Evento de outro circuito                            |
| 404    | eventId nao existe (ou DRAFT para role congregacao) |
| 400    | paymentStatus com valor invalido                    |

Formato de erro (padrao em toda a API):

```json
{ "statusCode": 404, "message": "Evento nao encontrado", "error": "Not Found" }
```

---

### Query keys existentes

```ts
queryKeys.events.list(circuitId, page);
queryKeys.eventPassengers.list(eventId, page);
queryKeys.congregations.list(circuitId, page);
```

### Constantes de dominio existentes

```ts
// entities/event-passenger/model
PAYMENT_STATUSES; // { PENDING, PARTIAL, PAID, EXEMPT }
PAYMENT_STATUS_LABELS; // { PENDING: "Pendente", ... }
PAYMENT_STATUS_BADGE_VARIANTS; // { PENDING: "warning", ... }
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
