export function pluralize(count: number, singular: string): string {
  return count !== 1 ? `${singular}s` : singular;
}

export function getGreetingByTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";

  return "Boa noite";
}
