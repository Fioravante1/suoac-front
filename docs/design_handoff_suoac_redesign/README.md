# Handoff: Redesign SUOAC (Dashboard do circuito + Login)

## Visão geral
Redesign do painel do **Coordenador do arranjo de ônibus no circuito** no SUOAC: gestão de eventos (congressos/assembleias), ônibus, passageiros, pagamentos, congregações e listas de embarque. Inclui login, recuperação de senha, primeiro acesso por convite e **autocadastro de circuito**.

Repositório alvo: `Fioravante1/suoac-front` (branch `main`). Tokens base vieram de `app/globals.css` e `src/app/styles/theme-tokens.ts`; o shell atual (`src/widgets/app-shell/ui/*`, menu lateral) é **substituído** pela navegação descrita abaixo.

## Sobre os arquivos
Os arquivos `.dc.html` são **referências de design em HTML** — protótipos que mostram aparência e comportamento, não código de produção. A tarefa é **recriá-los no ambiente existente do `suoac-front`** (Next.js/React, padrões e bibliotecas já usados no repo). Abra os arquivos no navegador (precisam do `support.js` ao lado) para ver e interagir. Toda a lógica de dados é mockada no próprio arquivo (classe `Component`), servindo como especificação das regras.

## Fidelidade
**Alta fidelidade.** Cores, tipografia, espaçamentos, raios, sombras, estados e microinterações são finais. Recriar pixel-perfect usando os componentes do codebase. Tema claro e escuro são ambos finais.

---

## Navegação (sem menu lateral)
Largura mínima de design: **1280px**. Fonte única: **Geist** (400/500/600/700, Google Fonts).

### Faixa fixa do evento (topo, fundo `--navy`)
Altura 68px, padding horizontal 40px, texto branco. Da esquerda para a direita:
- Logo (`assets/logo-mark-dark.png`, 34×34, radius 9) + "SUOAC" (700 17px, letter-spacing .05em) / "Circuito SP-17" (400 12px, branco 66%).
- Divisor 1px×24px (branco 15%).
- **Seletor de evento**: botão 38px, radius 12, borda branco 14%, ponto de status 8px + nome + período (branco 60%). Abre dropdown 360px (surface, radius 16, sombra `0 24px 60px rgb(13 43 69/.28)`) com eventos do circuito (nome, período · status, check no ativo) e ação **"Criar novo evento"** (primary, 600 14px).
- Espaçador.
- **Busca** (ícone lupa 40×40, atalho ⌘K): abre paleta de comandos centralizada com busca de passageiros, congregações, ônibus e ações.
- **Notificações**: popover com feed; "marcar todas como lidas".
- **Encerrar inscrições**: abre confirmação "Encerrar inscrições agora?" com consequências; após confirmar, o estado do evento muda (ponto de status e rótulos).
- **Cadastrar passageiro** (primário): abre o modal "Novo passageiro" (ver abaixo). É o único ponto para cadastro avulso.
- **Avatar** do usuário: popover com nome, **circuito** e **privilégio "Coordenador do arranjo de ônibus no circuito"**, troca de tema claro/escuro e sair.

Abaixo da faixa: resumo do evento (contagem regressiva "Faltam N dias", KPIs) e **abas**: Visão geral · Passageiros · Financeiro · Congregações · Ônibus · Listas e exportações. Estado `tabC`.

### Dock
Barra flutuante inferior com ações rápidas (estado `dockOpen`).

---

## Telas

### 1. Visão geral
- **Ocupação dos ônibus**: seletor de dias (Sexta/Sábado/Domingo) + filtros rápidos (todos, lotados, com vagas…). Mostra **4 ônibus por vez** desenhados com poltronas (46 lugares); **setas** navegam entre páginas quando há mais (ex.: 19 ônibus/dia). Poltronas animam ao entrar.
- **Clique em um ônibus** → modal central "embarque" com a planta do ônibus e lista de passageiros daquele ônibus/dia (busca, status de pagamento, poltrona). Não usar drawer lateral.
- **Ranking de pagamento · 10 primeiras** congregações.
- **Precisa da sua atenção**: pendências acionáveis.
- **Rastreamento dos ônibus**: quem compartilha localização ("Quem compartilha a localização?" modal).

### 2. Passageiros
- Lista paginada com busca, filtros por congregação, pagamento, dias e ordenação ("Inscritos recentemente" etc.). Linha expansível com detalhes (RG, dias, ônibus/poltrona por dia, pagamentos).
- Seleção múltipla com ações em lote.
- Botão primário da aba: **"Importar lista"** (não duplica "Cadastrar passageiro").
- **Importar lista de passageiros** (modal 820px, 2 etapas com indicador):
  1. *Arquivo*: dropzone (.xlsx/.xls/.csv), estado de arraste (borda/fundo primary, ícone sobe 6px), "Baixar modelo", "Usar exemplo". Colunas exigidas: Nome e RG.
  2. *Revisão*: congregação (dropdown abre **abaixo**), dias de viagem (cards com "N lugares livres"; vermelho se insuficiente). Chips de contagem. Tabela: checkbox · Nome+nota · RG · Situação. Classificação por RG: **Novo** (info), **Cadastro anterior** ("Viajou em …", primary), **Já inscrito · ignorado** (desabilitado), **RG incompleto** (input inline, formato `00.000.000-0`, vira "RG corrigido"). Rodapé: resumo "N × D dias · R$ X a receber" (R$ 40/dia/passageiro) e CTA "Importar N passageiros".
  - Ao confirmar: aloca nas primeiras poltronas livres, status Pendente, vai para Passageiros ordenado por recentes, toast de sucesso.

### 3. Financeiro
Total previsto/recebido/pendente, gráfico por congregação (hover), ordenação, lista de pagamentos. **Registrar pagamento** (modal): busca passageiro, valor, método; status **Parcial exige informar o valor pago**.

### 4. Congregações
- Filtro rápido por congregação em **chips com nome completo** (sem iniciais), suporta 20+ congregações com rolagem/“ver todas”.
- Cards/linhas por congregação: inscritos, pagamento, coordenador, por dia.
- **Nova congregação** (modal): nome, **código da congregação (obrigatório)**, **Coordenador do arranjo de ônibus na congregação** (nome, telefone, e-mail, enviar convite), **assistente opcional** (nome, telefone, e-mail, enviar convite).

### 5. Ônibus
Lista por dia com ocupação, motorista/empresa. **Adicionar ônibus** (modal). **Excluir ônibus**: confirmação que mostra quantos passageiros serão realocados; ao excluir, passageiros vão para os próximos ônibus com vaga e os ônibus são renumerados (ver `deleteBus()`).

### 6. Listas e exportações
Geração de lista de embarque por ônibus/dia e por congregação, escolha de colunas, prévia do documento. Na lista de embarque: **congregação no cabeçalho** (não como coluna), **sem coluna de assinatura**, **sem hora de saída**.

### Modal "Novo passageiro"
Modal central (não drawer). Busca em **registros de eventos anteriores** por nome/RG (sugestões com "Viajou em …"); se não existir, opção de **cadastrar novo passageiro**. Campos: nome, RG, congregação (dropdown abre abaixo do campo), dias, pagamento (Pago/Parcial/Pendente; Parcial pede valor). Ao salvar: animação de "bilhete" e toast.

### 7. Login (`SUOAC Login.dc.html`)
Layout dividido: painel escuro `#0d2b45` à esquerda com **timeline** animada das etapas do evento (linha verde progressiva sincronizada com os itens; sem trilho de fundo), formulário à direita (surface).
- **Login**: e-mail, senha (mostrar/ocultar), lembrar, "Esqueci a senha", erro com shake.
- **Esqueci a senha**: envio de link + estado de confirmação.
- **Recebeu um convite?**: coordenadores de congregação entram pelo link recebido.
- **Autocadastro do circuito** ("Seu circuito ainda não usa o SUOAC?"), barra de progresso em 3 etapas:
  1. Seus dados: nome, e-mail (validação), celular (máscara `(00) 00000-0000`), senha ≥ 8 com medidor de força (4 barras).
  2. Circuito: código (ex.: SP-17, maiúsculas), cidade, UF (2 letras), privilégio fixo "Coordenador do arranjo de ônibus no circuito", aceite de termos.
  3. Congregações: **a primeira linha é a congregação do próprio coordenador — nome e código obrigatórios**; demais opcionais (adicionar/remover; código obrigatório se nome preenchido). "Adicionar as outras depois".
  4. Confirmação de e-mail: código de 6 dígitos (caixas individuais, reenviar).
  5. Sucesso: resumo (coordenador, circuito, sua congregação, total) → "Ir para o painel".
  Erros aparecem em faixa `--crit-s`/`--crit` acima do formulário.

---

## Interações e animações
- Popovers/dropdowns: `rise` 0.2s `cubic-bezier(.2,.8,.2,1)` (opacity 0 + translateY 10px → 0). Fecham por clique fora (overlay transparente fixo).
- Modais: overlay `rgb(10 26 41/.55)` + `backdrop-filter: blur(4px)`; entrada `popC2` 0.3s (translateY 16px, scale .97). Sempre **centrais**, nunca laterais.
- Linhas de lista: `rise` com stagger 25ms (máx. 0.4s).
- Barras: `grow` (scaleX 0→1). Poltronas: `seat` (scale .6→1). Gráficos: `draw` (stroke-dashoffset).
- Troca de tema: transição de background/color 0.3s.
- Toast inferior central (`pop`), some sozinho.
- Botões primários: hover `--primary-d`; ghost: hover `--muted`.
- Inputs: focus borda `--primary` + `box-shadow: 0 0 0 4px var(--primary-s)`.

## Estado (principal)
`tabC` (aba), `evIdx` (evento), `selDay`, `busPage`, `busFilter`, `busView`; modais: `evOpen, notifOpen, userOpen, searchOpen, confirmOpen, drawerOpen (novo passageiro), payOpen, ncOpen (nova congregação), abOpen (adicionar ônibus), delBus, shOpen, impOpen/imp`; filtros de Passageiros `pq, pCong, pPay, pDays, pSort, pPage, pSel`; Financeiro `finSort, finHover`; Congregações `cgF, cgQ, cgDay`; Listas `lxCols, lxBusAll`. Dados: eventos → dias → ônibus (46 lugares) → passageiros (`legs[dia] = {bus, seat}`, `status`, `total`, `paid`), congregações (nome, código, coordenador, assistente), histórico de passageiros de eventos anteriores (busca por nome/RG).

## Design tokens
Aplicar via CSS custom properties (no protótipo, escopadas em `[data-art]`; tema escuro em `[data-theme="dark"]`).

| Token | Claro | Escuro |
|---|---|---|
| --bg | #f7f9f8 | #0e1413 |
| --surface | #ffffff | #151d1b |
| --muted | #f1f5f3 | #1c2623 |
| --border | #e3e8e6 | #25312e |
| --border2 | #cfd8d4 | #34433f |
| --text | #1e1f24 | #e9efed |
| --text2 | #667085 | #9aa8a3 |
| --primary | #1f6e5a | #4fb393 |
| --primary-d | #174e40 | #7fcfb4 |
| --primary-s | #e6f4ef | #183229 |
| --on-primary | #ffffff | #0e1413 |
| --navy | #0d2b45 | #0a1a29 |
| --succ / -s | #2e9e5b / #e7f6ee | #4cc07c / #163121 |
| --attn / -t / -s | #f5b700 / #8a6d00 / #fff4cf | #f2c14b / #f2c14b / #342b10 |
| --crit / -s | #d64545 / #fdecec | #f07272 / #3a1d1d |
| --info / -s | #2f6fed / #e8f0ff | #82a9ff / #18233d |
| --glass | rgb(255 255 255/.78) | rgb(21 29 27/.78) |
| --shadow | 0 1px 2px rgb(16 24 40/.04), 0 8px 24px rgb(31 110 90/.06) | 0 1px 2px rgb(0 0 0/.3), 0 8px 24px rgb(0 0 0/.25) |

Fundo da página fora do app: `#e4e9e7`. Links: `#1f6e5a`, hover `#174e40`.

**Tipografia (Geist)**: 12/400-500 (labels, uppercase + letter-spacing .04em em cabeçalhos de seção), 13, 14 (corpo), 15–16 (botões/inputs), 17–20 (títulos de card), 22–28 (títulos de modal/aba, letter-spacing −0.01/−0.02em), 32–44 (KPIs), 64 (contagem regressiva). Números com `font-variant-numeric: tabular-nums`.

**Raios**: 6 (checkbox), 8–10 (itens de lista, botões pequenos), 11–13 (inputs/botões 40–48px), 14–16 (cards, dropdowns), 18–22 (modais, cards grandes), 999 (pills/chips).

**Sombras**: dropdown `0 24px 60px rgb(13 43 69/.28)`; menu `0 18px 40px rgb(13 43 69/.2)`; modal `0 40px 100px rgb(10 26 41/.45)`; botão primário `0 6px 16px rgb(31 110 90/.25)` (login: `0 10px 24px rgb(31 110 90/.28)`).

**Espaçamento**: múltiplos de 2/4 — gaps 4, 6, 8, 10, 12, 14, 16, 18, 22, 24, 28; padding de página 40px; modais 22–28px.

**Alturas**: botões/inputs 36, 40, 42, 44, 46, 48, 54px (CTA login). Ícones stroke 1.8–2.2, 15–18px (estilo Lucide).

## Assets
- `assets/logo-mark.png` (tema claro) e `assets/logo-mark-dark.png` (sobre navy) — recortados de `public/logo.png` / `public/logo_simple_sidebar.png` do repo.
- Ícones: SVG inline estilo Lucide; usar a biblioteca de ícones do codebase (ex.: `lucide-react`).

## Arquivos
- `SUOAC Dashboard.dc.html` — faixa do evento, abas e todos os modais (fonte da verdade do painel).
- `SUOAC Login.dc.html` — login, recuperação, convite e autocadastro do circuito.
- `support.js` — runtime necessário apenas para abrir os protótipos no navegador.
- `assets/` — logos.
- `screenshots/` — capturas de referência (tema escuro, reduzidas para caber na tela; alguns textos quebram linha só por causa da redução — o HTML é a referência final): visão geral, ocupação, passageiros, importar lista, financeiro, congregações, ônibus, listas e exportações, novo passageiro, login e cadastro do circuito.
