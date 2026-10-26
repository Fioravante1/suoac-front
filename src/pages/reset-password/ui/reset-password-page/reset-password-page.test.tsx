import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TokenState } from "../../model";

const verifyResetTokenAction = vi.fn<(token: string) => Promise<TokenState>>();

vi.mock("../../api/verify-reset-token-action", () => ({
  verifyResetTokenAction: (token: string) => verifyResetTokenAction(token),
}));

vi.mock("@/widgets/auth-shell", () => ({
  AuthShell: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-shell">{children}</div>,
  InnerAuthScreen: ({ children }: { children: React.ReactNode }) => <div data-testid="inner-screen">{children}</div>,
}));

vi.mock("../reset-password-form", () => ({
  ResetPasswordForm: ({ token }: { token: string }) => <form data-testid="form">{token}</form>,
}));

const { ResetPasswordPage } = await import("./reset-password-page");

beforeEach(() => {
  verifyResetTokenAction.mockReset();
});

describe("ResetPasswordPage", () => {
  it("verifica o token no servidor antes de mostrar qualquer campo", async () => {
    verifyResetTokenAction.mockResolvedValue("valid");

    render(await ResetPasswordPage({ token: "token-do-link" }));

    expect(verifyResetTokenAction).toHaveBeenCalledWith("token-do-link");
    expect(screen.getByTestId("form")).toHaveTextContent("token-do-link");
  });

  it("mostra o aviso do estado em vez do formulário quando o token não serve", async () => {
    verifyResetTokenAction.mockResolvedValue("expired");

    render(await ResetPasswordPage({ token: "token-velho" }));

    expect(screen.getByRole("heading", { name: "Este link expirou" })).toBeInTheDocument();
    expect(screen.queryByTestId("form")).not.toBeInTheDocument();
  });

  it("trata link sem token como inválido", async () => {
    verifyResetTokenAction.mockResolvedValue("invalid");

    render(await ResetPasswordPage({}));

    expect(verifyResetTokenAction).toHaveBeenCalledWith("");
    expect(screen.getByRole("heading", { name: "Este link não é válido" })).toBeInTheDocument();
  });

  it("recusa token repetido na query string", async () => {
    // `?token=a&token=b` chega como array: não há como saber qual a pessoa
    // pretendia usar, e adivinhar seria pior do que recusar.
    verifyResetTokenAction.mockResolvedValue("invalid");

    render(await ResetPasswordPage({ token: ["um", "outro"] }));

    expect(verifyResetTokenAction).toHaveBeenCalledWith("");
  });

  it("renderiza dentro da moldura das telas de acesso", async () => {
    verifyResetTokenAction.mockResolvedValue("valid");

    render(await ResetPasswordPage({ token: "token-do-link" }));

    expect(screen.getByTestId("auth-shell")).toBeInTheDocument();
  });

  it("abre como tela interna, sem a apresentação da marca no celular e no tablet", async () => {
    verifyResetTokenAction.mockResolvedValue("valid");

    render(await ResetPasswordPage({ token: "token-do-link" }));

    expect(screen.getByTestId("inner-screen")).toContainElement(screen.getByTestId("form"));
  });
});
