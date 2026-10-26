---
trigger: always_on
description: Estratégia de redesign incremental em curso, coexistência de slices (-next) e feature flags REDESIGN_*
---

# Redesign em andamento

O sistema esta sendo redesenhado de forma incremental, com a aplicacao atual em producao o tempo
todo. O documento mestre e `docs/architecture/SUOAC_ESTRATEGIA_REDESIGN.md` — leia antes de tocar em
qualquer coisa do redesign. O que segue e o resumo operacional.

### Fonte da verdade do design

- `docs/design_handoff_suoac_redesign/*.dc.html` sao a especificacao final: cores, espacamentos,
  estados e microinteracoes. Quando uma captura em `screenshots/` divergir do HTML, **o HTML vence**.
- Esses arquivos sao artefatos recebidos, nao codigo do projeto. Estao fora do ESLint e do Prettier
  de proposito. **Nao os edite, nao os formate, nao os "corrija".**

### Coexistencia entre o sistema atual e o novo

- O ponto de decisao entre versao antiga e nova e **o arquivo de rota em `/app`**, que ja deve ser
  fino. Nenhum `if (flag)` espalhado pelo resto do codigo.
- O slice novo nasce ao lado do antigo com sufixo `-next` (na Fatia 1 foi `login-next`, promovido a
  `login` no corte, SUC-34).
- O slice `x` e o `x-next` **nunca** importam um do outro. Se algo for reaproveitavel, copie para o
  slice novo ou promova para uma camada inferior antes de usar nos dois.
- A URL nunca muda. Nao crie rotas `/v2`.
- O corte do codigo antigo e **PR proprio**, que so apaga, renomeia e remove a flag.

### Feature flags do redesign

- Uma flag por fatia, prefixo `REDESIGN_`, declarada com o helper `booleanFlag` e `defaultValue: false`.
- O PR que cria a flag cria tambem o card de remocao dela.
- Teto de **2 flags `REDESIGN_*` ligadas em producao** sem corte pendente. Na terceira, a prioridade
  passa a ser cortar, nao construir.

## O que nao fazer

- Redesenhar tela que nao e a da fatia da vez.
- Alterar aparencia ou responsividade de tela ainda nao redesenhada.
- Introduzir dependencia nova (biblioteca de UI, de animacao, de estado) sem decisao explicita
  registrada. O redesign se faz com o que o projeto ja tem.
