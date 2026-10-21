import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { signupDefaultValues, signupSchema, type SignupFormValues } from "../../model";

import { SignupStepCongregations } from "./signup-step-congregations";

function Harness() {
  const form = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema), defaultValues: signupDefaultValues });

  return (
    <FormProvider {...form}>
      <SignupStepCongregations />
      <button type="button" onClick={() => void form.trigger("congregations")}>
        validar
      </button>
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

  describe("lista dinâmica", () => {
    function addRow() {
      fireEvent.click(screen.getByRole("button", { name: "Adicionar congregação" }));
    }

    it("não deve oferecer remover a congregação do coordenador", () => {
      render(<Harness />);

      expect(screen.queryByRole("button", { name: /Remover congregação/ })).not.toBeInTheDocument();
    });

    it("deve adicionar uma linha opcional", () => {
      render(<Harness />);

      addRow();

      expect(screen.getByText(/Outras congregações · opcional/)).toBeInTheDocument();
      expect(screen.getByLabelText("Congregação 2")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Remover congregação 2" })).toBeInTheDocument();
    });

    it("deve apontar o erro na linha que tem nome e não tem código", async () => {
      render(<Harness />);
      fireEvent.change(screen.getByLabelText("Congregação"), { target: { value: "Jardim Paulista" } });
      fireEvent.change(screen.getByLabelText("Código"), { target: { value: "31245" } });
      addRow();
      fireEvent.change(screen.getByLabelText("Congregação 2"), { target: { value: "Taquaral" } });

      fireEvent.click(screen.getByRole("button", { name: "validar" }));

      await waitFor(() => expect(screen.getByText("Informe o código.")).toBeInTheDocument());
      expect(screen.getByLabelText("Código da congregação 2")).toBeInvalid();
      expect(screen.getByLabelText("Código")).toBeValid();
    });

    it("não deve acusar erro numa linha adicional completamente vazia", async () => {
      render(<Harness />);
      fireEvent.change(screen.getByLabelText("Congregação"), { target: { value: "Jardim Paulista" } });
      fireEvent.change(screen.getByLabelText("Código"), { target: { value: "31245" } });
      addRow();

      fireEvent.click(screen.getByRole("button", { name: "validar" }));

      await waitFor(() => expect(screen.getByLabelText("Código")).toBeValid());
      expect(screen.queryByText("Informe o código.")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Congregação 2")).toBeValid();
    });

    it("deve preservar os valores das outras linhas ao remover uma do meio", () => {
      render(<Harness />);
      addRow();
      addRow();
      addRow();
      fireEvent.change(screen.getByLabelText("Congregação 2"), { target: { value: "Alfa" } });
      fireEvent.change(screen.getByLabelText("Congregação 3"), { target: { value: "Beta" } });
      fireEvent.change(screen.getByLabelText("Congregação 4"), { target: { value: "Gama" } });

      fireEvent.click(screen.getByRole("button", { name: "Remover congregação 3" }));

      expect(screen.getByLabelText("Congregação 2")).toHaveValue("Alfa");
      expect(screen.getByLabelText("Congregação 3")).toHaveValue("Gama");
      expect(screen.queryByLabelText("Congregação 4")).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue("Beta")).not.toBeInTheDocument();
    });
  });
});
