import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TokenNotice } from "./token-notice";

describe("TokenNotice", () => {
  it("explica o link expirado e oferece pedir outro", () => {
    render(<TokenNotice state="expired" />);

    expect(screen.getByRole("heading", { name: "Este link expirou" })).toBeInTheDocument();
    expect(screen.getByText(/vale por 1 hora/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pedir um novo link" })).toHaveAttribute("href", "/login");
  });

  it("orienta quem já usou o link, inclusive no caso de não reconhecer a alteração", () => {
    render(<TokenNotice state="used" />);

    expect(screen.getByRole("heading", { name: "Este link já foi usado" })).toBeInTheDocument();
    expect(screen.getByText(/se não reconhece essa alteração/)).toBeInTheDocument();
  });

  it("sugere abrir o link direto do e-mail quando ele é inválido", () => {
    render(<TokenNotice state="invalid" />);

    expect(screen.getByRole("heading", { name: "Este link não é válido" })).toBeInTheDocument();
    expect(screen.getByText(/cortado pelo programa de e-mail/)).toBeInTheDocument();
  });

  it("não culpa o link quando a falha foi na verificação", () => {
    render(<TokenNotice state="unavailable" />);

    expect(screen.getByRole("heading", { name: "Não foi possível verificar o link" })).toBeInTheDocument();
    expect(screen.getByText(/ele continua valendo/)).toBeInTheDocument();
  });

  it("dá uma saída em todos os estados", () => {
    for (const state of ["expired", "used", "invalid", "unavailable"] as const) {
      const { unmount } = render(<TokenNotice state={state} />);

      expect(screen.getByRole("link")).toHaveAttribute("href", "/login");

      unmount();
    }
  });
});
