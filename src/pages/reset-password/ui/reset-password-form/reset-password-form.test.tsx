import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ResetPasswordResult } from "../../api";

const resetPasswordAction = vi.fn<(input: unknown) => Promise<ResetPasswordResult>>();

vi.mock("../../api", () => ({
  resetPasswordAction: (input: unknown) => resetPasswordAction(input),
}));

const { ResetPasswordForm } = await import("./reset-password-form");

const TOKEN = "token-do-link";
const SENHA = "NovaSenha123";

/**
 * `redirect` na action chega ao cliente como rejeicao, depois de o roteador ja
 * ter aplicado a navegacao. E assim que o sucesso se manifesta aqui.
 */
function rejeicaoDeRedirect() {
  return Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/reset-password?status=sucesso;303;",
  });
}

function preencher(senha = SENHA, confirmacao = senha) {
  fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: senha } });
  fireEvent.change(screen.getByLabelText("Confirme a nova senha"), { target: { value: confirmacao } });
}

function enviar() {
  fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));
}

beforeEach(() => {
  resetPasswordAction.mockReset();
});

describe("ResetPasswordForm", () => {
  it("envia token e senha para a action", async () => {
    // O sucesso nao volta: a action termina em `redirect` para a confirmacao.
    // Aqui se verifica o que sai do formulario.
    resetPasswordAction.mockImplementation(() => new Promise<ResetPasswordResult>(() => {}));

    render(<ResetPasswordForm token={TOKEN} />);
    preencher();
    enviar();

    await waitFor(() =>
      expect(resetPasswordAction).toHaveBeenCalledWith({
        token: TOKEN,
        newPassword: SENHA,
        confirmPassword: SENHA,
      }),
    );
  });

  it("avisa que as outras sessões serão encerradas, sem oferecer escolha", () => {
    // A API encerra sempre; caixa marcavel aqui seria controle que nao controla.
    render(<ResetPasswordForm token={TOKEN} />);

    expect(screen.getByText("Você sairá dos outros dispositivos")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("aponta a coincidência das senhas enquanto são digitadas", () => {
    render(<ResetPasswordForm token={TOKEN} />);

    expect(screen.queryByText("As senhas coincidem")).not.toBeInTheDocument();

    preencher(SENHA, "Outra");
    expect(screen.getByText("As senhas não coincidem")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Confirme a nova senha"), { target: { value: SENHA } });
    expect(screen.getByText("As senhas coincidem")).toBeInTheDocument();
    expect(resetPasswordAction).not.toHaveBeenCalled();
  });

  it("leva o foco para o aviso quando o token é recusado no submit", async () => {
    resetPasswordAction.mockResolvedValue({ status: "token-rejected", tokenState: "used" });

    render(<ResetPasswordForm token={TOKEN} />);
    preencher();
    enviar();

    const aviso = await screen.findByRole("heading", { name: "Este link já foi usado" });

    await waitFor(() => expect(aviso.closest("[tabindex='-1']")).toHaveFocus());
  });

  it("mantém a região viva montada antes do primeiro veredito", () => {
    // Regiao inserida no DOM junto com o texto nao e anunciada; montada vazia,
    // o primeiro "coincidem"/"nao coincidem" e falado.
    render(<ResetPasswordForm token={TOKEN} />);

    const vivas = screen.getAllByRole("status");

    expect(vivas.some((regiao) => regiao.textContent === "")).toBe(true);
  });

  it("limita a digitação ao teto aceito pela API", () => {
    render(<ResetPasswordForm token={TOKEN} />);

    expect(screen.getByLabelText("Nova senha")).toHaveAttribute("maxlength", "100");
    expect(screen.getByLabelText("Confirme a nova senha")).toHaveAttribute("maxlength", "100");
  });

  it("marca a confirmação divergente para tecnologia assistiva", () => {
    render(<ResetPasswordForm token={TOKEN} />);
    preencher(SENHA, "Outra");

    expect(screen.getByLabelText("Confirme a nova senha")).toHaveAttribute("aria-invalid", "true");
  });

  it("aponta a confirmação divergente inline, antes de chamar o servidor", async () => {
    render(<ResetPasswordForm token={TOKEN} />);
    preencher(SENHA, "OutraSenha123");
    enviar();

    expect(await screen.findByText("As senhas não coincidem")).toBeInTheDocument();
    expect(resetPasswordAction).not.toHaveBeenCalled();
  });

  it("diz uma vez só que as senhas divergem", async () => {
    // O indicador ao lado do rotulo ja cobre a divergencia; repetir embaixo do
    // campo e o ruido que o `status` foi criado para evitar.
    render(<ResetPasswordForm token={TOKEN} />);
    preencher(SENHA, "OutraSenha123");
    fireEvent.blur(screen.getByLabelText("Confirme a nova senha"));

    await waitFor(() => expect(screen.getAllByText(/As senhas não coincidem/)).toHaveLength(1));
  });

  it("cobre a confirmação em branco, que o indicador não alcança", async () => {
    render(<ResetPasswordForm token={TOKEN} />);
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: SENHA } });
    enviar();

    expect(await screen.findByText("Confirme a nova senha.")).toBeInTheDocument();
    expect(resetPasswordAction).not.toHaveBeenCalled();
  });

  it("não propaga a rejeição do redirect no caminho de sucesso", async () => {
    // Repropagada, a rejeicao vira `unhandledrejection` no navegador.
    resetPasswordAction.mockRejectedValue(rejeicaoDeRedirect());

    const naoTratadas: unknown[] = [];
    const capturar = (event: PromiseRejectionEvent) => naoTratadas.push(event.reason);
    window.addEventListener("unhandledrejection", capturar);

    render(<ResetPasswordForm token={TOKEN} />);
    preencher();
    enviar();

    await waitFor(() => expect(resetPasswordAction).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    window.removeEventListener("unhandledrejection", capturar);

    expect(naoTratadas).toHaveLength(0);
  });

  it("barra senha fora da política antes de chamar o servidor", async () => {
    render(<ResetPasswordForm token={TOKEN} />);
    preencher("senhalonga");
    enviar();

    expect(await screen.findByText(/ao menos uma letra maiúscula/)).toBeInTheDocument();
    expect(resetPasswordAction).not.toHaveBeenCalled();
  });

  it("mostra o medidor de força enquanto a senha é digitada", () => {
    render(<ResetPasswordForm token={TOKEN} />);

    expect(screen.getByText("Use letras maiúsculas, minúsculas e números")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "senhalonga" } });

    // Duas regioes vivas convivem aqui: a nota do medidor e o indicador de
    // coincidencia. A assercao aponta a do medidor pelo texto.
    expect(screen.getByText("razoável")).toBeInTheDocument();
    expect(screen.getByText(/Uma letra maiúscula/)).toHaveTextContent("pendente");
  });

  it("troca o formulário pelo aviso quando o token é recusado no submit", async () => {
    resetPasswordAction.mockResolvedValue({ status: "token-rejected", tokenState: "expired" });

    render(<ResetPasswordForm token={TOKEN} />);
    preencher();
    enviar();

    expect(await screen.findByRole("heading", { name: "Este link expirou" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
  });

  it("mantém o formulário e oferece nova tentativa quando a falha é recuperável", async () => {
    resetPasswordAction.mockResolvedValue({ status: "error", message: "Falha de rede." });

    render(<ResetPasswordForm token={TOKEN} />);
    preencher();
    enviar();

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha de rede.");
    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
  });

  it("desabilita o envio enquanto salva", async () => {
    let liberar: (result: ResetPasswordResult) => void = () => {};
    resetPasswordAction.mockImplementation(
      () =>
        new Promise<ResetPasswordResult>((resolve) => {
          liberar = resolve;
        }),
    );

    render(<ResetPasswordForm token={TOKEN} />);
    preencher();
    enviar();

    // O nome acessivel inclui o rotulo do spinner ("Carregando"), por isso o
    // regex em vez do texto exato.
    const botao = await screen.findByRole("button", { name: /Salvando/ });
    expect(botao).toBeDisabled();
    expect(screen.getByLabelText("Nova senha")).toBeDisabled();

    liberar({ status: "error", message: "Falha de rede." });
    await waitFor(() => expect(screen.getByRole("button", { name: "Salvar nova senha" })).toBeEnabled());
  });

  it("mantém o envio fechado durante a navegação para a confirmação", async () => {
    /*
     * O sucesso sai da action como rejeicao de `redirect`, e o React Hook Form
     * limpa `isSubmitting` ao sair do submit — mas a navegacao continua em
     * curso. Reabrir o botao aqui permitiria um segundo envio do token ja
     * consumido, que o backend recusa com `409`: "Este link ja foi usado"
     * tomaria o lugar da confirmacao.
     */
    resetPasswordAction.mockRejectedValue(rejeicaoDeRedirect());

    render(<ResetPasswordForm token={TOKEN} />);
    preencher();
    enviar();

    await waitFor(() => expect(resetPasswordAction).toHaveBeenCalledOnce());

    // O nome acessivel inclui o rotulo do spinner, por isso o regex.
    const botao = await screen.findByRole("button", { name: /Salvando/ });
    expect(botao).toBeDisabled();

    fireEvent.click(botao);

    expect(resetPasswordAction).toHaveBeenCalledOnce();
    expect(screen.queryByRole("heading", { name: "Este link já foi usado" })).not.toBeInTheDocument();
  });

  it("avisa quando a action nem chega a responder", async () => {
    /*
     * Conexao caida ou deploy no meio da requisicao: nao ha resultado para
     * interpretar. Sem tratar, a rejeicao morre como `unhandledrejection` e a
     * tela fica muda — o botao volta ao normal sem dizer se a senha mudou.
     */
    resetPasswordAction.mockRejectedValue(new Error("Failed to fetch"));

    const naoTratadas: unknown[] = [];
    const capturar = (event: PromiseRejectionEvent) => naoTratadas.push(event.reason);
    window.addEventListener("unhandledrejection", capturar);

    render(<ResetPasswordForm token={TOKEN} />);
    preencher();
    enviar();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível redefinir a senha agora. Tente novamente.",
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    window.removeEventListener("unhandledrejection", capturar);

    expect(naoTratadas).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Salvar nova senha" })).toBeEnabled();
  });
});
