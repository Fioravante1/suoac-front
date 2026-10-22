"use client";

import { useState } from "react";

import { ForgotPasswordForm } from "../forgot-password-form";
import { SignInForm } from "../sign-in-form";
import { SignupFlow } from "../signup-flow";

type AuthView = "sign-in" | "forgot-password" | "signup";

/** Coordena as telas da Fatia 1 sem espalhar a decisao pela rota ou pelo painel. */
export function AuthFlow() {
  const [view, setView] = useState<AuthView>("sign-in");

  if (view === "forgot-password") {
    return <ForgotPasswordForm onBack={() => setView("sign-in")} />;
  }

  if (view === "signup") {
    return <SignupFlow onBack={() => setView("sign-in")} />;
  }

  return <SignInForm onForgotPassword={() => setView("forgot-password")} onSignUp={() => setView("signup")} />;
}
