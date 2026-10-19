---
paths:
  - "src/**/ui/**"
  - "src/**/model/**"
---

# Formularios

- Use React Hook Form + Zod + `zodResolver`.
- Qualquer UI que colete e submeta dados do usuario deve ser modelada como formulario com React Hook Form, mesmo quando for simples (ex.: selecao de checkboxes em modal). Evite `useState` para armazenar valores de campos submetidos; reserve `useState` para estado visual ou de controle que nao faz parte do payload.
- Formularios com React Hook Form devem ser Client Components e declarar `"use client"`.
- Schema especifico de uma feature fica em `features/{feature}/model`.
- Schema de uma page simples fica em `pages/{page}/model`.
- Schema de entidade reutilizavel fica em `entities/{entity}/model`.
- Nao crie pasta global `schemas`.
- Nao coloque regras reutilizaveis diretamente no componente.
- Derive tipos com `z.infer` sempre que possivel.
- Erros de servidor em formularios, modais e fluxos de submissao devem usar `useServerError` de `@/shared/lib` em vez de `useState<string | null>(null)` local para `serverError`. Use `clearServerError()` antes de reenviar ou fechar e `showServerError(error, fallbackMessage?)` para exibir a falha com fallback humano.

Exemplo de organizacao:

```text
src/features/register-payment/
  ui/register-payment-form.tsx
  model/register-payment-schema.ts
  api/register-payment.mutation.ts
```
