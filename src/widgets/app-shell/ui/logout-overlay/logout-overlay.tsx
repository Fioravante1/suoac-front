"use client";

import { useFormStatus } from "react-dom";

import { LoadingOverlay } from "@/shared/ui/loading-overlay";

/**
 * Conecta o estado de submit do `<form action={signOutAction}>` pai a um overlay de tela cheia.
 * Como logout muda o contexto inteiro da aplicação (e tem latência de rede + redirect), o
 * feedback é uma cobertura da tela com mensagem, não um spinner pequeno no botão do rodapé.
 * Precisa ser renderizado dentro do form para ler `useFormStatus`.
 */
export function LogoutOverlay() {
  const { pending } = useFormStatus();

  return <LoadingOverlay open={pending} label="Saindo..." />;
}
