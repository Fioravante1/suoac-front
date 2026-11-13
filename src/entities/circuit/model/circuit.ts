/** Circuito como a API o devolve (`GET /circuits/me`), sem as datas de auditoria. */
export interface Circuit {
  id: string;
  /** Identificador do circuito, como `SP-17`. A palavra "Circuito" fica com quem exibe. */
  name: string;
  city: string;
  /** UF em duas letras maiúsculas. */
  state: string;
}

/** "Circuito SP-17": o nome como aparece na faixa do evento e no menu da conta. */
export function formatCircuitName(circuit: Pick<Circuit, "name">): string {
  return `Circuito ${circuit.name}`;
}

/** "Campinas, SP": a cidade e a UF do circuito. */
export function formatCircuitLocation(circuit: Pick<Circuit, "city" | "state">): string {
  return `${circuit.city}, ${circuit.state}`;
}
