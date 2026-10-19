---
paths:
  - "**/*.test.{ts,tsx}"
  - "tests/setup/**"
  - "src/**/*-testing/**"
---

# Testes unitarios

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
