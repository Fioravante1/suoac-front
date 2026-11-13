"use client";

import { useTransition } from "react";

import { signOutAction } from "@/features/sign-in";
import { isRedirectRejection } from "@/shared/lib";
import { useToast } from "@/shared/ui/toast";

const SIGN_OUT_FAILED = "Não foi possível sair. Verifique sua conexão e tente de novo.";

export interface SignOutState {
  signOut: () => void;
  /** Saída a caminho: da chamada até a tela de entrada abrir, ou até a falha. */
  isSigningOut: boolean;
}

/**
 * Sai da conta pela mesma Server Action do shell antigo, mas sem deixar a falha de rede
 * derrubar a tela: quem estava no painel continua nele, com a mensagem do motivo.
 *
 * Quando a saída dá certo, a action redireciona para a entrada, e a chamada rejeita depois
 * de o roteador já ter aplicado a navegação (`isRedirectRejection`). Essa rejeição é o
 * sucesso; só o que sobra é falha de fato.
 */
export function useSignOut(): SignOutState {
  const [isSigningOut, startTransition] = useTransition();
  const toast = useToast();

  function signOut() {
    if (isSigningOut) return;

    startTransition(async () => {
      try {
        await signOutAction();
      } catch (error) {
        if (isRedirectRejection(error)) return;

        toast.error(SIGN_OUT_FAILED);
      }
    });
  }

  return { signOut, isSigningOut };
}
