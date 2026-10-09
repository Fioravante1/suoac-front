# SUOAC — Estratégia de Redesign Incremental

**Criado em:** 09/10/2026
**Status:** em execução — Fatia 0 em andamento
**Última atualização:** 09/10/2026
**Proposta de design:** `docs/design_handoff_suoac_redesign/`

Este documento define **como** o redesign do SUOAC será executado sem parar a aplicação atual, que já
está em uso. Não descreve o design em si — isso é o handoff. Descreve o processo: padrão de
migração, uso de feature flags, ordem das fatias, critério de corte do código antigo e as regras que
mudam no `AGENTS.md` durante a transição.

---

## 1. Premissas (decisões já tomadas)

| #   | Decisão                                                                                                                                                              | Consequência                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | O backend é nosso. Funcionalidades novas (ônibus/poltronas, importação, notificações, busca, autocadastro, recuperação de senha, convite) ganham endpoints próprios. | Cada fatia tem um par front/API. A flag da fatia só liga quando a API está de pé em staging.                                                                                              |
| P2  | **Desktop-first durante o redesign.** O handoff tem largura mínima de 1280px e nenhuma tela nova nasce responsiva.                                                   | Suspende a regra mobile-first do `AGENTS.md` (ver §9). O app antigo continua responsivo enquanto existir.                                                                                 |
| P3  | **Mobile só depois do redesign**, e apenas para funcionalidades essenciais.                                                                                          | Vira uma fase própria, pós-corte do legado. Não bloqueia nenhuma fatia.                                                                                                                   |
| P4  | Rollout por ambiente: flag ligada em `staging.suoac.com` primeiro; produção liga por fatia, depois de aprovada.                                                      | Sem `identify()` nem targeting por usuário. Override individual em produção via Vercel Toolbar (§4.4).                                                                                    |
| P5  | A primeira fatia é a **tela de Login**.                                                                                                                              | É a fatia mais isolada do sistema: nenhuma outra tela depende dela, e ela não depende do shell. Serve para exercitar toda a mecânica (flag, tokens, tema escuro, corte) com risco mínimo. |

> P4 não é só preferência: na tela de login **não existe usuário identificado**, então targeting por
> usuário é tecnicamente impossível ali. Ambiente + override de sessão é o único mecanismo que
> funciona na Fatia 1.

---

## 2. O padrão: Strangler Fig com fachada fina

O padrão de referência é o **Strangler Fig**: o sistema novo cresce ao lado do antigo, com uma
camada de roteamento (a _fachada_) decidindo qual implementação atende cada requisição; quando a
nova prova que funciona, a antiga é removida. O ciclo tem três verbos — **transformar** (construir a
nova fatia em paralelo), **coexistir** (as duas rodam atrás da fachada, com tráfego reversível) e
**eliminar** (apagar a antiga).

No SUOAC a fachada já existe e não precisa ser inventada: **os arquivos de rota em `/app`**. O
`AGENTS.md` já manda que eles sejam finos — "conectar rotas/layouts do Next a pages/providers FSD".
Um arquivo de rota que escolhe entre dois slices FSD é exatamente a fachada do Strangler Fig, no
ponto mais barato possível de inserir e de remover.

```tsx
// app/(auth)/login/page.tsx — a fachada
import { redesignLoginFlag } from "@/shared/feature-flags";
import { LoginPage } from "@/pages/login";
import { LoginPage as LoginPageNext } from "@/pages/login-next";

export default async function Page() {
  return (await redesignLoginFlag()) ? <LoginPageNext /> : <LoginPage />;
}
```

Isso combina dois padrões clássicos de propósito diferente, e vale saber qual é qual:

- **Branch by Abstraction** é a técnica de desenvolvimento: uma camada de abstração aponta para a
  implementação antiga enquanto a nova é construída em paralelo na mesma branch da trunk. Aqui a
  abstração é o arquivo de rota.
- **Feature Toggle** é o mecanismo de decisão em tempo de execução: qual implementação a abstração
  serve, agora, neste ambiente, para este usuário.

A diferença prática: a abstração permite **construir** sem branch longa; a flag permite **reverter**
sem deploy. Precisamos das duas.

### 2.1 Por que não `/v2` nas URLs

Rotas paralelas (`/login` e `/v2/login`) parecem mais simples, mas quebram o reverso: links, cookies
de sessão, `redirectTo` do route guard e qualquer coisa que o usuário tenha salvo apontam para a URL
antiga. E o corte final vira uma migração de URLs, não um `rm -rf`. **As URLs ficam estáveis**; o que
muda é o que é renderizado nelas.

### 2.2 Quando usar rewrite no `proxy.ts` em vez da fachada

A fachada na rota coloca os dois slices no mesmo bundle de rota. Para o login isso é irrelevante
(duas telas pequenas). Se em alguma fatia pesada o custo de bundle importar, a alternativa é o
padrão **precompute** do Flags SDK: o proxy avalia as flags, gera um código criptografado e faz
`NextResponse.rewrite()` para uma rota parametrizada, mantendo a página estática e cacheável.

Para o SUOAC, que é um app autenticado e renderizado sob demanda, isso é otimização prematura.
**Default: fachada na rota.** Mudamos de mecanismo só se uma fatia provar que precisa — e a troca
não afeta as outras fatias, porque a decisão está isolada no arquivo de rota.

---

## 3. Coexistência no código FSD

### 3.1 Slices paralelos com sufixo `-next`

O slice novo nasce ao lado do antigo, com o mesmo nome e sufixo `-next`:

```text
src/pages/login/          # atual, intocado
src/pages/login-next/     # redesign
```

Razões:

- **Apagar é trivial.** No corte: `rm -rf src/pages/login && mv src/pages/login-next src/pages/login`,
  mais um ajuste de import na rota. Nada de desentrelaçar código novo de código velho.
- **Não polui o slice antigo.** Misturar as duas versões dentro de `src/pages/login/ui/` faria cada
  arquivo carregar a pergunta "isso é do novo ou do velho?" até o fim do redesign.
- **A regra de dependência do FSD continua valendo** sem exceção: `login-next` é um slice de `pages`
  como qualquer outro, e `eslint-plugin-boundaries` + Steiger seguem cobrindo.

Regra dura: **`login-next` nunca importa de `login`, e vice-versa.** Cross-import entre slices da
mesma camada já é proibido pelo `AGENTS.md`; aqui a proibição tem um motivo extra — qualquer
dependência entre os dois impede o corte limpo.

Se algo do slice antigo for genuinamente reaproveitável (um schema Zod, um mapper de DTO), ele é
**copiado** para o slice novo ou **promovido** para a camada de baixo (`entities`/`shared`) antes de
ser usado pelos dois. Copiar duplicação temporária com data de morte conhecida é mais barato que
criar um acoplamento que vai precisar ser desfeito.

### 3.2 Componentes de `shared/ui`

Os primitivos novos (inputs 50px com ícone, botões 54px, modais 18–22px de raio, chips) **não
substituem** os atuais no lugar. Duas opções, decididas caso a caso:

1. **Estender o componente existente** quando a mudança for aditiva e o visual antigo continuar
   intacto — nova `variant`, novo `size`. Preferida: evita duplicar lógica de acessibilidade.
2. **Criar o par `-next`** (`shared/ui/text-field-next`) quando a estrutura de DOM ou o
   comportamento mudarem a ponto de o componente antigo virar refém do novo.

A pergunta que decide: _mexer nisso pode quebrar uma tela que ainda não foi redesenhada?_ Se sim,
par `-next`. Lembrando que `shared/ui` não tem barrel na raiz — o import aponta para o subdiretório,
então os dois convivem sem ambiguidade.

### 3.3 Tema escuro sem contaminar o legado

Este é o ponto transversal mais perigoso do redesign. Hoje o tema escuro está **deliberadamente
desligado**: `app/globals.css` força `color-scheme: light` inclusive dentro de
`@media (prefers-color-scheme: dark)`. O redesign exige tema escuro completo e um toggle no shell.

O risco: tokens são globais. Ligar `[data-theme="dark"]` no `<html>` repinta **todas** as telas,
inclusive as que ainda não foram redesenhadas — que não têm contraste testado em dark e vão parecer
quebradas.

Estratégia, em três camadas:

1. **Tokens dark são aditivos.** Declarados apenas sob `html[data-theme="dark"]`, reaproveitando os
   nomes `--suoac-*` já existentes e acrescentando os que o handoff pede (`--suoac-color-navy`,
   `--suoac-color-border-2`, `--suoac-color-glass`). Nenhum valor do tema claro muda. Telas antigas
   continuam idênticas enquanto o atributo não existir.
2. **Escopo de contenção no legado.** Enquanto houver tela v1 acessível, cada fachada que ainda
   serve o slice antigo embrulha o conteúdo em um wrapper que **redeclara os tokens claros**
   (`src/app/styles/legacy-light-scope.css`). Assim, mesmo com o usuário em dark no shell novo, uma
   tela antiga se renderiza em claro — feio? Um pouco. Quebrado e ilegível? Não. Esse arquivo nasce
   com data de morte: é deletado junto com o último slice v1.
3. **Persistência por cookie, não `localStorage`.** O tema é lido no Server Component raiz e o
   atributo vai no `<html>` antes da resposta sair, o que elimina o flash de tema errado. Trocar
   para `localStorage` reintroduz o flash porque o valor só existe depois da hidratação. O
   `theme-tokens.ts` ganha o espelho dos valores dark, mantendo a fonte de verdade dupla já adotada
   no projeto.

> Nota de CSP: o `proxy.ts` gera CSP com nonce por requisição. Se a solução de tema precisar de um
> script inline (não deve precisar, já que o cookie é lido no servidor), ele terá de carregar o nonce
> — não relaxe a CSP por causa do tema.

---

## 4. Disciplina de feature flags

A infraestrutura já existe e não muda: `flags/next` + `vercelAdapter()`, declaração em
`src/shared/feature-flags/feature-flags.ts` via o helper `booleanFlag`, avaliação server-side e
repasse por props aos Client Components.

### 4.1 Uma flag por fatia, não uma flag por redesign

Uma flag única para o redesign inteiro só pode ser ligada quando tudo estiver pronto — ou seja,
devolve o big bang que estamos tentando evitar, e concentra o risco em um único dia. Uma flag por
fatia dá o que a literatura chama de _per-slice cutover_: liga um domínio, observa, reverte só
aquele domínio sem tocar nos outros.

Nomenclatura: prefixo `REDESIGN_` + nome da fatia.

```text
REDESIGN_LOGIN            Fatia 1 — login, recuperação, convite, autocadastro
REDESIGN_APP_SHELL        Fatia 2 — faixa do evento, abas, seletor, avatar
REDESIGN_OVERVIEW         Fatia 3 — visão geral e ocupação dos ônibus
REDESIGN_PASSENGERS       Fatia 4 — passageiros e importação de lista
REDESIGN_FINANCIAL        Fatia 5
REDESIGN_CONGREGATIONS    Fatia 6
REDESIGN_BUSES            Fatia 7
REDESIGN_EXPORTS          Fatia 8
```

O prefixo separa, numa olhada na lista, o que é temporário do que é permanente — `SHOW_PENDING_MENU_ITEMS`,
a flag que já existe, é de outra natureza e fica fora desse grupo.

### 4.2 Toda flag nasce com atestado de óbito

Flags de release são as de vida mais curta por definição: devem morrer no momento em que a
funcionalidade está totalmente lançada. O hábito mais eficaz contra dívida de flag é **abrir a issue
de remoção antes de mergear o código que a introduz**.

Regra para este redesign:

- O PR que **cria** a flag também cria a issue "remover `REDESIGN_X`", com dono e data-alvo.
- O comentário JSDoc da flag registra a fatia, a data de criação e o critério de remoção.
- Nenhuma fatia nova começa com mais de **duas** flags de redesign ligadas em produção sem corte
  pendente. Se acumular três, a prioridade passa a ser cortar, não construir.

### 4.3 O que a flag controla (e o que não controla)

A flag decide **qual UI é renderizada**. Ela não deve espalhar `if (flag)` pelo código de domínio.
Se uma mutation precisa se comportar diferente nas duas versões, isso é sinal de que a lógica devia
estar em `entities`/`features` compartilhado, não duplicada atrás de um toggle. O ponto de decisão
ideal por fatia é **um só**: o arquivo de rota.

### 4.4 Testar em produção sem expor a todos

O Vercel Toolbar expõe o Flags Explorer, que lê as flags por `/.well-known/vercel/flags` e permite
sobrescrevê-las. O override vai num cookie `vercel-flag-overrides`, criptografado com `FLAGS_SECRET`
(JWE), e **só afeta quem o aplicou, no ambiente onde foi aplicado** — não altera o estado da flag em
produção para os demais.

Isso cobre a necessidade de "ver o novo com dados reais antes de liberar" sem construir targeting
por usuário. Confirme que `FLAGS_SECRET` está configurado nos dois ambientes.

### 4.5 Kill switch

Enquanto a flag existe, ela é também o kill switch da fatia: deu problema em produção, desliga e o
usuário volta à tela antiga em segundos, sem deploy. **Esse é o motivo pelo qual o código antigo não
pode ser apagado no mesmo PR que liga a flag** — ver §6.

---

## 5. Ordem das fatias

A ordem segue três critérios: isolamento (quanto menos coisa depende da fatia, melhor para começar),
dependência de API nova, e valor entregue.

| #   | Fatia                              | Depende de     | API nova | Observação                                                                                                                                 |
| --- | ---------------------------------- | -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 0   | **Fundação**                       | —              | não      | Tokens dark, escopo de contenção do legado, primitivos novos, `ThemeProvider` por cookie. Sem flag: é aditivo e invisível até alguém usar. |
| 1   | **Login**                          | Fundação       | sim      | Recuperação de senha, aceite de convite e autocadastro de circuito **não existem hoje** (§7). O login em si usa a API atual.               |
| 2   | **Shell do evento**                | Fundação       | parcial  | Faixa fixa, seletor de evento, abas, avatar, encerrar inscrições. Substitui `widgets/app-shell`. Pré-requisito de todas as abas.           |
| 3   | **Visão geral**                    | Shell          | sim      | Ocupação por poltrona é a maior dependência de backend do projeto.                                                                         |
| 4   | **Passageiros + importação**       | Shell          | sim      | Importação de planilha com classificação por RG.                                                                                           |
| 5   | **Financeiro**                     | Shell          | pouca    | Mais próximo do que já existe; bom candidato a adiantar se a API de ônibus atrasar.                                                        |
| 6   | **Congregações**                   | Shell          | sim      | Código de congregação e coordenador/assistente com convite.                                                                                |
| 7   | **Ônibus**                         | Shell, Fatia 3 | sim      | Criar/excluir ônibus com realocação e renumeração.                                                                                         |
| 8   | **Listas e exportações**           | Shell, Fatia 7 | parcial  | Já existe export de inscritos; muda formato e seleção de colunas.                                                                          |
| 9   | **Busca ⌘K e notificações**        | Shell          | sim      | Transversal; depois das abas existirem para serem alvo da busca.                                                                           |
| 10  | **Corte final e mobile essencial** | todas          | —        | Remoção do legado, limpeza de flags, remoção do escopo de contenção, fase mobile (P3).                                                     |

Nota sobre a Fatia 2: o shell é o maior ponto de "tudo ou nada" do redesign, porque a navegação
muda de rotas com sidebar para abas dentro de um evento. Enquanto `REDESIGN_APP_SHELL` estiver
ligada e as abas ainda forem telas v1, cada aba renderiza a tela antiga dentro do shell novo, com o
escopo de contenção de tema (§3.3). É intencionalmente feio por um período — e é o preço de não
fazer big bang.

---

## 6. Critério de corte (quando o antigo morre)

Uma fatia só é cortada quando todas as condições abaixo são verdadeiras:

- [ ] Flag ligada em **produção** há pelo menos um ciclo de uso real da funcionalidade (para o
      login: um dia útil; para telas de evento: um evento com inscrições abertas).
- [ ] Nenhum rollback acionado no período.
- [ ] Paridade funcional verificada contra a lista de comportamentos da tela antiga — não "parece
      pronto", mas uma lista explícita conferida.
- [ ] Testes unitários do slice novo cobrindo o que os do antigo cobriam (os testes antigos somem
      junto com o slice; o que eles protegiam precisa estar protegido no novo).
- [ ] Nenhum import remanescente apontando para o slice antigo (`grep` antes do `rm`).

O corte é **um PR próprio**, separado do PR que liga a flag, e faz exatamente quatro coisas:

1. `rm -rf` do slice antigo;
2. `mv` do slice `-next` para o nome definitivo;
3. remoção da flag e da fachada (o arquivo de rota volta a ter uma linha: `export { default } from "@/pages/login"`);
4. fechamento da issue de remoção.

Um PR que só apaga é um PR que se revisa em dois minutos e se reverte em um comando. Misturar o
corte com funcionalidade nova é o que faz esse passo ser adiado para sempre.

---

## 7. Dependências de backend

O redesign assume capacidades que a API atual (`src/shared/api/http-client/endpoints.ts`) não tem.
Levantamento por fatia — o desenho fino de cada contrato fica para o início da fatia correspondente,
mas a existência da dependência já é conhecida agora:

**Fatia 1 — Login** (único detalhado aqui, por ser a próxima)

| Necessidade              | Hoje                               | Falta                                                        |
| ------------------------ | ---------------------------------- | ------------------------------------------------------------ |
| Entrar                   | `POST /auth/login`                 | —                                                            |
| Esqueci a senha          | —                                  | solicitar link + redefinir com token                         |
| Aceite de convite        | `entities/invitation` existe vazio | validar token do convite e concluir cadastro                 |
| Autocadastro de circuito | —                                  | criar coordenador + circuito + congregações em uma transação |
| Confirmação de e-mail    | —                                  | enviar/validar código de 6 dígitos, com reenvio              |
| "Manter conectado"       | sessão por cookie HttpOnly         | duração de sessão estendida                                  |

O autocadastro é a peça mais pesada: cria usuário, circuito e N congregações de uma vez, com a
primeira congregação obrigatoriamente a do próprio coordenador. Vale decidir cedo se é **um
endpoint transacional** ou uma sequência de chamadas com estado intermediário — a diferença aparece
na UI (o que acontece se o usuário abandonar na etapa 3).

**Demais fatias:** ônibus e poltronas (modelo de dados novo, inclusive `legs[dia] = {bus, seat}` por
passageiro), importação de planilha com deduplicação por RG, notificações, busca global,
código de congregação, coordenador/assistente por congregação.

Regra de sequenciamento: **a flag de uma fatia não liga em staging antes da API dela estar em
staging.** Construir a tela contra mock é aceitável como exploração; dar a fatia por pronta com mock
não é.

---

## 8. Rede de segurança

O que já temos e continua valendo: `yarn run check` (typecheck, lint, Steiger, Vitest, Prettier) e
teste unitário co-localizado obrigatório para todo artefato novo.

O que o redesign acrescenta como risco: **regressão visual e de comportamento em telas que ninguém
está olhando**, porque a atenção está na fatia da vez. Teste unitário não pega isso.

**Decisão tomada em 09/10/2026: Playwright é obrigatório** (card SUC-40, `AGENTS.md` §8). A opção 1
abaixo fica como registro do que foi avaliado.

Três opções, em ordem de custo:

1. **Checklist manual por fatia** (custo zero, confiabilidade baixa): antes de ligar a flag, abrir
   as telas vizinhas nos dois temas e conferir. Funciona para as primeiras fatias.
2. **Playwright com `toHaveScreenshot()`** (custo médio): baselines commitadas, diff visual no CI.
   É a rede de segurança padrão para migração de UI, exatamente porque pega o que teste funcional não
   pega. Exige decisão explícita — o `AGENTS.md` hoje proíbe adicionar E2E sem ela.
3. **Serviço de visual review** (custo alto): fora de escopo.

**Resultado:** adotada a opção 2, já a partir da Fatia 0. Toda fatia precisa de E2E antes de sua
flag ser considerada pronta para produção, e toda tela redesenhada precisa de baseline visual nos
dois temas. As duas armadilhas conhecidas — fonte/plataforma e animação de entrada — são tratadas no
setup (SUC-40), não descobertas depois.

Independente disso: as capturas em `docs/design_handoff_suoac_redesign/screenshots/` são a referência
de aceite visual de cada fatia, e o `.dc.html` é a fonte da verdade quando a captura e o HTML
divergirem.

---

## 9. Mudanças no `AGENTS.md` durante a transição

As regras abaixo conflitavam com o redesign. **Todas já foram aplicadas no `AGENTS.md` em
09/10/2026** — o registro fica aqui como histórico da decisão:

1. **Mobile-first (§6).** Suspensa para slices do redesign enquanto durar a transição (P2/P3).
   Redação proposta: _"Durante o redesign (ver `SUOAC_ESTRATEGIA_REDESIGN.md`), telas novas são
   desktop-first com largura mínima de 1280px. Telas v1 permanecem responsivas. A fase mobile
   acontece após o corte do legado e cobre apenas funcionalidades essenciais."_
2. **Tema único.** O `AGENTS.md` não prevê tema escuro. Acrescentar a regra de que todo token novo
   precisa de par claro/escuro, e que CSS Module nunca declara cor fora de `var(--suoac-*)`.
3. **E2E proibido sem decisão (§8).** Se adotarmos Playwright visual (§8), a decisão vira uma linha
   no `AGENTS.md` delimitando o escopo: _visual regression apenas, não E2E funcional._

Enquanto essas edições não acontecem, qualquer agente trabalhando no repositório vai seguir a regra
antiga e produzir trabalho que precisa ser refeito. **Editar o `AGENTS.md` faz parte da Fatia 0.**

---

## 10. Fluxo de trabalho por fatia

Sequência fixa, repetida em cada fatia:

1. **Contrato de API** acordado e implementado em staging (quando houver dependência).
2. **Branch curta a partir de `develop`**, uma por card, no padrão `tipo/suc-XX-descricao-curta`
   (`AGENTS.md` §11). Branch longa de redesign é exatamente o que o Branch by Abstraction existe
   para evitar; se a fatia não cabe em PRs de poucos dias, ela está grande demais e deve ser
   subdividida.
3. **PR 1 — slice novo sem fachada.** O código `-next` entra no repositório sem estar ligado a
   nenhuma rota. Inerte, revisável, com testes.
4. **PR 2 — flag + fachada.** A rota passa a escolher. Flag desligada por padrão
   (`defaultValue: false`, como o helper já faz). Issue de remoção criada.
5. **Validação em staging** com a flag ligada.
6. **Produção**: flag ligada, override individual antes se quiser conferir com dados reais.
7. **Observação** pelo período definido em §6.
8. **PR 3 — corte.** Apaga o antigo, renomeia o novo, remove a flag.

Cada um desses PRs roda `yarn run check` e é pequeno o suficiente para ser revisado de verdade.

---

## 11. Riscos

| Risco                                         | Mitigação                                                                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Flags acumulam e o legado nunca morre         | Teto de 2 flags de redesign vivas em produção (§4.2); corte é PR próprio e priorizado.                                     |
| Shell novo com abas v1 dentro fica incoerente | Período curto e assumido; escopo de contenção de tema evita o pior (ilegibilidade). Priorizar as abas logo após a Fatia 2. |
| API nova atrasa e trava a fila                | Fatia 5 (Financeiro) é a de menor dependência — serve de fatia de folga para não parar o front.                            |
| Tema escuro vaza para telas não redesenhadas  | `legacy-light-scope.css` (§3.3), removido no corte final.                                                                  |
| Mobile fica sem dono depois do redesign       | É a Fatia 10, no mesmo plano, não um "depois a gente vê".                                                                  |
| Duplicação `-next` vira permanente            | Cada slice `-next` tem issue de corte desde o nascimento; o sufixo torna o débito visível em qualquer `ls`.                |

---

## 12. Rastreamento no Jira

Projeto **SUOAC (`SUC`)** em `https://fioravantechiozzi.atlassian.net`. Cada fatia é um épico; o
trabalho de backend fica no mesmo projeto, com label `backend`, dentro do épico da fatia que o
consome — a dependência front/API precisa ficar visível no mesmo board.

| Fatia                        | Épico  | Detalhamento       |
| ---------------------------- | ------ | ------------------ |
| 0 — Fundação                 | SUC-4  | histórias criadas  |
| 1 — Login e acesso           | SUC-5  | histórias criadas  |
| 2 — Shell do evento          | SUC-6  | quebrar ao iniciar |
| 3 — Visão geral e ocupação   | SUC-7  | quebrar ao iniciar |
| 4 — Passageiros e importação | SUC-8  | quebrar ao iniciar |
| 5 — Financeiro               | SUC-9  | quebrar ao iniciar |
| 6 — Congregações             | SUC-10 | quebrar ao iniciar |
| 7 — Ônibus                   | SUC-11 | quebrar ao iniciar |
| 8 — Listas e exportações     | SUC-12 | quebrar ao iniciar |
| 9 — Busca e notificações     | SUC-13 | quebrar ao iniciar |
| 10 — Corte final e mobile    | SUC-14 | quebrar ao iniciar |

As fatias 2 a 10 ganham histórias **no início da própria fatia**, não agora: o contrato de API de
cada uma muda o formato das histórias de front, e card escrito com seis meses de antecedência é card
reescrito.

Labels em uso: `redesign`, `fatia-N`, `frontend`, `backend`, `design-system`, `feature-flags`,
`corte-legado`, `divida-temporaria`, `decisao`, `testes`, `documentacao`.

---

## 13. Fontes

Padrões e práticas que fundamentam este documento:

- [Embracing the Strangler Fig pattern for legacy modernization — Thoughtworks](https://www.thoughtworks.com/insights/articles/embracing-strangler-fig-pattern-legacy-modernization-part-three)
- [The Strangler Fig Pattern — Steve Kinney, Enterprise UI](https://stevekinney.com/courses/enterprise-ui/strangler-fig-introduction)
- [The strangler fig pattern: modernizing without a big-bang rewrite — Netguru](https://www.netguru.com/blog/strangler-fig-pattern-guide)
- [Make Large Scale Changes Incrementally with Branch By Abstraction — Continuous Delivery](https://continuousdelivery.com/2011/05/make-large-scale-changes-incrementally-with-branch-by-abstraction/)
- [How to Branch by Abstraction with Feature Flags — Harness](https://www.harness.io/blog/branch-by-abstraction)
- [11 best practices for building and scaling feature flag systems — Unleash](https://docs.getunleash.io/guides/feature-flag-best-practices)
- [The Engineer's Guide To Feature Flag Technical Debt — GrowthBook](https://www.growthbook.io/blog/engineering-guide-feature-flag-technical-debt)
- [Feature Flag Governance: Lifecycle Best Practices](https://beefed.ai/en/feature-flag-governance-lifecycle-best-practices)
- [Implementing Feature Flagging with the Next.js App Router — Aurora Scharff](https://aurorascharff.no/posts/implementing-feature-flagging-with-nextjs-app-router/)
- [Flags SDK — Precompute](https://flags-sdk.dev/concepts/precompute)
- [Flags Explorer — Reference (Vercel)](https://vercel.com/docs/feature-flags/flags-explorer/reference)
- [Introducing feature flag management from the Vercel Toolbar](https://vercel.com/blog/toolbar-feature-flags)
- [The developer's guide to design tokens and CSS variables — Penpot](https://penpot.app/blog/the-developers-guide-to-design-tokens-and-css-variables/)
- [Building a Dark Mode System in Next.js App Router — Without Layout Flash](https://dev.to/aon_infotech_3a1b6ff525fc/building-a-dark-mode-system-in-nextjs-app-router-without-layout-flash-5gf9)
- [Playwright Visual Regression: Baselines, Flake & CI Guide](https://testquality.com/playwright-visual-regression-guide/)
