export const USER_ROLES = {
  CIRCUIT_COORDINATOR: "CIRCUIT_COORDINATOR",
  CIRCUIT_ASSISTANT: "CIRCUIT_ASSISTANT",
  CONGREGATION_COORDINATOR: "CONGREGATION_COORDINATOR",
  CONGREGATION_ASSISTANT: "CONGREGATION_ASSISTANT",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * O privilégio de cada papel, por extenso — fonte única para o menu da conta e o convite.
 * Nunca "coordenador" sozinho: existe também o coordenador do corpo de anciãos, e o nome
 * completo é o que separa os dois.
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  CIRCUIT_COORDINATOR: "Coordenador do arranjo de ônibus no circuito",
  CIRCUIT_ASSISTANT: "Assistente do arranjo de ônibus no circuito",
  CONGREGATION_COORDINATOR: "Coordenador do arranjo de ônibus na congregação",
  CONGREGATION_ASSISTANT: "Assistente do arranjo de ônibus na congregação",
};
