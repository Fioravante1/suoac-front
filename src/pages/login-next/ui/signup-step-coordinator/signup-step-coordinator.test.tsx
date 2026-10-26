import { fireEvent, render, screen, within } from "@testing-library/react";
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

    expect(screen.getByText("Use letras maiúsculas, minúsculas, números e símbolos")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Crie uma senha"), { target: { value: "Senha-Segura123" } });

    expect(screen.getByRole("status")).toHaveTextContent("forte");
    expect(screen.getByRole("list", { name: "Requisitos da senha" })).toBeInTheDocument();
  });

  it("deve explicar os requisitos que faltam enquanto a pessoa digita", () => {
    render(<Harness />);

    fireEvent.change(screen.getByLabelText("Crie uma senha"), { target: { value: "senhalongaaaa" } });

    const requirements = screen.getByRole("list", { name: "Requisitos da senha" });
    expect(within(requirements).getByText(/Uma letra maiúscula/)).toHaveTextContent("pendente");
    expect(within(requirements).getByText(/Um número/)).toHaveTextContent("pendente");
    expect(within(requirements).getByText(/12 ou mais caracteres/)).toHaveTextContent("cumprido");
  });

  it("deve permitir mostrar e ocultar a senha sem alterar seu valor", () => {
    render(<Harness />);
    const password = screen.getByLabelText("Crie uma senha");
    fireEvent.change(password, { target: { value: "Senha-Segura123" } });

    fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(password).toHaveAttribute("type", "text");
    expect(password).toHaveValue("Senha-Segura123");

    fireEvent.click(screen.getByRole("button", { name: "Ocultar senha" }));
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveValue("Senha-Segura123");
  });

  it("deve abrir o celular com teclado numérico", () => {
    render(<Harness />);

    expect(screen.getByLabelText("Celular (WhatsApp)")).toHaveAttribute("inputmode", "tel");
  });
});
