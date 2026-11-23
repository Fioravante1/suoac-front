const INTEGER_FORMATTER = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export function calcPercentage(value: number, total: number): number {
  if (total === 0) return 0;

  return Math.round((value / total) * 100);
}

/** Inteiro com separador de milhar, como uma contagem: "1.204". */
export function formatInteger(value: number): string {
  return INTEGER_FORMATTER.format(value);
}
