import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { PASSWORD_MAX_LENGTH, PASSWORD_TRUNCATED_MESSAGE } from "@/shared/lib";

import { ChangePasswordForm } from "./change-password-form";

/**
 * `redirect` na action chega ao cliente como rejeicao, depois de o roteador ja
 * ter aplicado a navegacao. E assim que o sucesso se manifesta aqui.
 */
function rejeicaoDeRedirect() {
  return Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/dashboard;303;",
  });
}

vi.mock("../api/change-password-action", () => ({
  changePasswordAction: vi.fn(),
}));

import { changePasswordAction } from "../api/change-password-action";

const changePasswordActionMock = vi.mocked(changePasswordAction);

/** Cumpre a politica inteira: 8+ caracteres, maiuscula, minuscula e numero. */
function fillValidForm() {
  fireEvent.change(screen.getByLabelText("Senha atual"), { target: { value: "80275@Suoac" } });
  fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "NovaSenha@Forte123" } });
  fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "NovaSenha@Forte123" } });
}

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza os três campos e o botão", () => {
    render(<ChangePasswordForm />);

    expect(screen.getByLabelText("Senha atual")).toBeInTheDocument();
    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar nova senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Definir nova senha/i })).toBeInTheDocument();
  });

  it("recusa inline a senha que o servidor recusaria, sem chamar a action", async () => {
    /*
     * O defeito do SUC-59: `senhalongaaaa` cumpre o minimo de caracteres, passava
     * pela validacao do cliente e tomava `400` do servidor — no primeiro acesso
     * de quem entra no sistema, depois de digitar a senha duas vezes.
     */
    render(<ChangePasswordForm />);

    fireEvent.change(screen.getByLabelText("Senha atual"), { target: { value: "80275@Suoac" } });
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "senhalongaaaa" } });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "senhalongaaaa" } });

    fireEvent.click(screen.getByRole("button", { name: /Definir nova senha/i }));

    expect(await screen.findByText(/ao menos uma letra maiúscula/i)).toBeInTheDocument();
    expect(changePasswordActionMock).not.toHaveBeenCalled();
  });

  it("mostra o que falta na senha enquanto ela é digitada", () => {
    render(<ChangePasswordForm />);

    expect(screen.getByText("Use letras maiúsculas, minúsculas, números e símbolos")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "senhalongaaaa" } });

    expect(screen.getByText("razoável")).toBeInTheDocument();
    expect(screen.getByText(/Uma letra maiúscula/)).toHaveTextContent("pendente");
    expect(screen.getByText(/Uma letra minúscula/)).toHaveTextContent("cumprido");
  });

  it("limita a digitação ao teto aceito pela API", () => {
    // Sem o teto, o medidor acenderia as quatro barras numa senha de 100+
    // caracteres que o formulario recusa, dizendo "forte" para o que nao passa.
    render(<ChangePasswordForm />);

    expect(screen.getByLabelText("Senha atual")).toHaveAttribute("maxlength", "100");
    expect(screen.getByLabelText("Nova senha")).toHaveAttribute("maxlength", "100");
    expect(screen.getByLabelText("Confirmar nova senha")).toHaveAttribute("maxlength", "100");
  });

  it("não chama a action e exibe erros ao submeter vazio", async () => {
    render(<ChangePasswordForm />);

    fireEvent.click(screen.getByRole("button", { name: /Definir nova senha/i }));

    await waitFor(() => {
      expect(screen.getByText("Informe sua senha atual.")).toBeInTheDocument();
      expect(screen.getByText(/no mínimo 12 caracteres/i)).toBeInTheDocument();
    });

    expect(changePasswordActionMock).not.toHaveBeenCalled();
  });

  it("valida que a confirmação coincide", async () => {
    render(<ChangePasswordForm />);

    fireEvent.change(screen.getByLabelText("Senha atual"), { target: { value: "80275@Suoac" } });
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "NovaSenha@Forte123" } });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "Diferente123" } });

    fireEvent.click(screen.getByRole("button", { name: /Definir nova senha/i }));

    await waitFor(() => {
      expect(screen.getByText("As senhas não coincidem.")).toBeInTheDocument();
    });

    expect(changePasswordActionMock).not.toHaveBeenCalled();
  });

  it("chama a action com os dados no FormData", async () => {
    changePasswordActionMock.mockResolvedValue({});

    render(<ChangePasswordForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: /Definir nova senha/i }));

    await waitFor(() => {
      expect(changePasswordActionMock).toHaveBeenCalledOnce();
    });

    const [prevState, formData] = changePasswordActionMock.mock.calls[0];
    expect(prevState).toBeUndefined();
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("currentPassword")).toBe("80275@Suoac");
    expect(formData.get("newPassword")).toBe("NovaSenha@Forte123");
    expect(formData.get("confirmPassword")).toBe("NovaSenha@Forte123");
  });

  it("desabilita os campos enquanto a troca de senha está em andamento", async () => {
    let resolveAction: (value: { error?: string }) => void = () => {};
    changePasswordActionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );

    render(<ChangePasswordForm />);
    fillValidForm();

    const currentPassword = screen.getByLabelText("Senha atual");
    const newPassword = screen.getByLabelText("Nova senha");
    const confirmPassword = screen.getByLabelText("Confirmar nova senha");

    fireEvent.click(screen.getByRole("button", { name: /Definir nova senha/i }));

    await waitFor(() => {
      expect(currentPassword).toBeDisabled();
      expect(newPassword).toBeDisabled();
      expect(confirmPassword).toBeDisabled();
    });

    resolveAction({});

    await waitFor(() => {
      expect(currentPassword).not.toBeDisabled();
      expect(newPassword).not.toBeDisabled();
      expect(confirmPassword).not.toBeDisabled();
    });
  });

  it("não propaga a rejeição do redirect no caminho de sucesso", async () => {
    // Repropagada, a rejeicao vira `unhandledrejection` no navegador: invisivel
    // na tela, alarme falso em toda troca de senha bem-sucedida.
    changePasswordActionMock.mockRejectedValue(rejeicaoDeRedirect());

    const naoTratadas: unknown[] = [];
    const capturar = (event: PromiseRejectionEvent) => naoTratadas.push(event.reason);
    window.addEventListener("unhandledrejection", capturar);

    render(<ChangePasswordForm />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /Definir nova senha/i }));

    await waitFor(() => expect(changePasswordActionMock).toHaveBeenCalledOnce());
    await new Promise((resolve) => setTimeout(resolve, 0));
    window.removeEventListener("unhandledrejection", capturar);

    expect(naoTratadas).toHaveLength(0);
  });

  it("mantém o envio fechado durante a navegação para o painel", async () => {
    /*
     * O React Hook Form limpa `isSubmitting` ao sair do submit, mas a navegacao
     * continua em curso. Reabrir o botao permitiria um segundo envio com a
     * senha atual que acabou de deixar de valer: a API responderia `401` e
     * "Senha atual incorreta." apareceria sobre uma troca bem-sucedida.
     */
    changePasswordActionMock.mockRejectedValue(rejeicaoDeRedirect());

    render(<ChangePasswordForm />);
    fillValidForm();

    const botao = screen.getByRole("button", { name: /Definir nova senha/i });
    fireEvent.click(botao);

    await waitFor(() => expect(changePasswordActionMock).toHaveBeenCalledOnce());
    // O botao perde o nome acessivel enquanto carrega — o rotulo cede lugar ao
    // spinner, que nao tem texto —, por isso a referencia guardada antes.
    await waitFor(() => expect(botao).toBeDisabled());

    fireEvent.click(botao);

    expect(changePasswordActionMock).toHaveBeenCalledOnce();
  });

  it("avisa quando a colagem é cortada pelo teto", () => {
    /*
     * Senha de gerenciador maior que o teto entra truncada nos dois campos,
     * coincide com ela mesma e e aceita — e o gerenciador segue guardando a
     * original, que nao entra mais.
     */
    render(<ChangePasswordForm />);

    const novaSenha = screen.getByLabelText("Nova senha");
    fireEvent.paste(novaSenha, { clipboardData: { getData: () => "a".repeat(PASSWORD_MAX_LENGTH + 28) } });
    fireEvent.change(novaSenha, { target: { value: "a".repeat(PASSWORD_MAX_LENGTH) } });

    expect(screen.getByText(PASSWORD_TRUNCATED_MESSAGE)).toBeInTheDocument();
  });

  it("não avisa nada quando a colagem cabe no campo", () => {
    render(<ChangePasswordForm />);

    const novaSenha = screen.getByLabelText("Nova senha");
    fireEvent.paste(novaSenha, { clipboardData: { getData: () => "NovaSenha@123" } });
    fireEvent.change(novaSenha, { target: { value: "NovaSenha@123" } });

    expect(screen.queryByText(PASSWORD_TRUNCATED_MESSAGE)).not.toBeInTheDocument();
  });

  it("mantém o botão com nome acessível enquanto salva", async () => {
    // O rotulo cede lugar a um spinner sem texto: sem nome, quem usa leitor de
    // tela encontra um botao anonimo exatamente enquanto algo acontece.
    changePasswordActionMock.mockImplementation(() => new Promise(() => {}));

    render(<ChangePasswordForm />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /Definir nova senha/i }));

    expect(await screen.findByRole("button", { name: "Salvando a nova senha" })).toBeDisabled();
  });

  it("exibe o erro do servidor em banner quando a action retorna erro genérico", async () => {
    changePasswordActionMock.mockResolvedValue({ error: "Não foi possível alterar a senha. Tente novamente." });

    render(<ChangePasswordForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: /Definir nova senha/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível alterar a senha. Tente novamente.");
    });
  });

  it("associa o erro ao campo quando a action retorna field", async () => {
    changePasswordActionMock.mockResolvedValue({ field: "currentPassword", error: "Senha atual incorreta." });

    render(<ChangePasswordForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: /Definir nova senha/i }));

    await waitFor(() => {
      expect(screen.getByText("Senha atual incorreta.")).toBeInTheDocument();
    });

    // Erro de campo não usa o banner global.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
