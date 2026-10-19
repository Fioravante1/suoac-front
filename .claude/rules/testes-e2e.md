---
paths:
  - "tests/e2e/**"
  - "playwright.config.ts"
---

# Testes E2E com Playwright

Decisao de 09/10/2026: **Playwright e obrigatorio no projeto**. Substitui a regra anterior, que
proibia E2E sem decisao explicita.

Os testes ficam em `tests/e2e/`, rodam contra o **build de producao** (nao `next dev`, que difere em
CSP, cache e tempo de resposta) e **nao entram em `yarn run check`**: o check roda a cada mudanca e
precisa ser rapido — subir navegador a cada vez transformaria validacao em espera, e validacao lenta
acaba sendo pulada. No CI a suite roda em job proprio, em paralelo com os demais.

E2E existe para cobrir o que `jsdom` nao alcanca: navegacao real entre rotas, cookies HttpOnly,
Content-Security-Policy, renderizacao no servidor, tema aplicado antes da primeira pintura e o
fluxo completo que atravessa varias telas.

**O que precisa de E2E**

- Todo fluxo critico de usuario: entrar no sistema, recuperar senha, aceitar convite, autocadastrar
  circuito, inscrever passageiro, registrar pagamento, importar lista, gerar lista de embarque.
- Toda fatia do redesign, antes de a flag dela ser considerada pronta para producao.
- Regressao visual das telas redesenhadas, **nos dois temas**.

**Regras**

- E2E cobre fluxo, nao unidade. Nao duplique em E2E o que o teste unitario ja cobre — a suite fica
  lenta e a lentidao e o que faz uma suite ser ignorada.
- Selecione elementos por papel e texto acessivel (`getByRole`, `getByLabel`), nunca por classe de
  CSS Module, que e gerada e muda sozinha.
- Dados vem de interceptacao de rede (`page.route`), nao de backend real: E2E deve falhar por
  regressao de codigo, nunca porque um dado mudou no servidor. A contrapartida e explicita — a
  integracao real com a API e verificada em staging antes de ligar a flag da fatia, nao aqui.
- Baselines visuais sao capturadas em ambiente padronizado e com animacao desabilitada. Atualizar
  baseline exige inspecionar o diff imagem a imagem, como se revisa codigo.
- Teste intermitente e bug: corrija ou remova. Nunca `.skip`, nunca retry para mascarar.

```bash
yarn test:e2e      # suite Playwright
yarn test:e2e:ui   # modo interativo, para investigar falha
yarn test:all      # unitarios + E2E
```

Regressao visual com `toHaveScreenshot()` ainda **nao** esta configurada: baselines tiradas antes de
existir tela redesenhada fotografariam apenas telas que vao morrer. Entra na Fatia 1, junto com a
primeira tela nova — e com o tratamento das duas armadilhas conhecidas, fonte/plataforma e animacao
de entrada.
