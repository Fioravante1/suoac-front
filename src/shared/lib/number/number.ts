export function calcPercentage(value: number, total: number): number {
  if (total === 0) return 0;

  return Math.round((value / total) * 100);
}
