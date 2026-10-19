---
paths:
  - "src/**/api/**"
  - "src/**/model/**"
  - "src/shared/api/**"
  - "src/shared/lib/**"
---

# Server state, API e DTOs

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
