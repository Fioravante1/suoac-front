import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { signupDefaultValues, type SignupFormValues } from "../../model";

import { SignupStepCongregations } from "./signup-step-congregations";

function Harness() {
  const form = useForm<SignupFormValues>({ defaultValues: signupDefaultValues });

  return (
    <FormProvider {...form}>
      <SignupStepCongregations />
    </FormProvider>
  );
}

describe("SignupStepCongregations", () => {
  it("deve pedir nome e código da congregação do coordenador", () => {
    render(<Harness />);

    expect(screen.getByLabelText("Congregação")).toBeInTheDocument();
    expect(screen.getByLabelText("Código")).toBeInTheDocument();
  });

  it("deve deixar claro que a primeira congregação é a do coordenador e é obrigatória", () => {
    render(<Harness />);

    // É ela que recebe o `congregationId` do usuário criado, por isso a ordem
    // importa e o rótulo precisa dizer isso.
    expect(screen.getByText(/Sua congregação · obrigatória/)).toBeInTheDocument();
  });

  it("não deve pedir e-mail da congregação", () => {
    render(<Harness />);

    // O coordenador do circuito não tem como saber o e-mail de cada
    // congregação no momento do cadastro (SUC-31).
    expect(screen.queryByLabelText(/E-mail/)).not.toBeInTheDocument();
  });

  it("deve avisar que a lista pode ser completada depois", () => {
    render(<Harness />);

    expect(screen.getByText(/completar a lista e convidar os coordenadores/)).toBeInTheDocument();
  });
});
