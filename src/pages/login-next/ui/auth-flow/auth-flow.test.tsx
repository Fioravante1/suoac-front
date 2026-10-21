import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../api", () => ({
  requestPasswordResetAction: vi.fn(),
  signInAction: vi.fn(),
  submitCircuitSignupAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const { AuthFlow } = await import("./auth-flow");
const { submitCircuitSignupAction } = await import("../../api");

describe("AuthFlow", () => {
  it("abre a recuperação de senha e permite voltar à entrada", () => {
    render(<AuthFlow />);

    fireEvent.click(screen.getByRole("button", { name: "Esqueci a senha" }));
    expect(screen.getByRole("heading", { name: "Recuperar senha" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });

  it("leva ao aviso de confirmação, com o e-mail, depois que o autocadastro é enviado", async () => {
    vi.mocked(submitCircuitSignupAction).mockResolvedValue({ status: "success", email: "joao@example.com" });
    render(<AuthFlow />);

    fireEvent.click(screen.getByRole("button", { name: /Seu circuito ainda não usa o SUOAC/ }));
    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "João Silva" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "joao@example.com" } });
    fireEvent.change(screen.getByLabelText("Celular (WhatsApp)"), { target: { value: "(19) 99999-9999" } });
    fireEvent.change(screen.getByLabelText("Crie uma senha"), { target: { value: "Senha123" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(screen.getByText("Etapa 2 de 3")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("Circuito"), { target: { value: "SP-17" } });
    fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: "Campinas" } });
    fireEvent.change(screen.getByLabelText("UF"), { target: { value: "SP" } });
    fireEvent.click(screen.getByLabelText(/Li e aceito os termos/));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(screen.getByText("Etapa 3 de 3")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("Congregação"), { target: { value: "Jardim Paulista" } });
    fireEvent.change(screen.getByLabelText("Código"), { target: { value: "31245" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar circuito" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "Confira seu e-mail" })).toBeInTheDocument());
    expect(screen.getByText("joao@example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Voltar para o login" }));
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });
});
