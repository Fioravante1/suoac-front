const BRAZILIAN_CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value: string | number): string {
  return BRAZILIAN_CURRENCY_FORMATTER.format(Number(value));
}

/**
 * Moeda sem os centavos quando eles são zero, como o painel escreve o valor por dia: "R$ 40",
 * mas "R$ 40,50". Para totais e saldos, use `formatCurrency`, que sempre mostra os centavos.
 */
export function formatCurrencyCompact(value: string | number): string {
  return formatCurrency(value).replace(/,00$/, "");
}

function toCents(value: string | number): number {
  return Math.round(Number(value) * 100);
}

export function subtractCurrency(a: string | number, b: string | number): number {
  return (toCents(a) - toCents(b)) / 100;
}
