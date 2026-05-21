"use client";

import { useQueryClient } from "@/shared/api";
import { Button } from "@/shared/ui/button";
import { ErrorState } from "@/shared/ui/error-state";

export default function AuthError({
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
      illustration={<img src="/empty_state_onibus_sem_fundo.png" alt="" width={320} height={160} />}
      title="Ops, algo não saiu como esperado"
      description="Estamos com dificuldades para carregar esta página. Tente novamente ou volte ao login."
      action={<Button onClick={handleRetry}>Tentar novamente</Button>}
      secondaryAction={
        <Button
          variant="ghost"
          onClick={() => {
            window.location.href = "/login";
          }}
        >
          Voltar ao login
        </Button>
      }
    />
  );
}
