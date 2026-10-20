---
paths:
  - "**/*.module.css"
  - "app/globals.css"
  - "src/app/styles/**"
---

# Animacao

- Use os `@keyframes` globais do design system, prefixados com `suoac-`: `suoac-rise` (entradas),
  `suoac-swap` (troca de tela e de etapa: desliza da direita), `suoac-fade`, `suoac-modal-in`,
  `suoac-pop` (toast), `suoac-grow` (barras), `suoac-seat` (poltronas), `suoac-draw` (graficos),
  `suoac-shake` (erro) e `suoac-spin`.
- Duracao e curva vem dos tokens `--suoac-motion-*`. A curva padrao e
  `--suoac-motion-ease-standard`; qualquer outra precisa de motivo.
- Listas entram escalonadas: 25ms por item (`--suoac-motion-stagger-step`), com teto de 400ms
  (`--suoac-motion-stagger-max`). Sem o teto, uma lista de 40 passageiros levaria um segundo para
  terminar de aparecer.
- **Dentro de um CSS Module, refira o keyframe global pelo token, nunca pelo nome.** CSS Modules
  escopam _nomes de animacao_, nao so nomes de classe: escrever `animation: suoac-spin ...` num
  module faz o bundler reescrever o nome para um escopado por arquivo, que nao corresponde a keyframe
  nenhum. A animacao simplesmente nao roda — sem erro, sem aviso, e com o elemento parado no estado
  final, que e o que torna a falha tao facil de passar em revisao. Ver SUC-43.

```css
/* Correto — `var()` e opaco para o bundler, entao o nome chega inteiro ao navegador */
.spinner {
  animation-name: var(--suoac-animation-spin);
  animation-duration: 0.7s;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
```

```css
/* Errado — o nome e reescrito e a animacao nao roda */
.spinner {
  animation: suoac-spin 0.7s linear infinite;
}
```

Ha um token `--suoac-animation-*` por keyframe em `app/globals.css`, declarado ao lado do keyframe
que nomeia. O shorthand `animation` nao serve aqui: o nome precisa vir em `animation-name` para
passar por `var()`, entao declare as demais propriedades em longhands.

Duas saidas que **nao** funcionam, para ninguem reconsiderar: `:global(suoac-spin)` e emitido
verbatim por Lightning CSS e Turbopack, produzindo CSS invalido; e o Next nao expoe a opcao do
Lightning CSS que desligaria o escopo de nomes de animacao. `composes ... from global` funciona, mas
exigiria ensinar `composes` ao editor via `.vscode/settings.json` — arquivo que atrai aviso de
esquema de extensao de terceiro. O token nao precisa de nada disso.

`src/app/styles/motion.test.ts` falha diante de referencia nua.

- Nao redeclare esses `@keyframes` em CSS Module: dentro de um module eles sao escopados por
  arquivo, e a mesma animacao acabaria existindo em varias versoes levemente diferentes.
- Animacao especifica de uma tela nasce no CSS Module daquela tela, com nome proprio — ai o escopo
  por arquivo e justamente o que se quer, e o `composes` nao entra.
- Movimento reduzido ja e tratado globalmente: sob `prefers-reduced-motion`, os tokens de duracao
  caem para valores irrisorios. Nao remova a animacao — entradas com `both`/`forwards` dependem do
  estado final do keyframe para ficarem visiveis.
