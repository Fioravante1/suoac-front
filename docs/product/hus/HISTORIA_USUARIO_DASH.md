# Historia de Usuario — Dashboard

## Titulo

Implementar dashboard com visao geral do evento ativo e resumo financeiro

## Descricao

**Como** coordenador ou assistente (de circuito ou congregacao),
**quero** ver um painel com o resumo do evento ativo, passageiros inscritos e situacao financeira,
**para** acompanhar rapidamente o andamento do evento sem precisar navegar por varias telas.

## Contexto

A pagina de dashboard (`src/pages/dashboard`) existe como placeholder — exibe apenas uma saudacao
com o nome do usuario. O MVP precisa de um dashboard funcional que entregue valor imediato ao
coordenador ao abrir o sistema.

Existem dois perfis com visoes diferentes:

- **Coordenador/Assistente do Circuito**: ve o panorama de todas as congregacoes.
- **Coordenador/Assistente da Congregacao**: ve apenas os dados da propria congregacao.

## Requisitos de referencia

- `docs/product/SUOAC_REQUISITOS_v2.md` — secoes 2.5.1 (Dashboard do Circuito) e 2.5.2 (Dashboard da
  Congregacao)
- `docs/design/SUOAC — Identidade Visual Oficial.md` — design system e tokens visuais
- `docs/design/Design System Overview.png` — referencia visual

## Escopo MVP do dashboard

### Para ambos os perfis

- Saudacao com nome do usuario ("Bom dia, Joao!")
- Card do evento ativo (titulo, tipo, datas, local, status)
- Se nao houver evento ativo, exibir empty state orientando o usuario
- Prazos restantes para inscricao e pagamento (com destaque visual quando proximo do vencimento)
- Acoes rapidas: botao para ir a pagina de eventos, botao para cadastrar passageiro (link para a
  pagina do evento ativo)

### Dashboard do Circuito (coordenador/assistente do circuito)

- Total de passageiros inscritos no evento ativo (geral e, se multi-dia, por dia)
- Resumo financeiro geral:
  - Valor total esperado (soma de `totalAmount` de todos os `EventPassenger`)
  - Valor total recebido (soma de `paidAmount`)
  - Valor pendente (diferenca)
  - Percentual de pagamentos recebidos
- Lista resumida de congregacoes com status:
  - Nome da congregacao
  - Quantidade de inscritos
  - Valor esperado
  - Valor recebido
  - Status visual (ex: badge verde se quitou, amarelo se parcial, vermelho se pendente)

### Dashboard da Congregacao (coordenador/assistente da congregacao)

- Total de passageiros inscritos pela congregacao
- Resumo financeiro da congregacao:
  - Valor total esperado
  - Valor total recebido
  - Valor pendente
- Contagem de passageiros por status de pagamento (pendente, parcial, pago, isento)

## API e dados

Os dados necessarios podem ser compostos a partir de endpoints ja existentes:

| Dado | Endpoint | Observacao |
|---|---|---|
| Evento ativo | `GET /circuits/:circuitId/events` | Filtrar por status `OPEN` |
| Passageiros do evento | `GET /events/:eventId/passengers` | Paginado; para totais, usar `meta.total` |
| Congregacoes | `GET /circuits/:circuitId/congregations` | Lista de congregacoes |

> **Nota**: o backend pode nao ter um endpoint especifico para dados agregados do dashboard
> (totais financeiros, contagens por congregacao). Verificar com o backend se existe ou se sera
> necessario criar. Se nao houver, documentar quais endpoints de agregacao sao necessarios e
> alinhar com o backend antes de implementar.

### Query keys existentes

```ts
queryKeys.events.list(circuitId, page)
queryKeys.eventPassengers.list(eventId, page)
queryKeys.congregations.list(circuitId, page)
```

## Arquitetura FSD

```text
src/pages/dashboard/
  ui/
    dashboard-page.tsx          — pagina principal (client component)
    dashboard-page.module.css
    dashboard-page.test.tsx
  index.ts

src/widgets/dashboard-summary/  — widget com os cards de resumo
  ui/
    dashboard-summary.tsx
    dashboard-summary.module.css
    dashboard-summary.test.tsx
  index.ts
```

> A estrutura acima e uma sugestao. O desenvolvedor pode organizar de forma diferente desde que
> respeite as regras de FSD documentadas em `AGENTS.md`.

## Regras de UI e UX

- Mobile-first: cards empilhados no mobile, grid no desktop
- Usar cards como unidade base (radius 20px, sombra leve, padding generoso)
- Skeleton loading enquanto os dados carregam
- Empty state se nao houver evento ativo
- Cores semanticas para status financeiro (verde = quitado, amarelo = parcial, vermelho = pendente)
- Tipografia conforme hierarquia do design system (H1 para titulo, H3 para subtitulos de cards)
- Valores monetarios formatados com `formatCurrency` de `@/shared/lib`
- Datas formatadas com `formatDate` de `@/shared/lib`

## Criterios de aceite

- [ ] Dashboard renderiza dados reais do evento ativo via API
- [ ] Perfil de circuito ve panorama de todas as congregacoes
- [ ] Perfil de congregacao ve apenas dados da propria congregacao
- [ ] Empty state quando nao ha evento ativo
- [ ] Skeleton loading durante carregamento
- [ ] Erro com retry se a API falhar
- [ ] Layout responsivo (mobile e desktop)
- [ ] Segue design system (cores, tipografia, espacamento, tokens)
- [ ] Testes unitarios co-localizados
- [ ] `yarn run check` passa sem erros

## Fora do escopo (pos-MVP)

- Graficos e charts (Recharts)
- Alertas de capacidade de onibus
- Ranking de congregacoes por percentual de pagamento
- Notificacoes e lembretes
- Historico de eventos passados no dashboard
