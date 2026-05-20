import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SignInForm } from "./sign-in-form";

vi.mock("../api/sign-in-action", () => ({
  signInAction: vi.fn(),
}));

import { signInAction } from "../api/sign-in-action";

const signInActionMock = vi.mocked(signInAction);

describe("SignInForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza os campos e o botao corretamente", () => {
    render(<SignInForm />);
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entrar/i })).toBeInTheDocument();
  });

  it("exibe erros de validacao ao submeter formulario vazio", async () => {
    render(<SignInForm />);
    const button = screen.getByRole("button", { name: /Entrar/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Por favor, insira um e-mail válido/i)).toBeInTheDocument();
      expect(screen.getByText(/A senha deve conter no mínimo 6 caracteres/i)).toBeInTheDocument();
    });

    expect(signInActionMock).not.toHaveBeenCalled();
  });

  it("valida formato de e-mail", async () => {
    render(<SignInForm />);
    const emailInput = screen.getByLabelText(/E-mail/i);
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    const button = screen.getByRole("button", { name: /Entrar/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Por favor, insira um e-mail válido/i)).toBeInTheDocument();
    });
  });

  it("chama signInAction com dados validos", async () => {
    signInActionMock.mockResolvedValue({});

    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText(/E-mail/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Senha/i), {
      target: { value: "Senha@123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Entrar/i }));

    await waitFor(() => {
      expect(signInActionMock).toHaveBeenCalledOnce();
    });

    const [prevState, formData] = signInActionMock.mock.calls[0];
    expect(prevState).toBeUndefined();
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("email")).toBe("user@example.com");
    expect(formData.get("password")).toBe("Senha@123");
  });

  it("exibe erro do servidor quando a action retorna erro", async () => {
    signInActionMock.mockResolvedValue({ error: "E-mail ou senha incorretos." });

    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText(/E-mail/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Senha/i), {
      target: { value: "Senha@123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Entrar/i }));

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("E-mail ou senha incorretos.");
    });
  });
});
