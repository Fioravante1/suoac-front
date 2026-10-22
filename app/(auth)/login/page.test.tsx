import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockRedesignLoginFlag = vi.fn();

// Fabrica sem `importOriginal`: o modulo real importa `server-only`, que lanca
// fora do servidor. O que importa aqui e a decisao da fachada, nao o SDK.
vi.mock("@/shared/feature-flags", () => ({
  redesignLoginFlag: () => mockRedesignLoginFlag(),
}));

// As duas telas sao dubles: a fachada responde por qual delas e servida, e cada
// slice tem os proprios testes.
vi.mock("@/pages/login", () => ({
  LoginPage: () => <p>tela atual</p>,
}));

vi.mock("@/pages/login-next", () => ({
  LoginPage: () => <p>tela redesenhada</p>,
}));

import Page from "./page";

describe("fachada de /login", () => {
  it("serve a tela redesenhada quando a flag está ligada", async () => {
    mockRedesignLoginFlag.mockResolvedValue(true);

    render(await Page());

    expect(screen.getByText("tela redesenhada")).toBeInTheDocument();
    expect(screen.queryByText("tela atual")).not.toBeInTheDocument();
  });

  it("serve a tela atual quando a flag está desligada", async () => {
    mockRedesignLoginFlag.mockResolvedValue(false);

    render(await Page());

    expect(screen.getByText("tela atual")).toBeInTheDocument();
    expect(screen.queryByText("tela redesenhada")).not.toBeInTheDocument();
  });

  it("deixa a tela redesenhada fora da contenção de tema", async () => {
    // É o motivo de o escopo ter saído do layout de `(auth)`: dentro dele, a tela
    // nova ficaria travada no claro e o seletor de tema dela não faria nada.
    mockRedesignLoginFlag.mockResolvedValue(true);

    const { container } = render(await Page());

    expect(container.querySelector('[class*="scope"]')).toBeNull();
  });

  it("mantém a tela atual dentro da contenção de tema", async () => {
    // Enquanto a tela antiga existir, o tema escuro não pode pintá-la: ela nunca
    // teve contraste verificado. Ver SUC-17.
    mockRedesignLoginFlag.mockResolvedValue(false);

    const { container } = render(await Page());

    expect(container.querySelector('[class*="scope"]')).not.toBeNull();
    expect(screen.getByText("tela atual").closest('[class*="scope"]')).not.toBeNull();
  });
});
