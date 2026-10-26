import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SignInResult } from "../../api";

const signInAction = vi.fn<(input: unknown) => Promise<SignInResult>>();
const push = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("../../api", () => ({
  signInAction: (input: unknown) => signInAction(input),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams,
}));

const { SignInForm } = await import("./sign-in-form");

const CREDENTIALS = { email: "coordenador@circuito.org", password: "senha-correta", rememberMe: false };

function fillCredentials({ email, password }: { email: string; password: string } = CREDENTIALS) {
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: password } });
}

function getSubmit() {
  return screen.getByRole("button", { name: /Entrar|Verificando|Bem-vindo/ });
}

/** Deixa a ação pendente, para observar o estado de carregamento. */
function givenSignInHangs() {
  let release: (result: SignInResult) => void = () => {};
  signInAction.mockReturnValue(new Promise<SignInResult>((resolve) => (release = resolve)));

  return (result: SignInResult) => release(result);
}

beforeEach(() => {
  signInAction.mockReset();
  push.mockReset();
  searchParams = new URLSearchParams();
});

describe("SignInForm", () => {
  it("entra no sistema e leva o usuário ao painel", async () => {
    signInAction.mockResolvedValue({ status: "success", firstName: "Fioravante", redirectTo: "/dashboard" });

    render(<SignInForm />);
    fillCredentials();
    fireEvent.click(getSubmit());

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(signInAction).toHaveBeenCalledWith({ ...CREDENTIALS, returnUrl: null });
  });

  it("confirma a entrada pelo nome de quem entrou, antes de sair da tela", async () => {
    signInAction.mockResolvedValue({ status: "success", firstName: "Fioravante", redirectTo: "/dashboard" });

    render(<SignInForm />);
    fillCredentials();
    fireEvent.click(getSubmit());

    expect(await screen.findByText("Bem-vindo, Fioravante")).toBeInTheDocument();
  });

  it("mostra que está verificando enquanto a resposta não chega", async () => {
    const release = givenSignInHangs();

    render(<SignInForm />);
    fillCredentials();
    fireEvent.click(getSubmit());

    expect(await screen.findByText("Verificando…")).toBeInTheDocument();
    expect(getSubmit()).toBeDisabled();

    release({ status: "success", firstName: "Fioravante", redirectTo: "/dashboard" });
    await waitFor(() => expect(push).toHaveBeenCalled());
  });

  it("explica credencial inválida sem tirar o usuário da tela", async () => {
    signInAction.mockResolvedValue({ status: "error", message: "E-mail ou senha incorretos." });

    render(<SignInForm />);
    fillCredentials();
    fireEvent.click(getSubmit());

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos.");
    expect(push).not.toHaveBeenCalled();
    expect(getSubmit()).toBeEnabled();
  });

  it("valida o e-mail antes de incomodar o servidor", async () => {
    render(<SignInForm />);
    fillCredentials({ email: "nao-e-email", password: "senha-correta" });
    fireEvent.click(getSubmit());

    expect(await screen.findByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(signInAction).not.toHaveBeenCalled();
  });

  it("submete pelo Enter, de dentro de qualquer campo", async () => {
    signInAction.mockResolvedValue({ status: "success", firstName: "Fioravante", redirectTo: "/dashboard" });

    render(<SignInForm />);
    fillCredentials();
    fireEvent.submit(screen.getByLabelText("Senha").closest("form") as HTMLFormElement);

    await waitFor(() => expect(signInAction).toHaveBeenCalled());
  });

  it("alterna a visibilidade da senha", () => {
    render(<SignInForm />);

    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));

    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "text");
  });

  it("devolve o usuário à tela de onde a sessão expirou", async () => {
    searchParams = new URLSearchParams({ sessionExpired: "true", returnUrl: "/financial" });
    signInAction.mockResolvedValue({ status: "success", firstName: "Fioravante", redirectTo: "/financial" });

    render(<SignInForm />);

    expect(screen.getByRole("status")).toHaveTextContent("Sua sessão expirou.");

    fillCredentials();
    fireEvent.click(getSubmit());

    await waitFor(() => expect(signInAction).toHaveBeenCalledWith({ ...CREDENTIALS, returnUrl: "/financial" }));
  });

  it("deixa inertes os caminhos cujas telas ainda não existem", () => {
    render(<SignInForm />);

    expect(screen.getByRole("button", { name: "Esqueci a senha" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Seu circuito ainda não usa o SUOAC/ })).toBeDisabled();
  });

  it("abre recuperação de senha e autocadastro quando a tela existe", () => {
    const onForgotPassword = vi.fn();
    const onSignUp = vi.fn();

    render(<SignInForm onForgotPassword={onForgotPassword} onSignUp={onSignUp} />);

    fireEvent.click(screen.getByRole("button", { name: "Esqueci a senha" }));
    fireEvent.click(screen.getByRole("button", { name: /Seu circuito ainda não usa o SUOAC/ }));

    expect(onForgotPassword).toHaveBeenCalledOnce();
    expect(onSignUp).toHaveBeenCalledOnce();
  });

  it("mostra o Manter conectado desmarcado e habilitado: a sessão estendida é escolha explícita", () => {
    render(<SignInForm />);

    const checkbox = screen.getByRole("checkbox", { name: "Manter conectado neste dispositivo" });

    expect(checkbox).not.toBeChecked();
    expect(checkbox).toBeEnabled();
  });

  it("envia à ação de entrada o que o usuário escolheu em Manter conectado", async () => {
    signInAction.mockResolvedValue({ status: "success", firstName: "Maria", redirectTo: "/dashboard" });
    render(<SignInForm />);
    fillCredentials();
    fireEvent.click(screen.getByRole("checkbox", { name: "Manter conectado neste dispositivo" }));

    fireEvent.click(getSubmit());

    await waitFor(() => expect(signInAction).toHaveBeenCalledTimes(1));
    expect(signInAction).toHaveBeenCalledWith({ ...CREDENTIALS, rememberMe: true, returnUrl: null });
  });
});
