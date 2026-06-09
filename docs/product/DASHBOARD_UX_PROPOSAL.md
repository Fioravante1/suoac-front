# Dashboard da Congregacao — Proposta UX

> Proposta de experiencia para o dashboard do coordenador/assistente de congregacao.

---

## Pergunta central do coordenador

Quando o coordenador abre o app, ele quer responder **3 perguntas em 3 segundos**:

1. **Qual evento esta rolando?**
2. **Como estamos de inscricoes e pagamentos?**
3. **O que precisa da minha atencao agora?**

Tudo no dashboard gira em torno dessas perguntas.

---

## Estrutura (mobile-first, single column)

### 1. Saudacao + contexto (topo)

Pequeno, leve, humaniza. Da contexto imediato.

```
Ola, Joao                           <- H3, 20px/600
Congregacao Central Sul              <- Small, 14px/400, texto secundario #667085
```

---

### 2. Event Card (card hero — o mais importante da tela)

Card branco, radius 20px, sombra leve. Esse e o ponto focal.

```
+-----------------------------------------------+
|  Calendar  Assembleia Regional 2026    [ABERTO]|  <- badge verde
|                                                |
|  MapPin  Salao de Assembleias — Sao Paulo      |  <- Small, texto secundario
|  Calendar  15 de marco de 2026                 |  <- Small, texto secundario
|                                                |
|  +-------------------+ +--------------------+  |
|  | Inscricoes         | | Pagamentos         |  |
|  | ate 10/mar         | | ate 14/mar         |  |
|  | AlertTriangle 5d   | | CheckCircle 9d     |  |  <- amarelo se < 7 dias
|  +-------------------+ +--------------------+  |     vermelho se < 3 dias
|                                                |     verde se > 7 dias
|  [ Ver evento -> ]                             |  <- link/botao ghost
+-----------------------------------------------+
```

Cores semanticas dos prazos:

- Verde (`#2E9E5B`): > 7 dias
- Amarelo (`#F5B700`): 3–7 dias
- Vermelho (`#D64545`): < 3 dias ou expirado

---

### 3. Stats — 4 metric cards (grid 2x2)

Cards compactos com numero grande e label. Escaneabilidade imediata.

```
+--------------------+  +--------------------+
|  Users  45         |  |  Wallet  R$ 4.500  |
|  Inscritos         |  |  Valor esperado    |
+--------------------+  +--------------------+
+--------------------+  +--------------------+
|  CircleCheck       |  |  Clock             |
|  R$ 3.200          |  |  R$ 1.300          |
|  Recebido          |  |  Pendente          |
|  fundo verde claro |  |  fundo vermelho/   |
|                    |  |  amarelo claro     |
+--------------------+  +--------------------+
```

- Numero: H2 (24px/700)
- Label: Labels (13px/600, texto secundario)
- Icone: Lucide, outline, na cor semantica
- "Recebido" com fundo verde claro (`#E6F4EF`)
- "Pendente" com fundo amarelo/vermelho claro conforme proporcao

---

### 4. Barra de progresso financeiro

Visualizacao horizontal de quanto ja foi arrecadado. CSS puro, sem chart library.

```
+-----------------------------------------------+
|  Progresso de pagamentos              71%      |
|  =====================-----------              |  <- gradient verde
|                                                |
|  * 22 pagos  * 12 parciais  * 8 pendentes  * 3 isentos |
+-----------------------------------------------+
```

- Barra: CSS puro, radius 8px, transicao suave
- Legenda com dots coloridos (verde, amarelo, vermelho, azul) + contagem
- Porcentagem grande no canto (H3, 20px/600)

---

### 5. Alertas / O que precisa de atencao

So aparece quando ha algo relevante. Sem alerta = nao renderiza a secao.
Cards com borda lateral colorida (padrao Stripe/Linear).

```
+-- amarelo -----------------------------------------+
|  AlertTriangle                                      |
|  Prazo de inscricao vence em 5 dias                 |  <- borda esquerda amarela
|  10 de marco de 2026                                |
+----------------------------------------------------+
+-- vermelho ----------------------------------------+
|  CircleAlert                                        |
|  8 passageiros com pagamento pendente               |  <- borda esquerda vermelha
|  [ Ver pendentes -> ]                               |
+----------------------------------------------------+
```

Alertas possiveis:

- Prazo de inscricao proximo (< 7 dias) ou expirado
- Prazo de pagamento proximo (< 7 dias) ou expirado
- X passageiros com pagamento pendente
- Nenhum passageiro inscrito ainda (se evento aberto e 0 inscritos)

---

### 6. Acoes rapidas

As 2 acoes mais comuns do coordenador. Botoes grandes, thumb-friendly (min 48px altura).

```
+-----------------------------------------------+
|  [ + Inscrever passageiro ]     <- primario    |
|  [ $ Registrar pagamento  ]     <- secundario  |
+-----------------------------------------------+
```

- "Inscrever" leva direto pro modal de inscricao do evento ativo
- "Registrar pagamento" leva pra lista de inscritos pra escolher o passageiro

---

### 7. Passageiros que precisam de atencao (lista curta)

Ultimos 5 passageiros com status PENDING ou PARTIAL. Acesso direto ao pagamento.

```
+-----------------------------------------------+
|  Pagamentos pendentes                          |
|                                                |
|  Maria Silva         R$ 100   [PENDENTE]  ->   |
|  Joao Oliveira       R$ 45    [PARCIAL]   ->   |
|  Ana Costa           R$ 100   [PENDENTE]  ->   |
|  Pedro Santos        R$ 100   [PENDENTE]  ->   |
|  Lucas Almeida       R$ 55    [PARCIAL]   ->   |
|                                                |
|  [ Ver todos (8) -> ]                          |
+-----------------------------------------------+
```

- Cada linha e tappable e abre o modal de pagamento
- Badge de status com cor semantica
- Valor mostrado e o **pendente** (totalAmount - paidAmount)

---

## Estados especiais

### Sem evento ativo (empty state)

```
+-----------------------------------------------+
|             Calendar                            |
|    Nenhum evento ativo no momento              |
|                                                |
|    Quando o circuito publicar um novo          |
|    evento, ele aparecera aqui.                 |
|                                                |
|    [ Ver eventos anteriores -> ]               |
+-----------------------------------------------+
```

- Icone Lucide `Calendar` grande, cor secundaria
- Texto explicativo em Body (16px/400)
- Botao ghost para navegar ate a lista de eventos

### Todos os pagamentos quitados (celebration state)

- Card de stats com "Pendente" em verde com R$ 0,00
- Barra de progresso 100% verde
- Secao de alertas nao aparece
- Lista de pendentes substituida por: "Todos os pagamentos estao em dia" com icone `CircleCheck`

---

## Layout desktop (breakpoint ~768px+)

Mesmo conteudo, reorganizado em grid:

```
+-------------------------------+--------------------------+
|  Saudacao                     |                          |
+-------------------------------+   Stats (2x2 grid)       |
|  Event Card (hero)            |                          |
|                               +--------------------------+
|                               |   Acoes rapidas          |
+-------------------------------+--------------------------+
|  Barra de progresso financeiro                           |
+-------------------------------+--------------------------+
|  Alertas                      |  Passageiros pendentes   |
|                               |                          |
+-------------------------------+--------------------------+
```

---

## Principios que guiaram esta proposta

1. **Informacao hierarquica** — O mais importante (evento ativo) esta no topo e e maior.
   Stats sao escaneáveis. Detalhes ficam abaixo.
2. **Zero cliques pra entender a situacao** — Abriu o app, ja sabe como esta.
3. **Acao direta** — Dos pendentes, o coordenador toca no passageiro e ja registra pagamento.
   Sem navegacao intermediaria.
4. **Alertas contextuais** — So aparecem quando relevantes. Dashboard limpo = tudo bem.
5. **Mobile-first real** — Cards empilhados, areas de toque generosas, sem hover-dependent.

---

## Dependencia de backend

Para evitar calcular totais financeiros no frontend (precisao decimal, race conditions, N+1 requests),
recomenda-se um endpoint dedicado:

```
GET /events/{eventId}/financial-summary?congregationId={id}
```

Retornando:

```json
{
  "totalPassengers": 45,
  "totalExpected": "4500.00",
  "totalPaid": "3200.00",
  "totalPending": "1300.00",
  "statusCounts": {
    "PENDING": 8,
    "PARTIAL": 12,
    "PAID": 22,
    "EXEMPT": 3
  }
}
```

Uma query no banco, um request no front, zero logica de agregacao no cliente, precisao decimal
garantida. Quando o circuito precisar, basta remover o filtro de `congregationId`.

---

## Tokens visuais referenciados

| Token            | Valor     | Uso nesta tela                               |
| ---------------- | --------- | -------------------------------------------- |
| Primaria         | `#1F6E5A` | Botao primario, icones de destaque           |
| Verde Sucesso    | `#2E9E5B` | Stats "Recebido", badge "Pago", prazo seguro |
| Amarelo Atencao  | `#F5B700` | Badge "Parcial", prazo proximo, alerta       |
| Vermelho Critico | `#D64545` | Badge "Pendente", prazo expirado, alerta     |
| Azul Informacao  | `#2F6FED` | Badge "Isento", links                        |
| Primaria Clara   | `#E6F4EF` | Fundo do card "Recebido"                     |
| Fundo Principal  | `#F7F9F8` | Background da pagina                         |
| Surface / Cards  | `#FFFFFF` | Todos os cards                               |
| Texto Principal  | `#1E1F24` | Numeros, titulos                             |
| Texto Secundario | `#667085` | Labels, subtitulos, datas                    |
| Bordas           | `#E3E8E6` | Separadores entre itens da lista             |
