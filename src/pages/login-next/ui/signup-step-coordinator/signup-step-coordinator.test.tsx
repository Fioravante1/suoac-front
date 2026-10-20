import { fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { signupDefaultValues, type SignupFormValues } from "../../model";

import { SignupStepCoordinator } from "./signup-step-coordinator";

/**
 * A etapa lê o formulário pelo contexto, então o teste a monta dentro de um
 * provider — é o mesmo arranjo que o chassi usa em produção.
 */
function Harness() {
  const form = useForm<SignupFormValues>({ defaultValues: signupDefaultValues });

  return (
    <FormProvider {...form}>
      <SignupStepCoordinator />
    </FormProvider>
  );
}

describe("SignupStepCoordinator", () => {
  it("deve pedir os quatro dados do coordenador", () => {
    render(<Harness />);

    expect(screen.getByLabelText("Nome completo")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Celular (WhatsApp)")).toBeInTheDocument();
    expect(screen.getByLabelText("Crie uma senha")).toBeInTheDocument();
  });

  it("deve marcar o campo de senha como nova senha para o gerenciador do navegador", () => {
    render(<Harness />);

    expect(screen.getByLabelText("Crie uma senha")).toHaveAttribute("autocomplete", "new-password");
  });

  it("deve mostrar a força da senha abaixo do campo enquanto ela é digitada", () => {
    render(<Harness />);

    expect(screen.getByText("Use letras maiúsculas, minúsculas e números")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Crie uma senha"), { target: { value: "Senha123" } });

    expect(screen.getByRole("status")).toHaveTextContent("forte");
    expect(screen.queryByRole("list", { name: "Requisitos da senha" })).not.toBeInTheDocument();
  });

  it("deve abrir o celular com teclado numérico", () => {
    render(<Harness />);

    // A máscara entra no SUC-29; o teclado certo não depende dela.
    expect(screen.getByLabelText("Celular (WhatsApp)")).toHaveAttribute("inputmode", "tel");
  });
});
