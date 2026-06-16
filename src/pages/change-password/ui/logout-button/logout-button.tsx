"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

/**
 * Botão de logout com feedback de loading. Lê o estado do `<form action={signOutAction}>`
 * pai via `useFormStatus`, então precisa ser um Client Component renderizado dentro do form.
 */
export function LogoutButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="secondary" fullWidth disabled={pending}>
      {pending && (
        <>
          <Spinner size="small" />
          Saindo...
        </>
      )}
      {!pending && (
        <>
          <LogOut size={18} />
          Sair da conta
        </>
      )}
    </Button>
  );
}
