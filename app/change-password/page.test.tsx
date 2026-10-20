import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// A tela e duble: aqui se verifica a decisao da rota, nao o conteudo dela, que
// tem os proprios testes no slice.
vi.mock("@/pages/change-password", () => ({
  ChangePasswordPage: () => <p>tela de troca de senha</p>,
}));

import Page from "./page";

describe("rota /change-password", () => {
  it("serve a tela de troca de senha", () => {
    render(<Page />);

    expect(screen.getByText("tela de troca de senha")).toBeInTheDocument();
  });

  it("mantém a tela dentro da contenção de tema", () => {
    /*
     * Tela ainda nao redesenhada: o tema escuro nao pode pinta-la, porque o
     * contraste dela nunca foi verificado. Ver SUC-17, e o SUC-14 que remove a
     * contencao junto com a ultima tela v1.
     */
    render(<Page />);

    // CSS Modules geram a classe com hash, por isso a verificação é por padrão.
    expect(screen.getByText("tela de troca de senha").closest('[class*="scope"]')).not.toBeNull();
  });
});
