import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { ChangePasswordForm } from "./change-password-form";

vi.mock("../api/change-password-action", () => ({
  changePasswordAction: vi.fn(),
}));

import { changePasswordAction } from "../api/change-password-action";

const changePasswordActionMock = vi.mocked(changePasswordAction);

function fillValidForm() {
  fireEvent.change(screen.getByLabelText("Senha atual"), { target: { value: "80275@Suoac" } });
  fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "NovaSenhaForte123" } });
  fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "NovaSenhaForte123" } });
}

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza os três campos e o botão", () => {
    render(<ChangePasswordForm />);

    expect(screen.getByLabelText("Senha atual")).toBeInTheDocument();
    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar nova senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Definir nova senha/i })).toBeInTheDocument();
  });

  it("não chama a action e exibe erros ao submeter vazio", async () => {
    render(<ChangePasswordForm />);

    fireEvent.click(screen.getByRole("button", { name: /Definir nova senha/i }));

    await waitFor(() => {
      expect(screen.getByText("Informe sua senha atual.")).toBeInTheDocument();
      expect(screen.getByText(/no mínimo 8 caracteres/i)).toBeInTheDocument();
    });

    expect(changePasswordActionMock).not.toHaveBeenCalled();
  });

  it("valida que a confirmação coincide", async () => {
    render(<ChangePasswordForm />);

    fireEvent.change(screen.getByLabelText("Senha atual"), { target: { value: "80275@Suoac" } });
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "NovaSenhaForte123" } });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "Diferente123" } });

    fireEvent.click(screen.getByRole("button", { name: /Definir nova senha/i }));

    await waitFor(() => {
      expect(screen.getByText("As senhas não coincidem.")).toBeInTheDocument();
    });

    expect(changePasswordActionMock).not.toHaveBeenCalled();
  });

  it("chama a action com os dados no FormData", async () => {
    changePasswordActionMock.mockResolvedValue({});

    render(<ChangePasswordForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: /Definir nova senha/i }));

    await waitFor(() => {
      expect(changePasswordActionMock).toHaveBeenCalledOnce();
    });

    const [prevState, formData] = changePasswordActionMock.mock.calls[0];
    expect(prevState).toBeUndefined();
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("currentPassword")).toBe("80275@Suoac");
    expect(formData.get("newPassword")).toBe("NovaSenhaForte123");
    expect(formData.get("confirmPassword")).toBe("NovaSenhaForte123");
  });

  it("desabilita os campos enquanto a troca de senha está em andamento", async () => {
    let resolveAction: (value: { error?: string }) => void = () => {};
    changePasswordActionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );

    render(<ChangePasswordForm />);
    fillValidForm();

    const currentPassword = screen.getByLabelText("Senha atual");
    const newPassword = screen.getByLabelText("Nova senha");
    const confirmPassword = screen.getByLabelText("Confirmar nova senha");

    fireEvent.click(screen.getByRole("button", { name: /Definir nova senha/i }));

    await waitFor(() => {
      expect(currentPassword).toBeDisabled();
      expect(newPassword).toBeDisabled();
      expect(confirmPassword).toBeDisabled();
    });

    resolveAction({});

    await waitFor(() => {
      expect(currentPassword).not.toBeDisabled();
      expect(newPassword).not.toBeDisabled();
      expect(confirmPassword).not.toBeDisabled();
    });
  });

  it("exibe o erro do servidor em banner quando a action retorna erro genérico", async () => {
    changePasswordActionMock.mockResolvedValue({ error: "Não foi possível alterar a senha. Tente novamente." });

    render(<ChangePasswordForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: /Definir nova senha/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível alterar a senha. Tente novamente.");
    });
  });

  it("associa o erro ao campo quando a action retorna field", async () => {
    changePasswordActionMock.mockResolvedValue({ field: "currentPassword", error: "Senha atual incorreta." });

    render(<ChangePasswordForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: /Definir nova senha/i }));

    await waitFor(() => {
      expect(screen.getByText("Senha atual incorreta.")).toBeInTheDocument();
    });

    // Erro de campo não usa o banner global.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
