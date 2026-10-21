"use client";

import { useState } from "react";

import { ForgotPasswordForm } from "../forgot-password-form";
import { SignInForm } from "../sign-in-form";
import { SignupConfirmationPending } from "../signup-confirmation-pending";
import { SignupFlow } from "../signup-flow";

type AuthView = "sign-in" | "forgot-password" | "signup" | "signup-confirmation";

/** Coordena as telas da Fatia 1 sem espalhar a decisao pela rota ou pelo painel. */
export function AuthFlow() {
  const [view, setView] = useState<AuthView>("sign-in");
  // E-mail do autocadastro enviado: a confirmação por código precisa dele.
  const [signupEmail, setSignupEmail] = useState("");

  function handleSignupSubmitted(email: string) {
    setSignupEmail(email);
    setView("signup-confirmation");
  }

  if (view === "forgot-password") {
    return <ForgotPasswordForm onBack={() => setView("sign-in")} />;
  }

  if (view === "signup") {
    return <SignupFlow onBack={() => setView("sign-in")} onSubmitted={handleSignupSubmitted} />;
  }

  if (view === "signup-confirmation") {
    return <SignupConfirmationPending email={signupEmail} onBackToSignIn={() => setView("sign-in")} />;
  }

  return <SignInForm onForgotPassword={() => setView("forgot-password")} onSignUp={() => setView("signup")} />;
}
