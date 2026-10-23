---
trigger: model_decision
description: Quando criar ou editar código TypeScript/React em src/**/*.{ts,tsx}, app/**/*.{ts,tsx} ou tests/**/*.{ts,tsx}
paths:
  - "src/**/*.{ts,tsx}"
  - "app/**/*.{ts,tsx}"
  - "tests/**/*.{ts,tsx}"
---

# Estilo de codigo, tipagem e lint

- TypeScript em strict mode.
- Nao use `any`.
- Prefira `import type` para imports apenas de tipo.
- Funcoes exportadas com logica relevante devem ter retorno claro/inferivel; se a inferencia ficar
  ambigua, anote explicitamente.
- Nao deixe imports, variaveis ou parametros sem uso.
- Nao crie barrel exports globais que exportam tudo sem criterio.
- Nao use `console.log` em codigo de producao frontend.

O veto a `if` aninhado e a ternario aninhado vale para os dois repositorios e esta em
`.claude/rules/compartilhado/aninhamento-e-ternarios.md`. O recorte abaixo e o caso de JSX, que
so existe aqui: **nomeie cada estado e renderize com `&&`** — cada condicao responde por si e se
le isoladamente, em vez de depender da eliminacao dos casos anteriores.

```tsx
// Correto — estados nomeados, cada um se explica sozinho
function SubmitLabel({ greeting, isSubmitting }: SubmitLabelProps) {
  const isWelcoming = greeting !== null;
  const isChecking = isSubmitting && !isWelcoming;
  const isIdle = !isChecking && !isWelcoming;

  return (
    <>
      {isIdle && <span>Entrar</span>}
      {isChecking && <span>Verificando…</span>}
      {isWelcoming && <span>Bem-vindo, {greeting}</span>}
    </>
  );
}
```

```tsx
// Errado — cadeia de ternarios: o ultimo caso so se entende por eliminacao
function SubmitLabel({ greeting, isSubmitting }: SubmitLabelProps) {
  return greeting !== null ? (
    <span>Bem-vindo, {greeting}</span>
  ) : isSubmitting ? (
    <span>Verificando…</span>
  ) : (
    <span>Entrar</span>
  );
}
```

Identificadores em ingles, portugues para o que pessoas leem, e `kebab-case` em arquivos e pastas:
ver `.claude/rules/compartilhado/idioma-do-codigo.md`.

- Componentes e tipos usam PascalCase.
- Hooks usam camelCase com prefixo `use`.

### Estrutura de um arquivo de componente

O componente e o ultimo bloco do arquivo: **nenhuma funcao de modulo fica abaixo dele**. Quem abre o
arquivo le de cima para baixo — imports, tipos, constantes e, por fim, o componente —, e uma funcao
solta depois dele obriga a procurar o que o componente chama no rodape.

- **Handlers e derivacoes pequenas ficam dentro do componente**, como `function handleSubmit()` ou
  `function resolveMatchStatus()`, perto do JSX que os usa. Esse e o padrao do projeto
  (`reset-password-form`, `accept-invitation-flow`).
- **Logica pura que passa de poucas linhas** — calculo sobre texto, intervalo, regra de formato —
  nao mora no `.tsx`: vai para o segmento `lib` (ou `model`, se for do dominio) como modulo proprio,
  com teste unitario, e o componente so a chama. E o que a torna testavel sem montar a tela e
  reaproveitavel por outro campo (`phoneDeletionRange` em `shared/lib/phone`, usada por
  `PhoneFieldNext`).
- **Subcomponente** usado so por um componente nasce em pasta propria dentro de `ui/`, como qualquer
  modulo (ver "Organizacao interna de segmentos" em `arquitetura-fsd.md`) — nao como segunda funcao
  no mesmo arquivo.

```tsx
// Errado — a logica de texto fica solta abaixo do componente
export function PhoneField(props: PhoneFieldProps) {
  return <TextField onKeyDown={selectPhoneDigitToDelete} {...props} />;
}

function selectPhoneDigitToDelete(event: KeyboardEvent<HTMLInputElement>) {
  /* ...dezenas de linhas de manipulacao de texto... */
}

// Correto — a regra vive em `shared/lib/phone`, com teste; o componente so liga os fios
export function PhoneField({ onKeyDown, ...props }: PhoneFieldProps) {
  function extendDeletionOverSeparators(event: KeyboardEvent<HTMLInputElement>) {
    const { selectionStart, selectionEnd, value } = event.currentTarget;

    if (!isPhoneDeletionKey(event.key) || selectionStart !== selectionEnd) return;

    const [start, end] = phoneDeletionRange(value, selectionStart ?? 0, event.key);
    event.currentTarget.setSelectionRange(start, end);
  }

  return (
    <TextField
      onKeyDown={(event) => {
        extendDeletionOverSeparators(event);
        onKeyDown?.(event);
      }}
      {...props}
    />
  );
}
```

Vale para os arquivos que voce cria ou toca. Arquivo existente que ja foge disso migra pela regra do
escoteiro: ao mexer nele, mova a funcao daquele arquivo junto com a mudanca — sem mutirao.

### Prettier

O padrao real do projeto esta em `.prettierrc.json`.

Nao gere codigo fora desse padrao. Rode `yarn format` quando necessario.
