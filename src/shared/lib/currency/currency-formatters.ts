const BRAZILIAN_CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value: string | number): string {
  return BRAZILIAN_CURRENCY_FORMATTER.format(Number(value));
}

function toCents(value: string | number): number {
  return Math.round(Number(value) * 100);
}

export function subtractCurrency(a: string | number, b: string | number): number {
  return (toCents(a) - toCents(b)) / 100;
}
