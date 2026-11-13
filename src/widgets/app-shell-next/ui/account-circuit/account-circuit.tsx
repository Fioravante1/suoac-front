import { formatCircuitLocation, formatCircuitName, ownCircuitOptions } from "@/entities/circuit";
import { useQuery } from "@/shared/api";
import { Skeleton } from "@/shared/ui/skeleton";

import styles from "./account-circuit.module.css";

type AccountCircuitProps = Readonly<{
  circuitId: string;
}>;

/**
 * Bloco "Circuito" do menu da conta. O `v3` mostra, abaixo do nome, a contagem de
 * congregações e o assistente; a API ainda não os expõe (SUC-123), e até lá a linha
 * mostra a cidade e a UF do circuito.
 */
export function AccountCircuit({ circuitId }: AccountCircuitProps) {
  // `isLoading`, e não `isPending`: consulta desabilitada (sessão sem circuito) fica pendente
  // para sempre, e o bloco mostraria o carregamento sem fim.
  const { data: circuit, isLoading, isError, isFetching, refetch } = useQuery(ownCircuitOptions(circuitId));

  const isFailed = isError && !circuit;

  return (
    <div className={styles.circuit}>
      <span className={styles.label}>Circuito</span>

      {circuit && (
        <>
          <span className={styles.name}>{formatCircuitName(circuit)}</span>
          <span className={styles.location}>{formatCircuitLocation(circuit)}</span>
        </>
      )}

      {isLoading && (
        <span className={styles.loading} role="status" aria-label="Carregando o circuito">
          <Skeleton className={styles.loadingName} />
          <Skeleton className={styles.loadingLocation} />
        </span>
      )}

      {isFailed && (
        <span className={styles.failure}>
          <span className={styles.location}>Não foi possível carregar o circuito.</span>
          <button type="button" className={styles.retry} onClick={() => refetch()} disabled={isFetching}>
            Tentar de novo
          </button>
        </span>
      )}
    </div>
  );
}
