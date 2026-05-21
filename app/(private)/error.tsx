"use client";

import { useQueryClient } from "@/shared/api";
import { Button } from "@/shared/ui/button";
import { ErrorState } from "@/shared/ui/error-state";

export default function PrivateError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const queryClient = useQueryClient();

  function handleRetry() {
    queryClient.resetQueries();
    unstable_retry();
  }

  return (
    <ErrorState
      illustration={<img src="/empty_state_onibus_sem_fundo.png" alt="" width={650} height={325} />}
      title="Ops, algo não saiu como esperado"
      description="Estamos com dificuldades para carregar esta página. Tente novamente ou volte ao início."
      action={<Button onClick={handleRetry}>Tentar novamente</Button>}
      secondaryAction={
        <Button
          variant="ghost"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Voltar ao início
        </Button>
      }
    />
  );
}
