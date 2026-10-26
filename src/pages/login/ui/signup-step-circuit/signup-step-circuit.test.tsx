import { zodResolver } from "@hookform/resolvers/zod";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { signupDefaultValues, signupSchema, type SignupFormValues } from "../../model";

import { SignupStepCircuit } from "./signup-step-circuit";

function Harness() {
  const form = useForm<SignupFormValues>({
    defaultValues: signupDefaultValues,
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.trigger(["circuit", "acceptedTerms"]);
        }}
      >
        <SignupStepCircuit />
        <button type="submit">Validar</button>
        <button
          type="button"
          onClick={() =>
            form.setError("circuit.name", {
              type: "server",
              message: "Este circuito já está em uso. Informe outro circuito.",
            })
          }
        >
          Simular conflito
        </button>
      </form>
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

describe("interações da etapa de circuito", () => {
  it.each(["Circuito", "UF"])("deve converter %s durante a digitação e preservar a seleção", (label) => {
    render(<Harness />);
    const input = screen.getByLabelText<HTMLInputElement>(label);
    fireEvent.change(input, {
      target: { value: "sp", selectionStart: 1, selectionEnd: 2, selectionDirection: "backward" },
    });
    expect(input).toHaveValue("SP");
    expect(input.selectionStart).toBe(1);
    expect(input.selectionEnd).toBe(2);
    expect(input.selectionDirection).toBe("backward");
  });

  it("deve aceitar o circuito real com espaço e manter o cursor no meio", () => {
    render(<Harness />);
    const input = screen.getByLabelText<HTMLInputElement>("Circuito");
    fireEvent.change(input, { target: { value: "sp-019 a", selectionStart: 4, selectionEnd: 4 } });
    expect(input).toHaveValue("SP-019 A");
    expect(input.selectionStart).toBe(4);
  });

  it("deve exibir o privilégio fixo como informação", () => {
    render(<Harness />);
    const privilege = screen.getByRole("group", { name: "Seu privilégio" });
    expect(within(privilege).getByText("Coordenador do arranjo de ônibus no circuito")).toBeInTheDocument();
    expect(privilege.querySelector("input, select, button")).toBeNull();
  });

  it("deve associar a explicação de aceite ao checkbox e limpar ao aceitar", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Validar" }));
    const checkbox = screen.getByRole("checkbox");
    await waitFor(() => expect(checkbox).toHaveAccessibleDescription("Aceite os termos para continuar."));
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    fireEvent.click(checkbox);
    await waitFor(() => expect(checkbox).not.toHaveAttribute("aria-invalid"));
    expect(screen.queryByText("Aceite os termos para continuar.")).not.toBeInTheDocument();
  });

  it("deve abrir os documentos em outra aba sem marcar o aceite", () => {
    render(<Harness />);
    const terms = screen.getByRole("link", { name: "termos de uso" });
    const privacy = screen.getByRole("link", { name: "política de privacidade" });
    expect(terms).toHaveAttribute("href", "/termos");
    expect(privacy).toHaveAttribute("href", "/privacidade");
    for (const link of [terms, privacy]) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("deve mostrar conflito de unicidade no campo do circuito", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Simular conflito" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Circuito")).toHaveAccessibleDescription(
        "Este circuito já está em uso. Informe outro circuito.",
      ),
    );
    expect(screen.getByLabelText("Circuito")).toHaveAttribute("aria-invalid", "true");
  });
});
