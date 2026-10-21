---
trigger: model_decision
description: Quando criar ou editar estilos e tokens de tema em **/*.module.css, app/globals.css, src/app/styles/** ou app/**/*.tsx
paths:
  - "**/*.module.css"
  - "app/globals.css"
  - "src/app/styles/**"
  - "app/**/*.tsx"
---

# Tema claro e escuro

- Todo token de cor e de sombra precisa de par claro e escuro em `app/globals.css` e em
  `src/app/styles/theme-tokens.ts`. Os tipos de `theme-tokens.ts` quebram a compilacao se faltar um.
- CSS Modules **nunca** declaram cor, sombra ou scrim fora de `var(--suoac-*)`.
- O tema escuro so se aplica mediante opt-in explicito:

| Preferencia | Atributo em `<html>`  | Resultado                                           |
| ----------- | --------------------- | --------------------------------------------------- |
| escuro      | `data-theme="dark"`   | escuro sempre                                       |
| claro       | `data-theme="light"`  | claro sempre                                        |
| sistema     | `data-theme="system"` | decidido por `prefers-color-scheme`, sem JavaScript |
| ausente     | nenhum atributo       | claro, mesmo com o sistema operacional em escuro    |

- O ultimo caso e a trava da transicao: enquanto houver tela nao redesenhada, ninguem recebe tema
  escuro sem ter pedido.
- Interface nova so esta pronta depois de conferida **nos dois temas**.
