# Historia de Usuario — Dashboard

## Titulo

Implementar dashboard com visao geral do evento ativo e resumo financeiro

## Descricao

**Como** coordenador ou assistente (de circuito ou congregacao),
**quero** ver um painel com o resumo do evento ativo, passageiros inscritos e situacao financeira,
**para** acompanhar rapidamente o andamento do evento sem precisar navegar por varias telas.

## Contexto

A pagina de dashboard (`src/pages/dashboard`) existe como placeholder — exibe apenas uma saudacao
com o nome do usuario. O MVP precisa de um dashboard funcional que entregue valor imediato ao
coordenador ao abrir o sistema.

Existem dois perfis com visoes diferentes:

- **Coordenador/Assistente do Circuito**: ve o panorama de todas as congregacoes.
- **Coordenador/Assistente da Congregacao**: ve apenas os dados da propria congregacao.

## Requisitos de referencia

- `docs/product/SUOAC_REQUISITOS_v2.md` — secoes 2.5.1 (Dashboard do Circuito) e 2.5.2 (Dashboard da
  Congregacao)
- `docs/design/SUOAC — Identidade Visual Oficial.md` — design system e tokens visuais
- `docs/design/Design System Overview.png` — referencia visual

## Escopo MVP do dashboard

### Para ambos os perfis

- Saudacao com nome do usuario ("Bom dia, Joao!")
- Card do evento ativo (titulo, tipo, datas, local, status)
- Se nao houver evento ativo, exibir empty state orientando o usuario
- Prazos restantes para inscricao e pagamento (com destaque visual quando proximo do vencimento)
- Acoes rapidas: botao para ir a pagina de eventos, botao para cadastrar passageiro (link para a
  pagina do evento ativo)

### Dashboard do Circuito (coordenador/assistente do circuito)

- Total de passageiros inscritos no evento ativo (geral e, se multi-dia, por dia)
- Resumo financeiro geral:
  - Valor total esperado (soma de `totalAmount` de todos os `EventPassenger`)
  - Valor total recebido (soma de `paidAmount`)
  - Valor pendente (diferenca)
  - Percentual de pagamentos recebidos
- Lista resumida de congregacoes com status:
  - Nome da congregacao
  - Quantidade de inscritos
  - Valor esperado
  - Valor recebido
  - Status visual (ex: badge verde se quitou, amarelo se parcial, vermelho se pendente)

### Dashboard da Congregacao (coordenador/assistente da congregacao)

- Total de passageiros inscritos pela congregacao
- Resumo financeiro da congregacao:
  - Valor total esperado
  - Valor total recebido
  - Valor pendente
- Contagem de passageiros por status de pagamento (pendente, parcial, pago, isento)

## API e dados

### Endpoints

| #   | Endpoint                             | Quando usar                                          |
| --- | ------------------------------------ | ---------------------------------------------------- |
| 1   | `GET /events/:eventId/dashboard`     | Dados agregados do dashboard                         |
| 2   | `GET /circuits/:circuitId/events`    | Obter evento ativo (filtrar por status `OPEN`)       |

Todos os endpoints requerem `Authorization: Bearer <accessToken>`. Permissoes sao verificadas no
backend pelo token do usuario.

---

### 1. `GET /events/:eventId/dashboard`

Query params:

| Param            | Tipo | Obrigatorio | Default | Descricao                                                     |
| ---------------- | ---- | ----------- | ------- | ------------------------------------------------------------- |
| `congregationId` | UUID | nao         | —       | Drill-down em congregacao especifica (so para roles de circuito) |

Comportamento por role:

| Role         | congregationId | Resultado                                                   |
| ------------ | -------------- | ----------------------------------------------------------- |
| Congregacao  | (ignorado)     | Dashboard da propria congregacao (usa JWT)                   |
| Circuito     | ausente        | Visao geral do evento inteiro — `congregation: null`        |
| Circuito     | presente       | Drill-down na congregacao especifica — `congregation: {...}` |

Response (200):

```ts
{
  event: {
    id: string;
    title: string;               // "Assembleia de Circuito SP-019 A"
    type: string;                // "ASSEMBLY" | "REGIONAL_CONVENTION"
    status: string;              // "DRAFT" | "OPEN" | "CLOSED" | "FINISHED" | "CANCELLED"
    ticketPrice: string;         // "25.00"
    registrationDeadline: string; // ISO 8601
    paymentDeadline: string;      // ISO 8601
    venue: string;
    address: string;
    city: string;
    state: string;
    days: Array<{
      id: string;
      date: string;              // ISO 8601
      label: string;             // "Dia 1 - Sabado"
      dayNumber: number;
      status: string;            // "ACTIVE" | "CANCELLED"
    }>;
  };

  // null quando circuito SEM congregationId (visao geral)
  // objeto quando congregacao OU circuito COM congregationId
  congregation: {
    id: string;
    name: string;
    listStatus: string;          // "PENDING" | "FINALIZED"
  } | null;

  stats: {
    totalPassengers: number;     // inclui isentos
    totalExpected: string;       // exclui isentos
    totalReceived: string;       // exclui isentos
    totalPending: string;        // exclui isentos
  };

  paymentBreakdown: {
    paid: number;
    partial: number;
    pending: number;
    exempt: number;
  };

  pendingPassengers: Array<{     // top 5 com pagamento pendente/parcial
    id: string;                  // eventPassenger ID
    passengerName: string;
    totalAmount: string;         // "25.00"
    paidAmount: string;          // "10.00"
    pendingAmount: string;       // "15.00" (calculado)
    paymentStatus: string;       // "PENDING" | "PARTIAL"
  }>;

  totalPendingPassengers: number; // total real (para "ver todos")
}
```

---

### Como distinguir os cenarios no front

```ts
if (response.congregation === null) {
  // Visao geral do circuito — stats refletem TODAS as congregacoes
  // Nao ha listStatus para exibir
} else {
  // Visao de congregacao — stats refletem UMA congregacao
  // response.congregation.listStatus -> badge "PENDING" | "FINALIZED"
}
```

---

### `pendingPassengers` — detalhes

- Maximo 5 registros (top 5 ordenados por nome A-Z)
- Apenas status `PENDING` ou `PARTIAL` (nunca `PAID` ou `EXEMPT`)
- `totalPendingPassengers` e o total real (para mostrar "Ver todos os 13 pendentes")
- `pendingAmount = totalAmount - paidAmount` (ja calculado pelo backend)

---

### Exemplos de resposta

Congregacao (ou circuito com drill-down):

```json
{
  "event": {
    "id": "e1...",
    "title": "Assembleia de Circuito SP-019 A",
    "type": "ASSEMBLY",
    "status": "OPEN",
    "ticketPrice": "25.00",
    "registrationDeadline": "2026-07-01T23:59:59.000Z",
    "paymentDeadline": "2026-07-15T23:59:59.000Z",
    "venue": "Salao de Assembleias",
    "address": "Rua das Flores, 100",
    "city": "Sao Paulo",
    "state": "SP",
    "days": [
      { "id": "d1...", "date": "2026-07-20T00:00:00.000Z", "label": "Dia 1 - Sabado", "dayNumber": 1, "status": "ACTIVE" }
    ]
  },
  "congregation": {
    "id": "c1...",
    "name": "Central",
    "listStatus": "PENDING"
  },
  "stats": {
    "totalPassengers": 30,
    "totalExpected": "675.00",
    "totalReceived": "425.00",
    "totalPending": "250.00"
  },
  "paymentBreakdown": { "paid": 14, "partial": 5, "pending": 8, "exempt": 3 },
  "pendingPassengers": [
    { "id": "ep1...", "passengerName": "Ana Costa", "totalAmount": "25.00", "paidAmount": "10.00", "pendingAmount": "15.00", "paymentStatus": "PARTIAL" },
    { "id": "ep2...", "passengerName": "Carlos Lima", "totalAmount": "50.00", "paidAmount": "0.00", "pendingAmount": "50.00", "paymentStatus": "PENDING" },
    { "id": "ep3...", "passengerName": "Fernanda Reis", "totalAmount": "25.00", "paidAmount": "0.00", "pendingAmount": "25.00", "paymentStatus": "PENDING" },
    { "id": "ep4...", "passengerName": "Joao Silva", "totalAmount": "25.00", "paidAmount": "15.00", "pendingAmount": "10.00", "paymentStatus": "PARTIAL" },
    { "id": "ep5...", "passengerName": "Maria Souza", "totalAmount": "25.00", "paidAmount": "0.00", "pendingAmount": "25.00", "paymentStatus": "PENDING" }
  ],
  "totalPendingPassengers": 13
}
```

Circuito sem congregationId (visao geral):

```json
{
  "event": { "...": "mesma estrutura" },
  "congregation": null,
  "stats": {
    "totalPassengers": 148,
    "totalExpected": "3375.00",
    "totalReceived": "1850.00",
    "totalPending": "1525.00"
  },
  "paymentBreakdown": { "paid": 60, "partial": 22, "pending": 54, "exempt": 12 },
  "pendingPassengers": [
    { "id": "ep10...", "passengerName": "Alberto Nunes", "totalAmount": "25.00", "paidAmount": "0.00", "pendingAmount": "25.00", "paymentStatus": "PENDING" }
  ],
  "totalPendingPassengers": 76
}
```

---

### Regra de negocio: EXEMPT nos totais

Valores monetarios (`totalExpected`, `totalReceived`, `totalPending`) **excluem isentos** em todos
os endpoints. Isentos contam em `totalPassengers` e `paymentBreakdown.exempt`, mas nao geram
expectativa de cobranca.

```
totalPassengers = paid + partial + pending + exempt
totalExpected   = SUM(totalAmount) WHERE status != EXEMPT
totalPending    = totalExpected - totalReceived
```

---

### Erros possiveis

| Status | Quando                                                                          |
| ------ | ------------------------------------------------------------------------------- |
| 400    | congregationId nao e UUID valido                                                |
| 401    | Token ausente/expirado                                                          |
| 403    | Evento de outro circuito / Congregacao sem congregationId no JWT                |
| 404    | Evento nao existe, congregacao nao existe/inativa, ou DRAFT para role congregacao |

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

## Arquitetura FSD

```text
src/pages/dashboard/
  ui/
    dashboard-page.tsx          — pagina principal (client component)
    dashboard-page.module.css
    dashboard-page.test.tsx
  index.ts

src/widgets/dashboard-summary/  — widget com os cards de resumo
  ui/
    dashboard-summary.tsx
    dashboard-summary.module.css
    dashboard-summary.test.tsx
  index.ts
```

> A estrutura acima e uma sugestao. O desenvolvedor pode organizar de forma diferente desde que
> respeite as regras de FSD documentadas em `AGENTS.md`.

## Regras de UI e UX

- Mobile-first: cards empilhados no mobile, grid no desktop
- Usar cards como unidade base (radius 20px, sombra leve, padding generoso)
- Skeleton loading enquanto os dados carregam
- Empty state se nao houver evento ativo
- Cores semanticas para status financeiro (verde = quitado, amarelo = parcial, vermelho = pendente)
- Tipografia conforme hierarquia do design system (H1 para titulo, H3 para subtitulos de cards)
- Valores monetarios formatados com `formatCurrency` de `@/shared/lib`
- Datas formatadas com `formatDate` de `@/shared/lib`

## Criterios de aceite

- [ ] Dashboard renderiza dados reais do evento ativo via API
- [ ] Perfil de circuito ve panorama de todas as congregacoes
- [ ] Perfil de congregacao ve apenas dados da propria congregacao
- [ ] Empty state quando nao ha evento ativo
- [ ] Skeleton loading durante carregamento
- [ ] Erro com retry se a API falhar
- [ ] Layout responsivo (mobile e desktop)
- [ ] Segue design system (cores, tipografia, espacamento, tokens)
- [ ] Testes unitarios co-localizados
- [ ] `yarn run check` passa sem erros

## Fora do escopo (pos-MVP)

- Graficos e charts (Recharts)
- Alertas de capacidade de onibus
- Ranking de congregacoes por percentual de pagamento
- Notificacoes e lembretes
- Historico de eventos passados no dashboard
