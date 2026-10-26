import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RequestPasswordResetResult } from "../../api";

const requestPasswordResetAction = vi.fn<(input: unknown) => Promise<RequestPasswordResetResult>>();

vi.mock("../../api", () => ({
  requestPasswordResetAction: (input: unknown) => requestPasswordResetAction(input),
}));

const { ForgotPasswordForm } = await import("./forgot-password-form");

const EMAIL = "coordenador@circuito.org";

function submitEmail(email = EMAIL) {
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar link" }));
}

beforeEach(() => {
  requestPasswordResetAction.mockReset();
});

describe("ForgotPasswordForm", () => {
  it("envia o e-mail e mostra uma confirmação que não revela a conta", async () => {
    requestPasswordResetAction.mockResolvedValue({ status: "success" });

    render(<ForgotPasswordForm onBack={vi.fn()} />);
    submitEmail();

    expect(await screen.findByRole("heading", { name: "Confira seu e-mail" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Se coordenador@circuito.org estiver cadastrado, você vai receber o link em alguns minutos.",
    );
    expect(screen.getByRole("status")).toHaveTextContent("O link será válido por 1 hora.");
    expect(requestPasswordResetAction).toHaveBeenCalledWith({ email: EMAIL });
  });

  it("valida o e-mail antes de chamar o servidor", async () => {
    render(<ForgotPasswordForm onBack={vi.fn()} />);
    submitEmail("nao-e-email");

    expect(await screen.findByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(requestPasswordResetAction).not.toHaveBeenCalled();
  });

  it("explica a falha e permite tentar novamente", async () => {
    requestPasswordResetAction
      .mockResolvedValueOnce({ status: "error", message: "Verifique sua conexão e tente novamente." })
      .mockResolvedValueOnce({ status: "success" });

    render(<ForgotPasswordForm onBack={vi.fn()} />);
    submitEmail();

    expect(await screen.findByRole("alert")).toHaveTextContent("Verifique sua conexão e tente novamente.");
    expect(screen.getByRole("button", { name: "Enviar link" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Enviar link" }));
    expect(await screen.findByRole("heading", { name: "Confira seu e-mail" })).toBeInTheDocument();
  });

  it("bloqueia o formulário enquanto envia", async () => {
    let release: (result: RequestPasswordResetResult) => void = () => {};
    requestPasswordResetAction.mockReturnValue(new Promise((resolve) => (release = resolve)));

    render(<ForgotPasswordForm onBack={vi.fn()} />);
    submitEmail();

    expect(await screen.findByRole("button", { name: /Enviando/ })).toBeDisabled();
    expect(screen.getByLabelText("E-mail")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeDisabled();

    release({ status: "success" });
    await screen.findByRole("heading", { name: "Confira seu e-mail" });
  });

  it("volta ao login pelo topo ou pela confirmação", async () => {
    const onBack = vi.fn();
    requestPasswordResetAction.mockResolvedValue({ status: "success" });

    render(<ForgotPasswordForm onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(onBack).toHaveBeenCalledOnce();

    submitEmail();
    await screen.findByRole("heading", { name: "Confira seu e-mail" });
    fireEvent.click(screen.getByRole("button", { name: "Voltar para o login" }));

    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(2));
  });
});
