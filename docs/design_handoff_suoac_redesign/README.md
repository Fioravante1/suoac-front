# Handoff: Redesign SUOAC (Dashboard do circuito + Login + Convite)

## Visão geral
Redesign do painel do **Coordenador do arranjo de ônibus no circuito** no SUOAC: gestão de eventos (congressos/assembleias), ônibus, passageiros, pagamentos, congregações e listas de embarque. Inclui login, recuperação de senha, primeiro acesso por convite e **autocadastro de circuito**.

Repositório alvo: `Fioravante1/suoac-front` (branch `main`). Tokens base vieram de `app/globals.css` e `src/app/styles/theme-tokens.ts`; o shell atual (`src/widgets/app-shell/ui/*`, menu lateral) é **substituído** pela navegação descrita abaixo.

## Sobre os arquivos
Os arquivos `.dc.html` são **referências de design em HTML** — protótipos que mostram aparência e comportamento, não código de produção. A tarefa é **recriá-los no ambiente existente do `suoac-front`** (Next.js/React, padrões e bibliotecas já usados no repo). Abra os arquivos no navegador (precisam do `support.js` ao lado) para ver e interagir. Toda a lógica de dados é mockada no próprio arquivo (classe `Component`), servindo como especificação das regras.

## Fidelidade
**Alta fidelidade.** Cores, tipografia, espaçamentos, raios, sombras, estados e microinterações são finais. Recriar pixel-perfect usando os componentes do codebase. Tema claro e escuro são ambos finais.

---

## Nomenclatura de privilégios
Nunca usar "coordenador" sozinho: existe também o **coordenador do corpo de anciãos**. Sempre escrever **Coordenador do arranjo de ônibus no circuito** / **na congregação** (forma curta aceitável em espaços estreitos: "Coord. do arranjo").

## Navegação (sem menu lateral)
Dashboard: desktop ≥ 1100px, tablet e celular na seção 10. Login e Convite são responsivos (ver seção 9). Fonte única: **Geist** (400/500/600/700, Google Fonts).

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
- **Nova congregação** (modal): nome, **código da congregação (obrigatório)**, **Coordenador do arranjo de ônibus na congregação** (nome, telefone, e-mail, enviar convite). Sem campo de assistente: nota informativa "O assistente é escolhido pelo coordenador da congregação, depois que ele aceitar o convite."

### 5. Ônibus
Lista por dia com ocupação, motorista/empresa. **Adicionar ônibus** (modal). **Excluir ônibus**: confirmação que mostra quantos passageiros serão realocados; ao excluir, passageiros vão para os próximos ônibus com vaga e os ônibus são renumerados (ver `deleteBus()`).

### 6. Listas e exportações
Geração de lista de embarque por ônibus/dia e por congregação, escolha de colunas, prévia do documento. Na lista de embarque: **congregação no cabeçalho** (não como coluna), **sem coluna de assinatura**, **sem hora de saída**.

### Modal "Novo passageiro"
Modal central (não drawer). Busca em **registros de eventos anteriores** por nome/RG (sugestões com "Viajou em …"); se não existir, opção de **cadastrar novo passageiro**. Campos: nome, RG, congregação (dropdown abre abaixo do campo), dias, pagamento (Pago/Parcial/Pendente; Parcial pede valor). Ao salvar: animação de "bilhete" e toast.

### 8. Aceite de convite (`SUOAC Convite.dc.html`)
Link enviado pelo coordenador do circuito **somente ao Coordenador do arranjo de ônibus na congregação**. O assistente não entra por convite: é promovido pelo próprio coordenador da congregação. Mesmo layout dividido do login.
- **Painel esquerdo**: título "{Nome} convidou você para o arranjo de ônibus" + cartão-ingresso (fundo `rgb(255 255 255/.05)`, divisórias tracejadas): privilégio, congregação + código, circuito + cidade, remetente (avatar + papel). Selo de status na linha de "Privilégio": *Aguardando você* (âmbar, pulse) → *Aceito* (verde, animação stamp) / *Recusado* / *Expirado*. Validade abaixo do cartão.
- **Etapa 1 – Dados**: nome e celular pré-preenchidos pelo convite (editáveis, máscara `(00) 00000-0000`); e-mail travado com "Verificado pelo convite" (é o login). Link "Não é você? Recusar convite".
- **Etapa 2 – Senha**: mesmo padrão da Nova senha (medidor 4 níveis, requisitos 2×2, confirmação em tempo real) + aceite de termos. CTA "Aceitar convite e entrar".
- **Sucesso**: "Bem-vindo, {nome}!", resumo (privilégio, congregação, login), "Entrar no painel". Coordenador do circuito é notificado.
- **Recusar**: motivos em lista (radio), botões Voltar / Recusar (`--crit`).
- **Expirado**: aviso (convites valem 7 dias) + "Pedir novo convite" → "Pedido enviado".
- Props do protótipo: `inviteState` (valido/expirado), `theme`.

### 7. Login (`SUOAC Login.dc.html`)
Layout dividido: painel escuro `#0d2b45` à esquerda com **timeline** animada das etapas do evento (linha verde progressiva sincronizada com os itens; sem trilho de fundo), formulário à direita (surface).
- **Login**: e-mail, senha (mostrar/ocultar), lembrar, "Esqueci a senha", erro com shake.
- **Esqueci a senha**: envio de link + estado de confirmação.
- **Nova senha** (link do e-mail; no protótipo: `#nova-senha`, prop `startView=reset` ou botão "Abrir link do e-mail (demo)"):
  - Chip com a conta (e-mail) + contagem regressiva de validade do link (30 min).
  - Campos "Nova senha" e "Confirme a nova senha" (50px, radius 14, ícone cadeado, mostrar/ocultar).
  - Medidor de força em 4 segmentos (Fraca `--crit` → Razoável `--attn` → Boa `--primary` → Forte `--succ`).
  - Requisitos em grade 2×2 marcados em tempo real: 8+ caracteres, maiúscula, número, símbolo.
  - Confirmação mostra "✓ As senhas coincidem" / "As senhas não coincidem"; borda verde/vermelha.
  - Checkbox "Sair de todos os outros dispositivos" (marcado por padrão).
  - CTA "Salvar nova senha" (54px) com spinner; erros no topo com shake. Enter envia.
  - Sucesso: ícone escudo, "Senha alterada", resumo (conta, outros dispositivos), botão "Entrar no painel" com barra de progresso de 5s e redirecionamento automático.
- **Recebeu um convite?**: coordenadores de congregação entram pelo link recebido.
- **Autocadastro do circuito** ("Seu circuito ainda não usa o SUOAC?"), barra de progresso em 3 etapas:
  1. Seus dados: nome, e-mail (validação), celular (máscara `(00) 00000-0000`), senha ≥ 8 com medidor de força (4 barras).
  2. Circuito: código (ex.: SP-17, maiúsculas), cidade, UF (2 letras), privilégio fixo "Coordenador do arranjo de ônibus no circuito", aceite de termos.
  3. Congregações: **a primeira linha é a congregação do próprio coordenador — nome e código obrigatórios**; demais opcionais (adicionar/remover; código obrigatório se nome preenchido). "Adicionar as outras depois".
  4. Confirmação de e-mail: código de 6 dígitos (caixas individuais, reenviar).
  5. Sucesso: resumo (coordenador, circuito, sua congregação, total) → "Ir para o painel".
  Erros aparecem em faixa `--crit-s`/`--crit` acima do formulário.

### 9. Responsivo: celular e tablet (Login + Convite)
O app é uma única web responsiva (sem app nativo). Breakpoints por largura da janela (`window.innerWidth`, estado `vw`):
- **Celular (< 760px)**
  - Login (tela inicial) e Convite: painel navy vira **cabeçalho compacto** (padding 24–28px 20px 52px, título 24px, texto 15px); **timeline oculta**. O formulário fica num **cartão sobreposto** (`margin-top:-28px`, radius `26px 26px 0 0`, fundo `--bg`, padding 20–22px 20px).
  - Demais telas do Login (esqueci, link enviado, nova senha, cadastro 1–5): painel navy **oculto**; topo com logo 34px + "SUOAC" à esquerda e alternar tema à direita; formulário alinhado ao topo, padding 16–20px.
  - Convite: cartão-ingresso mantido, com padding menor (cabeçalho 16px 18px, células 12px 18px, privilégio 16px).
  - Requisitos de senha em **1 coluna**; títulos H2 26–28px.
  - Inputs com **fonte 16px** (evita zoom automático no iOS). Texto "Manter conectado **neste dispositivo**".
- **Tablet retrato (760–1023px)**: mesma estrutura em coluna única; cabeçalho navy maior (padding 56px 64px 96px, título 32px, texto 17px), cartão sobreposto `margin-top:-40px`, radius 32px, padding 28–32px 48px; timeline oculta; requisitos de senha em 2 colunas.
- **Tablet paisagem / desktop (≥ 1024px)**: layout dividido original. Entre 1024–1199px, padding reduzido (painel 40px, formulário 28px 32px).
- Containers com padding usam `box-sizing:border-box` para não gerar rolagem horizontal/vertical extra.
- Protótipo: hashes abrem estados direto — Login: `#erro #esqueci #link-enviado #nova-senha #nova-senha-preenchida #senha-alterada #cadastro-1…#cadastro-5`; Convite: `#senha #aceito #recusar #recusado #expirado #pedido-enviado`.

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
- `SUOAC Login.dc.html` — login, recuperação, nova senha e autocadastro do circuito.
- `SUOAC Convite.dc.html` — cadastro do coordenador da congregação pelo link de convite.
- `SUOAC Dashboard Mobile.dc.html` — dashboard para celular e tablet (ver seção 10).
- `SUOAC Lacunas.dc.html` + `SUOAC Lacunas Vitrine.dc.html` — estados e papéis (seção 11).
- `SUOAC Dashboard v3.dc.html` — **painel desktop (fonte da verdade)**, com rascunho, cancelado, sem evento, criar/editar evento e papéis da congregação integrados (seção 11).
- `SUOAC Mobile.dc.html` — vitrine com as 19 telas em celular (390×844), agrupadas por fluxo.
- `SUOAC Tablet.dc.html` — vitrine em tablet: 9 telas em retrato (820×1180) e 3 em paisagem (1180×820).
- `support.js` — runtime necessário apenas para abrir os protótipos no navegador.
- `assets/` — logos.
- `screenshots/` — capturas de referência (tema escuro, reduzidas para caber na tela; alguns textos quebram linha só por causa da redução — o HTML é a referência final): visão geral, ocupação, passageiros, importar lista, financeiro, congregações, ônibus, listas e exportações, novo passageiro, login, cadastro do circuito, nova senha e aceite de convite (dados, senha, aceito).


### 10. Dashboard em celular e tablet
- **Celular (< 760px): app próprio** — `SUOAC Dashboard Mobile.dc.html` (largura máx. 440px). Não é o desktop comprimido.
  - Navegação inferior fixa (vidro + blur): Início · Passageiros · **FAB central "+" (Cadastrar passageiro)** · Financeiro · Mais. Alvos ≥ 44px.
  - Topo navy compacto (64px): nome do evento abre sheet de eventos; busca (tela cheia), notificações (sheet), avatar → aba Mais.
  - **Início**: hero navy (dias 23/24/25, "Faltam 16 dias", stepper de 4 etapas com rótulo, Encerrar inscrições); KPIs 2×2 tocáveis; Ocupação com segmentado Sex/Sáb/Dom, número de lugares livres, chips Todos/Com vagas/Lotados e carrossel horizontal (scroll-snap) de ônibus com mapa de assentos deitado (12×4); Atenção; Top 5 de menor % pago.
  - **Passageiros**: busca + chips sticky (status e congregação → sheet); linhas com avatar na cor do status, congregação, dias (SEX/SÁB/DOM), pílula de status e valor em aberto; toque abre sheet com viagens, pagamento e ações; menu ⋯ com Importar/Exportar.
  - **Financeiro**: card navy (arrecadado, barra pago/parcial/pendente, Ver em aberto, Registrar), aviso de ritmo, segmentado Por congregação / Últimos pagamentos.
  - **Mais**: card de conta (privilégio "Coordenador do arranjo de ônibus no circuito"), atalhos para Ônibus, Congregações, Listas (telas empilhadas com "‹ Mais" e ação no topo), tema escuro, alterar senha, sair.
  - Todos os detalhes e ações abrem como **bottom sheets** (alça, fundo escurecido, máx. 86–92vh): passageiro, ônibus (mapa vertical + lista), congregação, registrar pagamento (valor grande, atalhos R$ 40/80/120, Pix/Dinheiro/Cartão), exportar lista (dia + formato PDF/Excel/WhatsApp), confirmar encerramento.
  - **Cadastrar passageiro**: tela cheia; primeiro busca no histórico do circuito ("Usar" preenche), ou "Cadastrar como novo"; formulário com dias (mostrando lugares livres), pagamento Pendente/Parcial/Pago (Parcial abre campo de valor) e rodapé fixo com total + Cadastrar.
  - Inputs 16px (sem zoom no iOS). Estados por hash: `#inicio #passageiros #financeiro #mais #congregacoes #onibus #listas #cadastrar #cadastrar-form #sheet-onibus #sheet-passageiro #sheet-congregacao`.
- **Tablet (760–1099px)**: `SUOAC Dashboard Mobile.dc.html` (o mesmo app, layout próprio ≥ 760px via objeto `T`): navegação em pílula flutuante (máx. 560px, bottom 16px) com FAB; Início em grade (hero com áreas "date btn" / "steps", KPIs 4 colunas, Ocupação | Atenção + Ranking); **Passageiros em mestre-detalhe** (lista + ficha fixa 360px; toque troca a ficha); Financeiro em 2 colunas; Mais, Listas e Congregações em 2 colunas; Ônibus em 4 colunas; sheets viram **modais centrais** (540px, `popM`); Cadastrar e Busca viram modais grandes (620px, 90vh) com fundo escurecido.
- Alternativa legada para tablet: `SUOAC Dashboard v3.dc.html` — mesmo dashboard do desktop, responsivo via objeto `R` em `renderVals()` (estado `vw`): colunas laterais descem, KPIs 2×2, abas roláveis, faixa do evento empilhada, palco com 3 ônibus, linhas de passageiros em 2 linhas (grid-template-areas), modais com largura máx. 100%. Acima de 1100px = desktop.


### 11. Lacunas: estados e papéis (`SUOAC Lacunas.dc.html`)
Arquivo único e responsivo (celular < 760, tablet < 1100, desktop ≥ 1100; estado `vw`, objeto `L`). Vitrine com as 10 telas nos 3 tamanhos: `SUOAC Lacunas Vitrine.dc.html`. Hashes entre parênteses.
- **Circuito sem evento** (`#sem-evento`): card navy com "Nenhum evento em andamento", **Criar evento** e **Duplicar o último**; lista de eventos anteriores com "Duplicar" (copia datas, valor, ônibus e congregações); resumo do circuito (congregações, coordenadores ativos, convites pendentes). Topo mostra "Nenhum evento ativo" com ponto cinza.
- **Criar / editar evento** (`#criar-evento`, `#editar-evento`): tipo (Assembleia de circuito / Congresso regional / Outro), nome, local; dias de viagem (cada dia com saída/retorno e nº de ônibus; adicionar/remover); valor por dia, prazo de inscrição e de pagamento; stepper de ônibus por dia e lugares por ônibus (padrão 46); toggles "Todas as congregações" e "Avisar coordenadores ao publicar". Coluna lateral (sticky no desktop, abaixo no tablet/celular) com **prévia** de como as congregações veem o evento + checklist "Pronto para publicar". Ações: Salvar rascunho / **Publicar e abrir inscrições** (no celular em barra fixa inferior). Editar adiciona **zona de risco** "Cancelar evento".
- **Evento em rascunho** (`#rascunho`): pílula "Rascunho" no topo; card tracejado com progresso (3 de 5) e itens pendentes com ação (ex.: Ônibus → Adicionar); "Editar evento" / "Publicar"; nota: é possível publicar sem ônibus. Card "Ao publicar" explica o que acontece.
- **Evento cancelado** (`#cancelado`): faixa `--crit-s` com data, autor e efeitos (inscrições e pagamentos bloqueados, congregações avisadas) + "Duplicar como novo"; KPIs (afetados, a devolver, já devolvido, congregações quitadas); **devoluções por congregação** com barra e status Devolvido / Em andamento / Pendente; exportar lista.
- **Papéis da congregação**:
  - **Coordenador do arranjo de ônibus na congregação** (`#congregacao`): escopo só da própria congregação ("Jardim Paulista · Cód. 31245" no topo). Hero navy com status das inscrições, **Finalizar lista** (envia ao circuito; vira "Reabrir lista") e Cadastrar passageiro; KPIs (inscritos por dia, % pago, em aberto, lugares livres no circuito); passageiros da congregação; prazos; equipe. Navegação: Visão geral · Passageiros · Pagamentos · Equipe.
  - **Assistente** (`#assistente`): mesmo painel, "Finalizar lista" desabilitado com nota explicando que só o coordenador finaliza; sem aba Equipe.
  - **Equipe** (`#equipe`, `#equipe-vazia`): card do coordenador (entrou por convite do circuito); assistente atual com "Remover acesso" ou formulário **Promover um assistente** (nome, e-mail, telefone — opcional); tabela de permissões Coordenador × Assistente (assistente não finaliza lista nem gerencia equipe; ninguém vê outras congregações).
- **Ônibus · detalhe e edição** (`#onibus-detalhe`): planta 46 lugares (guia em `--info`), veículo e motorista (empresa, placa, motorista, telefone, ponto de embarque, saída), guia a bordo com troca, toggle de rastreamento no dia, Excluir ônibus / Lista de embarque / Salvar.

- **Integração no painel desktop** (`SUOAC Dashboard v3.dc.html`, fonte da verdade para desktop): as lacunas vivem dentro do painel real, com a mesma faixa navy, abas, cards e modais.
  - **Seletor de evento**: inclui eventos em *Rascunho* e *Cancelado*. Rascunho → pílula "Rascunho · só você vê", faixa sem timeline/abas, ações "Editar evento" / "Publicar e abrir inscrições" e painel com checklist (3 de 5) + "Ao publicar". Cancelado → pílula vermelha, ação "Duplicar como novo", faixa `--crit-s`, KPIs e devoluções por congregação.
  - **Criar novo evento / Editar evento atual** (no mesmo menu): modal central 1040px (padrão do "Novo passageiro"): formulário à esquerda (tipo, nome, local, dias, valor e prazos, ônibus por dia, lugares, toggles) e painel navy à direita com prévia + checklist. Editar tem zona de risco "Cancelar evento". Salvar rascunho → evento vira rascunho; Publicar → evento aberto.
  - **Circuito sem evento**: faixa só com o topo ("Nenhum evento ativo"), sem abas; card navy com Criar evento / Duplicar o último + eventos anteriores.
  - **Papéis da congregação**: topo mostra "Jardim Paulista · Cód. 31245", avatar e menu com o usuário do papel (Ana Souza / Paulo Lima) e o privilégio correto. Abas: Visão geral · Passageiros (filtrado na congregação) · Equipe (só coordenador). Botão da faixa vira **Finalizar lista** (assistente: bloqueado com aviso). Visão geral com KPIs, passageiros, prazos e equipe; Equipe com promover/remover assistente e tabela de permissões.
  - **Protótipo**: menu do avatar → "Ver o protótipo como" (Circuito · Coord. na congregação · Assistente · Circuito sem evento). Hashes: `#rascunho #cancelado #sem-evento #criar-evento #editar-evento #congregacao #assistente #equipe #equipe-vazia`. Estado: `role` (circ/coord/assist), `noEvent`, `evIdx` (1 rascunho, 3 cancelado), `evForm` (create/edit), `ef`, `finalized`, `hasAssist`.
  - Ônibus · detalhe e edição segue apenas em `SUOAC Lacunas.dc.html` (`#onibus-detalhe`).
- `SUOAC Lacunas.dc.html` continua como referência de tablet e celular dessas telas; na vitrine, as molduras de desktop já abrem o painel real.
