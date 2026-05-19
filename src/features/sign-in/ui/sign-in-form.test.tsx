import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SignInForm } from "./sign-in-form";

// Mock alert for the test
global.alert = vi.fn();

describe("SignInForm", () => {
  it("renders correctly", () => {
    render(<SignInForm />);
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entrar/i })).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    render(<SignInForm />);
    const button = screen.getByRole("button", { name: /Entrar/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Por favor, insira um e-mail válido/i)).toBeInTheDocument();
      expect(screen.getByText(/A senha deve conter no mínimo 6 caracteres/i)).toBeInTheDocument();
    });
  });

  it("validates email format", async () => {
    render(<SignInForm />);
    const emailInput = screen.getByLabelText(/E-mail/i);
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    const button = screen.getByRole("button", { name: /Entrar/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Por favor, insira um e-mail válido/i)).toBeInTheDocument();
    });
  });
});
