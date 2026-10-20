import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { signupDefaultValues, type SignupFormValues } from "../../model";

import { SignupStepCircuit } from "./signup-step-circuit";

function Harness() {
  const form = useForm<SignupFormValues>({ defaultValues: signupDefaultValues });

  return (
    <FormProvider {...form}>
      <SignupStepCircuit />
    </FormProvider>
  );
}

describe("SignupStepCircuit", () => {
  it("deve pedir circuito, cidade e UF", () => {
    render(<Harness />);

    expect(screen.getByLabelText("Circuito")).toBeInTheDocument();
    expect(screen.getByLabelText("Cidade")).toBeInTheDocument();
    expect(screen.getByLabelText("UF")).toBeInTheDocument();
  });

  it("não deve pedir um nome descritivo separado", () => {
    render(<Harness />);

    expect(screen.queryByLabelText("Código do circuito")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nome do circuito")).not.toBeInTheDocument();
  });

  it("deve limitar o identificador à janela de compatibilidade", () => {
    render(<Harness />);

    expect(screen.getByLabelText("Circuito")).toHaveAttribute("maxlength", "20");
  });

  it("deve limitar a UF a duas letras no próprio campo", () => {
    render(<Harness />);

    expect(screen.getByLabelText("UF")).toHaveAttribute("maxlength", "2");
  });

  it("deve nascer com os termos desmarcados", () => {
    render(<Harness />);

    // Aceite tem de ser ato do usuário; marcado por padrão não é aceite.
    expect(screen.getByLabelText(/Li e aceito os termos/)).not.toBeChecked();
  });
});
