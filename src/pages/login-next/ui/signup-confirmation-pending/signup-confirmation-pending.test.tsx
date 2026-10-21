import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SignupConfirmationPending } from "./signup-confirmation-pending";

describe("SignupConfirmationPending", () => {
  it("deve dizer para qual e-mail o código foi enviado", () => {
    render(<SignupConfirmationPending email="joao@example.com" onBackToSignIn={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Confira seu e-mail" })).toBeInTheDocument();
    expect(screen.getByText("joao@example.com")).toBeInTheDocument();
  });

  it("deve voltar para o login", () => {
    const onBackToSignIn = vi.fn();
    render(<SignupConfirmationPending email="joao@example.com" onBackToSignIn={onBackToSignIn} />);

    fireEvent.click(screen.getByRole("button", { name: "Voltar para o login" }));

    expect(onBackToSignIn).toHaveBeenCalledTimes(1);
  });
});
