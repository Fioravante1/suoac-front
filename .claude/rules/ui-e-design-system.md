---
trigger: model_decision
description: Quando criar ou editar componentes de UI, CSS Modules ou tokens em src/**/ui/**, src/shared/ui/**, app/**/*.tsx, **/*.module.css, app/globals.css ou src/app/styles/**
paths:
  - "src/**/ui/**"
  - "src/shared/ui/**"
  - "app/**/*.tsx"
  - "**/*.module.css"
  - "app/globals.css"
  - "src/app/styles/**"
---

# UI, design system e UX

Baseie UI e copy visual nos documentos:

- `docs/design/SUOAC — Identidade Visual Oficial.md`
- `docs/design/Design System Overview.png`

**Antes de construir qualquer interface, leia esses dois documentos.** Eles sao a fonte de verdade
para cores, tipografia, espacamento, radius, iconografia e tom visual.

### Mentalidade de construcao

Toda interface deve ser construida com mentalidade de UX senior. Nao basta funcionar — deve ser
bonita, clara, intuitiva e agradavel de usar. O SUOAC e um sistema operacional real usado por
coordenadores; a interface deve transmitir organizacao, confianca e modernidade.

Referencia visual: Material 3, Linear, Stripe, Notion, Google Workspace.

Principios obrigatorios:

- **Responsivo em tres larguras**: toda tela nasce funcionando em celular, tablet e desktop. A
  regra desktop-first, de 09/10/2026, foi **substituida** em 26/10/2026 (SUC-83): o SUOAC web
  passou a ser a unica aplicacao tambem no celular.
  - **Larguras de corte** (tokens `--suoac-breakpoint-*`, espelhados em `theme-tokens.ts`):
    celular abaixo de 760px (`47.5rem`), tablet retrato de 760px a 1023px e, de 1024px (`64rem`)
    em diante, o layout dividido de desktop e tablet paisagem. Acima de 1200px (`75rem`) o
    espacamento volta ao tamanho cheio.
  - **Mobile-first no CSS**: o estilo base e o do celular, e `@media (min-width: ...)` acrescenta
    o tablet e o desktop. `@media` nao le `var()`, entao o CSS Module escreve o valor do token;
    `src/app/styles/breakpoints.test.ts` falha se um corte nao for um dos declarados.
  - **O desenho vem do handoff.** Celular e tablet saem de `docs/design_handoff_suoac_redesign/`
    (secao 9 do README e as vitrines Mobile e Tablet), nao de improviso. O handoff so cobre a
    Fatia 1; as demais so ficam responsivas quando o desenho existir, e o card da fatia deve
    pedi-lo antes de comecar.
  - **Nao altere** a responsividade de telas ainda nao redesenhadas.
  - Alvos de toque de 44x44px em tela de toque (`@media (pointer: coarse)`), e campos com fonte
    de 16px, que evita o zoom automatico do iOS.
- **Minimalismo funcional**: cada elemento deve ter proposito. Remova o que nao agrega.
- **Espacamento generoso**: usar a escala oficial (4, 8, 12, 16, 20, 24, 32, 40, 48px). Nunca
  comprimir conteudo. Ar entre elementos transmite clareza.
- **Hierarquia visual clara**: titulos, subtitulos, labels e body devem seguir a escala tipografica
  do design system (H1 32px/700, H2 24px/700, H3 20px/600, Body 16px/400, Small 14px/400,
  Labels 13px/600).
- **Cards como unidade base**: o sistema e fortemente baseado em cards (fundo branco, radius 20px,
  sombra leve, padding generoso). Prefira cards a tabelas brutas sempre que o conteudo permitir.
- **Cores semanticas**: use a paleta oficial para comunicar significado. Verde = sucesso/ativo,
  amarelo = atencao/parcial, vermelho = erro/pendente, azul = informacao/link. Nunca use cor
  apenas como decoracao.

### Experiencia do usuario

O objetivo e uso rapido, com poucos cliques e baixa carga cognitiva. Sempre que construir uma
interface, pergunte: "como posso tornar isso mais facil e agradavel para o usuario?"

Padroes obrigatorios:

- **Empty states**: nunca deixe uma tela vazia sem orientacao. Quando uma lista, tabela ou secao
  nao tem dados, exiba um empty state com icone relevante (Lucide, outline), mensagem explicativa
  e, quando aplicavel, uma acao primaria (ex: botao "Criar primeiro evento"). O empty state deve
  orientar o usuario sobre o que fazer, nao apenas dizer "nenhum resultado".
- **Feedback instantaneo**: toda acao do usuario deve ter resposta visual imediata. Botoes devem
  mostrar estado de loading ao submeter. Formularios devem exibir validacao inline conforme o
  usuario digita (nao apenas no submit). Acoes concluidas devem confirmar sucesso com toast ou
  mensagem visual.
- **Estados de erro com recuperacao**: mensagens de erro devem ser humanas e indicar como resolver.
  Evite textos tecnicos ("Error 500"). Prefira "Nao foi possivel salvar. Verifique sua conexao e
  tente novamente." Sempre ofereça um caminho de recuperacao (botao de retry, link para suporte).
- **Confirmacao para acoes destrutivas**: exclusoes e acoes irreversiveis devem exigir confirmacao
  via dialog. O dialog deve descrever claramente a consequencia e usar botao vermelho para a acao
  destrutiva.
- **Transicoes e micro-interacoes**: use transicoes CSS suaves (150–250ms) para hover, focus,
  abertura de modais e mudancas de estado. Evite transicoes longas ou chamativas. O objetivo e
  fluidez, nao espetaculo.
- **Hover e focus visiveis**: todo elemento interativo deve ter estados hover e focus distintos.
  Focus deve ser visivel para acessibilidade (outline ou ring). Hover deve ser sutil (mudanca de
  background ou opacidade).
- **Areas de toque generosas**: no mobile, botoes e alvos de toque devem ter no minimo 44x44px.
  Inputs devem ser grandes e mobile-friendly. Evite alvos de toque pequenos ou proximos demais.
- **Informacao progressiva**: nao sobrecarregue o usuario com tudo de uma vez. Use expansoes,
  tooltips, popovers ou secoes colapsaveis para informacoes secundarias. Mostre o essencial
  primeiro e permita aprofundar sob demanda.

### Organizacao tecnica

- Componentes genericos ficam em `shared/ui`.
- Componentes com regra/semantica de dominio ficam em `entities`, `features` ou `widgets`.
- Nao use `components/`, `hooks/`, `utils/`, `services/` como pastas genericas na raiz.
- Use linguagem do dominio SUOAC nos componentes de dominio.
- Evite landing page quando a solicitacao for criar funcionalidade do sistema.
- A estrategia de estilo padrao e CSS Modules + CSS Custom Properties.
- Nao adicione `styled-components` sem nova decisao arquitetural explicita.
- Estilos de componente devem ficar co-localizados em `*.module.css`.
- Nao espalhe valores visuais soltos em componentes ou CSS Modules (`#1f6e5a`, `24px`, sombras,
  radius, z-index, alturas de controles, etc.) quando eles representarem uma decisao de design.
- Se um valor visual for reutilizavel, semantico ou parte do design system, crie/atualize o token
  correspondente em `app/globals.css` e em `src/app/styles/theme-tokens.ts`.
- CSS Modules devem consumir tokens via `var(--suoac-...)` sempre que possivel.
- Valores locais so sao aceitaveis quando forem especificos de layout daquele componente e nao
  tiverem significado reutilizavel no design system.

Tokens atuais ficam em:

```text
app/globals.css
src/app/styles/theme-tokens.ts
```

### Iconografia

- Biblioteca padrao: Lucide Icons (estilo outline, minimalista).
- Icones complementam texto e ajudam na escaneabilidade. Use em botoes de acao, headers de cards,
  empty states, itens de navegacao e badges de status.
- Nao use icones decorativos sem significado. Cada icone deve reforcar a compreensao do elemento.
- Nao use emojis na interface do sistema. Prefira sempre icones Lucide.

### Padrao de feedback de carregamento

- **Skeleton** (`shared/ui/skeleton`): usar para carregamento de paginas, listas, tabelas e blocos
  de conteudo. O Skeleton mostra placeholders animados no formato aproximado do conteudo que sera
  exibido, transmitindo progresso sem layout shift.
- **Spinner** (`shared/ui/spinner`): usar apenas em acoes pontuais e inline, como botoes de salvar,
  enviar formulario ou confirmar exclusao. Nao usar Spinner como indicador de carregamento de
  pagina inteira.

Exemplos corretos:

```tsx
// Carregamento de lista — Skeleton
{
  isLoading && <SkeletonTableRows rows={5} />;
}

// Botao de salvar — Spinner
<Button disabled={isPending}>{isPending ? <Spinner size="small" /> : "Salvar"}</Button>;
```

### Tabelas de dados

- Tabelas que renderizam listas de dados devem usar `DataTable` de `shared/ui/data-table`, nunca
  montar `TableHeader`/`TableRow`/`TableHead`/`TableCell` manualmente.
- Defina as colunas com `ColumnDef<T>[]` de forma declarativa. Cada coluna tem `id`, `header`,
  `cell(item)` e, opcionalmente, `visible`, `headerClassName` e `cellClassName`.
- Use `visible` para colunas condicionais em vez de `{condition && <TableHead>}`.
- Os primitivos de `shared/ui/table` (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`,
  `TableCell`, `TableWrapper`) existem como base interna. Codigo de produto deve consumir
  `DataTable`, nao os primitivos diretamente.

```tsx
// Correto — declarativo via DataTable
import { DataTable, type ColumnDef } from "@/shared/ui/data-table";

const columns: ColumnDef<Item>[] = [
  { id: "name", header: "Nome", cell: (item) => item.name },
  { id: "status", header: "Status", cell: (item) => <Badge>{item.status}</Badge> },
  { id: "extras", header: "Extras", cell: (item) => item.extras, visible: showExtras },
];

<DataTable columns={columns} data={items} getRowKey={(item) => item.id} />;
```

```tsx
// Errado — montar primitivos manualmente em codigo de produto
<TableHeader>
  <TableRow>
    <TableHead>Nome</TableHead>
    <TableHead>Status</TableHead>
  </TableRow>
</TableHeader>
```

### Checklist visual

Antes de concluir qualquer interface nova, verifique:

- [ ] Segue a paleta de cores e tokens do design system?
- [ ] Tipografia respeita a hierarquia (H1/H2/H3/Body/Small/Labels)?
- [ ] Espacamento usa a escala oficial (4–48px)?
- [ ] Border radius usa a escala oficial (8, 12, 16, 20px)?
- [ ] Tem empty state quando a lista/tabela pode estar vazia?
- [ ] Tem feedback de loading (Skeleton ou Spinner conforme o caso)?
- [ ] Tem feedback de sucesso e erro para acoes do usuario?
- [ ] Acoes destrutivas pedem confirmacao?
- [ ] Estados hover e focus sao visiveis?
- [ ] Funciona nas tres larguras (celular, tablet e desktop), sem rolagem horizontal, com alvos de toque de 44px?
- [ ] Icones sao Lucide, outline, e reforçam o significado?

---

## Medidas que o handoff usa e a escala atual nao tem

O handoff usa raios de 6px e 14px e alturas de controle de 50px e 54px, fora da escala atual
(8/12/16/20px; 44/48px). Quando uma tela precisar desses valores, **crie o token** em `globals.css` e
no espelho TypeScript — nao escreva o valor solto no CSS Module.
