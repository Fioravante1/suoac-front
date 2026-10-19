---
paths:
  - "src/**"
  - "app/**"
  - "pages/**"
---

# Arquitetura e organizacao (Feature-Sliced Design)

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

## Validação arquitetural

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
