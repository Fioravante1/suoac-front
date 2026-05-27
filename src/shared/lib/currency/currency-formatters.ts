const BRAZILIAN_CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value: string | number): string {
  return BRAZILIAN_CURRENCY_FORMATTER.format(Number(value));
}
