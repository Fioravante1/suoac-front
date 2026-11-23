import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VisuallyHidden } from "./visually-hidden";

describe("VisuallyHidden", () => {
  it("mantém o texto no documento, para o leitor de tela", () => {
    render(
      <button type="button">
        Etapa
        <VisuallyHidden> (concluída)</VisuallyHidden>
      </button>,
    );

    expect(screen.getByRole("button")).toHaveTextContent(/^Etapa \(concluída\)$/);
  });
});
