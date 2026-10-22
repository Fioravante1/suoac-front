---
trigger: model_decision
description: Quando criar ou editar arquivos de rota do App Router (page.tsx, layout.tsx, route.ts, template.tsx, not-found.tsx, error.tsx), middleware.ts ou next.config.ts
paths:
  - "**/page.tsx"
  - "**/layout.tsx"
  - "**/route.ts"
  - "**/template.tsx"
  - "**/not-found.tsx"
  - "**/error.tsx"
  - "middleware.ts"
  - "next.config.ts"
---

# Next.js 16

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
