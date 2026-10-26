export function pluralize(count: number, singular: string): string {
  return count !== 1 ? `${singular}s` : singular;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Primeiro nome, para saudacao ("Ola, Maria!"); sem nome, devolve vazio. */
export function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

export function getGreetingByTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";

  return "Boa noite";
}
