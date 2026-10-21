/** Converte o valor real do campo, mantendo seleção e direção inclusive quando uma letra se expande. */
export function uppercaseInput(input: HTMLInputElement): void {
  const value = input.value;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const direction = input.selectionDirection ?? "none";
  input.value = value.toUpperCase();

  // Alguns tipos de input não expõem seleção e recusam setSelectionRange.
  if (start === null || end === null) return;

  input.setSelectionRange(
    value.slice(0, start).toUpperCase().length,
    value.slice(0, end).toUpperCase().length,
    direction,
  );
}
