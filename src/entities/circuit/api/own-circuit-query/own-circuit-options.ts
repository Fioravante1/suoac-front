import { queryKeys } from "@/shared/api";

import { fetchOwnCircuit } from "./own-circuit-query";

/**
 * O `circuitId` da sessão só entra na chave do cache; a API descobre o circuito pelo token.
 *
 * A falha fica com quem consome: a faixa do evento vive no layout privado, e o
 * `throwOnError` padrão levaria um erro desta consulta ao `global-error`, derrubando o app
 * inteiro por causa de uma linha de apoio.
 */
export function ownCircuitOptions(circuitId: string) {
  return {
    queryKey: queryKeys.circuits.own(circuitId),
    queryFn: () => fetchOwnCircuit(),
    enabled: Boolean(circuitId),
    throwOnError: false,
  } as const;
}
