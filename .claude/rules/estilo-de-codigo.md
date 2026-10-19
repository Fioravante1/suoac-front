---
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

### Prettier

O padrao real do projeto esta em `.prettierrc.json`.

Nao gere codigo fora desse padrao. Rode `yarn format` quando necessario.
