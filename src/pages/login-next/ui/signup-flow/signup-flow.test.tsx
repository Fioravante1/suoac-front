import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const submitCircuitSignupAction = vi.hoisted(() => vi.fn());

vi.mock("../../api", () => ({
  submitCircuitSignupAction: (...args: unknown[]) => submitCircuitSignupAction(...args),
}));

import { SignupFlow } from "./signup-flow";

beforeEach(() => {
  // Sucesso por padrão: os testes que não tratam do envio só precisam que ele não falhe.
  submitCircuitSignupAction.mockReset();
  submitCircuitSignupAction.mockResolvedValue({ status: "success", email: "joao@example.com" });
});

// ── Helpers ──────────────────────────────────────────────────────
function renderFlow() {
  const onBack = vi.fn();
  const onSubmitted = vi.fn();
  render(<SignupFlow onBack={onBack} onSubmitted={onSubmitted} />);
  return { onBack, onSubmitted };
}

function type(label: string | RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function clickNext() {
  fireEvent.click(screen.getByRole("button", { name: /^(Continuar|Criar circuito)$/ }));
}

function clickBack() {
  fireEvent.click(screen.getByRole("button", { name: /^Voltar/ }));
}

/** Preenche a etapa 1 com valores que a validação aceita. */
function fillCoordinator() {
  type("Nome completo", "João Silva");
  type("E-mail", "joao@example.com");
  type("Celular (WhatsApp)", "(19) 99999-9999");
  type("Crie uma senha", "Senha123");
}

/** Preenche a etapa 2, aceite dos termos incluído. */
function fillCircuit() {
  type("Circuito", "SP-17");
  type("Cidade", "Campinas");
  type("UF", "SP");
  fireEvent.click(screen.getByLabelText(/Li e aceito os termos/));
}

async function goToCircuitStep() {
  fillCoordinator();
  clickNext();
  await waitFor(() => expect(screen.getByText("Etapa 2 de 3")).toBeInTheDocument());
}

function segments() {
  return screen.getByRole("list", { hidden: true, name: "" }).querySelectorAll("[data-state]");
}

// ── Test Suite ───────────────────────────────────────────────────
describe("SignupFlow", () => {
  describe("navegação entre etapas", () => {
    it("deve começar na etapa 1 de 3", () => {
      renderFlow();

      expect(screen.getByText("Etapa 1 de 3")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Cadastre seu circuito" })).toBeInTheDocument();
    });

    it("deve avançar para a etapa 2 quando a etapa 1 está válida", async () => {
      renderFlow();

      await goToCircuitStep();

      expect(screen.getByRole("heading", { name: "Dados do circuito" })).toBeInTheDocument();
    });

    it("deve avançar até a etapa 3", async () => {
      renderFlow();
      await goToCircuitStep();

      fillCircuit();
      clickNext();

      await waitFor(() => expect(screen.getByText("Etapa 3 de 3")).toBeInTheDocument());
      expect(screen.getByRole("heading", { name: "Congregações do circuito" })).toBeInTheDocument();
    });

    it("não deve pular uma etapa quando o avanço é clicado duas vezes", async () => {
      renderFlow();
      fillCoordinator();
      await waitFor(() => expect(screen.getByLabelText("Crie uma senha")).toHaveValue("Senha123"));

      const next = screen.getByRole("button", { name: "Continuar" });
      fireEvent.click(next);
      fireEvent.click(next);

      // `trigger` é assíncrono: sem trava, os dois cliques leem o mesmo
      // `stepIndex` e avançam duas vezes, levando da etapa 1 para a 3 — com a
      // etapa 2 nunca exibida nem validada, e "Criar circuito" sobre um
      // formulário inválido.
      await waitFor(() => expect(screen.getByText(/Etapa \d de 3/)).toBeInTheDocument());
      expect(screen.getByText(/Etapa \d de 3/).textContent).toBe("Etapa 2 de 3");
    });

    it("deve voltar para a etapa anterior", async () => {
      renderFlow();
      await goToCircuitStep();

      clickBack();

      await waitFor(() => expect(screen.getByText("Etapa 1 de 3")).toBeInTheDocument());
    });

    it("deve sair para o login quando o usuário volta na primeira etapa", () => {
      const { onBack } = renderFlow();

      fireEvent.click(screen.getByRole("button", { name: "Voltar para o login" }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("deve trocar o rótulo do voltar conforme a etapa", async () => {
      renderFlow();

      expect(screen.getByRole("button", { name: "Voltar para o login" })).toBeInTheDocument();

      await goToCircuitStep();

      // Fora da primeira etapa, voltar é navegação interna, não saída.
      expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Voltar para o login" })).not.toBeInTheDocument();
    });
  });

  describe("preservação do que já foi digitado", () => {
    it("deve manter os valores da etapa 1 ao voltar", async () => {
      renderFlow();
      await goToCircuitStep();

      clickBack();
      await waitFor(() => expect(screen.getByText("Etapa 1 de 3")).toBeInTheDocument());

      // É o motivo de as três etapas compartilharem um formulário só: os campos
      // saem de tela, o estado não.
      expect(screen.getByLabelText("Nome completo")).toHaveValue("João Silva");
      expect(screen.getByLabelText("E-mail")).toHaveValue("joao@example.com");
      expect(screen.getByLabelText("Celular (WhatsApp)")).toHaveValue("(19) 99999-9999");
      expect(screen.getByLabelText("Crie uma senha")).toHaveValue("Senha123");
    });

    it("deve manter os valores da etapa 2 ao ir para a 3 e voltar", async () => {
      renderFlow();
      await goToCircuitStep();
      fillCircuit();
      clickNext();
      await waitFor(() => expect(screen.getByText("Etapa 3 de 3")).toBeInTheDocument());

      clickBack();
      await waitFor(() => expect(screen.getByText("Etapa 2 de 3")).toBeInTheDocument());

      expect(screen.getByLabelText("Circuito")).toHaveValue("SP-17");
      expect(screen.getByLabelText("Cidade")).toHaveValue("Campinas");
      expect(screen.getByLabelText("UF")).toHaveValue("SP");
      expect(screen.getByLabelText(/Li e aceito os termos/)).toBeChecked();
    });

    it("deve preservar a etapa 1 mesmo depois de duas idas e voltas", async () => {
      renderFlow();
      await goToCircuitStep();
      clickBack();
      await waitFor(() => expect(screen.getByText("Etapa 1 de 3")).toBeInTheDocument());
      clickNext();
      await waitFor(() => expect(screen.getByText("Etapa 2 de 3")).toBeInTheDocument());
      clickBack();
      await waitFor(() => expect(screen.getByText("Etapa 1 de 3")).toBeInTheDocument());

      expect(screen.getByLabelText("E-mail")).toHaveValue("joao@example.com");
    });
  });

  describe("validação por etapa", () => {
    it("deve validar o e-mail durante a digitação e limpar o erro ao corrigir", async () => {
      renderFlow();
      type("E-mail", "joao@");

      await waitFor(() => expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument());

      type("E-mail", "joao@example.com");
      await waitFor(() => expect(screen.queryByText("Informe um e-mail válido.")).not.toBeInTheDocument());
      expect(screen.getByText("Etapa 1 de 3")).toBeInTheDocument();
      expect(screen.queryByText("Informe o circuito.")).not.toBeInTheDocument();
    });

    it("deve explicar o mínimo de oito caracteres e bloquear o avanço com senha curta", async () => {
      renderFlow();
      fillCoordinator();
      type("Crie uma senha", "Senha1");

      await waitFor(() => expect(screen.getByText("A senha deve conter no mínimo 8 caracteres.")).toBeInTheDocument());
      clickNext();

      await waitFor(() => expect(screen.getByText("Etapa 1 de 3")).toBeInTheDocument());
      expect(screen.getByLabelText("Crie uma senha")).toHaveAttribute("aria-invalid", "true");
    });

    it("não deve avançar com a etapa 1 vazia", async () => {
      renderFlow();

      clickNext();

      await waitFor(() => expect(screen.getByText("Informe seu nome completo.")).toBeInTheDocument());
      expect(screen.getByText("Etapa 1 de 3")).toBeInTheDocument();
    });

    it("deve mostrar o erro do campo inválido e ficar na etapa", async () => {
      renderFlow();
      fillCoordinator();
      type("E-mail", "joao@");

      clickNext();

      await waitFor(() => expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument());
      expect(screen.getByText("Etapa 1 de 3")).toBeInTheDocument();
    });

    it("deve recusar senha que a API recusaria", async () => {
      renderFlow();
      fillCoordinator();
      type("Crie uma senha", "senhasenha");

      clickNext();

      // A política é a mesma do backend, importada de `shared/lib`: senha que
      // passa aqui e é recusada lá faz o usuário levar a negativa depois de
      // preencher tudo (SUC-59).
      await waitFor(() => expect(screen.getByText("Etapa 1 de 3")).toBeInTheDocument());
      expect(screen.getByLabelText("Crie uma senha")).toHaveAttribute("aria-invalid", "true");
    });

    it("não deve avançar da etapa 2 sem o aceite dos termos", async () => {
      renderFlow();
      await goToCircuitStep();
      type("Circuito", "SP-17");
      type("Cidade", "Campinas");
      type("UF", "SP");

      clickNext();

      await waitFor(() => expect(screen.getByText("Aceite os termos para continuar.")).toBeInTheDocument());
      expect(screen.getByText("Etapa 2 de 3")).toBeInTheDocument();
    });

    it("deve recusar circuito acima do limite da compatibilidade", async () => {
      renderFlow();
      await goToCircuitStep();
      fillCircuit();
      type("Circuito", "CIRCUITO-COM-MAIS-DE-20");

      clickNext();

      await waitFor(() => expect(screen.getByText("O circuito pode ter até 20 caracteres.")).toBeInTheDocument());
      expect(screen.getByText("Etapa 2 de 3")).toBeInTheDocument();
    });

    it("não deve validar a etapa seguinte ao avançar", async () => {
      renderFlow();
      fillCoordinator();

      clickNext();

      // Validar o formulário inteiro reprovaria por campos que o usuário ainda
      // não viu, e o avanço nunca aconteceria.
      await waitFor(() => expect(screen.getByText("Etapa 2 de 3")).toBeInTheDocument());
      expect(screen.queryByText("Informe o circuito.")).not.toBeInTheDocument();
    });
  });

  describe("barra de progresso", () => {
    it("deve marcar a etapa atual pela metade e as seguintes vazias", () => {
      renderFlow();

      expect(segments()).toHaveLength(3);
      expect(segments()[0]).toHaveAttribute("data-state", "current");
      expect(segments()[1]).toHaveAttribute("data-state", "empty");
      expect(segments()[2]).toHaveAttribute("data-state", "empty");
    });

    it("deve encher o segmento da etapa concluída", async () => {
      renderFlow();

      await goToCircuitStep();

      expect(segments()[0]).toHaveAttribute("data-state", "filled");
      expect(segments()[1]).toHaveAttribute("data-state", "current");
      expect(segments()[2]).toHaveAttribute("data-state", "empty");
    });
  });

  describe("aviso antes de sair", () => {
    it("não deve avisar quando nada foi preenchido", () => {
      renderFlow();

      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);

      // Sem nada digitado não há o que perder, e o diálogo seria só atrito.
      expect(event.defaultPrevented).toBe(false);
    });

    it("deve avisar quando há cadastro em andamento", async () => {
      renderFlow();
      type("Nome completo", "João Silva");

      await waitFor(() => {
        const event = new Event("beforeunload", { cancelable: true });
        window.dispatchEvent(event);
        // Recarregar perde o preenchimento: não há rascunho no servidor antes
        // da etapa 3 ser concluída.
        expect(event.defaultPrevented).toBe(true);
      });
    });
  });

  describe("rótulo do botão que avança", () => {
    it("deve dizer 'Continuar' nas duas primeiras etapas e 'Criar circuito' na última", async () => {
      renderFlow();

      expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();

      await goToCircuitStep();
      expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();

      fillCircuit();
      clickNext();
      await waitFor(() => expect(screen.getByText("Etapa 3 de 3")).toBeInTheDocument());

      expect(screen.getByRole("button", { name: "Criar circuito" })).toBeInTheDocument();
    });
  });

  describe("etapa 3", () => {
    async function goToCongregationsStep() {
      await goToCircuitStep();
      fillCircuit();
      clickNext();
      await waitFor(() => expect(screen.getByText("Etapa 3 de 3")).toBeInTheDocument());
    }

    it("deve oferecer 'Adicionar as outras depois' só na etapa 3", async () => {
      renderFlow();
      expect(screen.queryByRole("button", { name: "Adicionar as outras depois" })).not.toBeInTheDocument();

      await goToCongregationsStep();

      expect(screen.getByRole("button", { name: "Adicionar as outras depois" })).toBeInTheDocument();
    });

    it("deve exigir a congregação do coordenador mesmo ao escolher 'Adicionar as outras depois'", async () => {
      renderFlow();
      await goToCongregationsStep();

      fireEvent.click(screen.getByRole("button", { name: "Adicionar as outras depois" }));

      await waitFor(() => expect(screen.getByText("Informe o nome da sua congregação.")).toBeInTheDocument());
    });

    it("deve descartar as linhas adicionais ao escolher 'Adicionar as outras depois'", async () => {
      renderFlow();
      await goToCongregationsStep();
      type("Congregação", "Jardim Paulista");
      type("Código", "31245");
      fireEvent.click(screen.getByRole("button", { name: "Adicionar congregação" }));
      type("Congregação 2", "Taquaral");

      fireEvent.click(screen.getByRole("button", { name: "Adicionar as outras depois" }));

      await waitFor(() => expect(screen.queryByLabelText("Congregação 2")).not.toBeInTheDocument());
      expect(screen.getByLabelText("Congregação")).toHaveValue("Jardim Paulista");
    });

    it("deve remover as linhas em branco ao concluir", async () => {
      renderFlow();
      await goToCongregationsStep();
      type("Congregação", "Jardim Paulista");
      type("Código", "31245");
      fireEvent.click(screen.getByRole("button", { name: "Adicionar congregação" }));

      clickNext();

      await waitFor(() => expect(screen.queryByLabelText("Congregação 2")).not.toBeInTheDocument());
    });
  });

  describe("envio", () => {
    async function goToCongregationsStepFilled() {
      await goToCircuitStep();
      fillCircuit();
      clickNext();
      await waitFor(() => expect(screen.getByText("Etapa 3 de 3")).toBeInTheDocument());
      type("Congregação", "Jardim Paulista");
      type("Código", "31245");
    }

    it("deve enviar o formulário inteiro ao concluir a etapa 3 e avisar quem o chamou", async () => {
      submitCircuitSignupAction.mockResolvedValue({ status: "success", email: "joao@example.com" });
      const { onSubmitted } = renderFlow();
      await goToCongregationsStepFilled();

      clickNext();

      await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith("joao@example.com"));
      expect(submitCircuitSignupAction).toHaveBeenCalledTimes(1);
      expect(submitCircuitSignupAction).toHaveBeenCalledWith(
        expect.objectContaining({
          coordinator: expect.objectContaining({ email: "joao@example.com" }),
          circuit: { name: "SP-17", city: "Campinas", state: "SP" },
          congregations: [{ name: "Jardim Paulista", code: "31245" }],
        }),
      );
    });

    it("não deve enviar quando a etapa 3 é inválida", async () => {
      renderFlow();
      await goToCircuitStep();
      fillCircuit();
      clickNext();
      await waitFor(() => expect(screen.getByText("Etapa 3 de 3")).toBeInTheDocument());

      clickNext();

      await waitFor(() => expect(screen.getByText("Informe o nome da sua congregação.")).toBeInTheDocument());
      expect(submitCircuitSignupAction).not.toHaveBeenCalled();
    });

    it("deve enviar só a congregação do coordenador com 'Adicionar as outras depois'", async () => {
      submitCircuitSignupAction.mockResolvedValue({ status: "success", email: "joao@example.com" });
      renderFlow();
      await goToCongregationsStepFilled();
      fireEvent.click(screen.getByRole("button", { name: "Adicionar congregação" }));
      type("Congregação 2", "Taquaral");
      type("Código da congregação 2", "31877");

      fireEvent.click(screen.getByRole("button", { name: "Adicionar as outras depois" }));

      await waitFor(() => expect(submitCircuitSignupAction).toHaveBeenCalledTimes(1));
      expect(submitCircuitSignupAction).toHaveBeenCalledWith(
        expect.objectContaining({ congregations: [{ name: "Jardim Paulista", code: "31245" }] }),
      );
    });

    it("deve voltar à etapa 1 com o erro no e-mail já cadastrado", async () => {
      submitCircuitSignupAction.mockResolvedValue({
        status: "error",
        message: "Alguns dados já estão em uso. Confira os campos destacados.",
        conflicts: [{ field: "coordinator.email", message: "Este e-mail ja esta cadastrado" }],
      });
      const { onSubmitted } = renderFlow();
      await goToCongregationsStepFilled();

      clickNext();

      await waitFor(() => expect(screen.getByText("Etapa 1 de 3")).toBeInTheDocument());
      expect(screen.getByText("Este e-mail ja esta cadastrado")).toBeInTheDocument();
      expect(screen.getByLabelText("E-mail")).toBeInvalid();
      expect(screen.getByText("Alguns dados já estão em uso. Confira os campos destacados.")).toBeInTheDocument();
      expect(onSubmitted).not.toHaveBeenCalled();
    });

    it("deve voltar à etapa 2 com o erro no circuito já em uso e manter o preenchimento", async () => {
      submitCircuitSignupAction.mockResolvedValue({
        status: "error",
        message: "Alguns dados já estão em uso. Confira os campos destacados.",
        conflicts: [{ field: "circuit.name", message: "Este circuito ja esta em uso" }],
      });
      renderFlow();
      await goToCongregationsStepFilled();

      clickNext();

      await waitFor(() => expect(screen.getByText("Etapa 2 de 3")).toBeInTheDocument());
      expect(screen.getByText("Este circuito ja esta em uso")).toBeInTheDocument();
      expect(screen.getByLabelText("Circuito")).toHaveValue("SP-17");
    });

    it("deve ir para a etapa do primeiro erro quando há conflitos em etapas diferentes", async () => {
      submitCircuitSignupAction.mockResolvedValue({
        status: "error",
        message: "Alguns dados já estão em uso. Confira os campos destacados.",
        conflicts: [
          { field: "circuit.name", message: "Este circuito ja esta em uso" },
          { field: "coordinator.email", message: "Este e-mail ja esta cadastrado" },
        ],
      });
      renderFlow();
      await goToCongregationsStepFilled();

      clickNext();

      await waitFor(() => expect(screen.getByText("Etapa 2 de 3")).toBeInTheDocument());
      clickBack();
      await waitFor(() => expect(screen.getByText("Etapa 1 de 3")).toBeInTheDocument());
      expect(screen.getByText("Este e-mail ja esta cadastrado")).toBeInTheDocument();
    });

    it("deve ficar na etapa 3 e apontar a linha do código de congregação em uso", async () => {
      submitCircuitSignupAction.mockResolvedValue({
        status: "error",
        message: "Alguns dados já estão em uso. Confira os campos destacados.",
        conflicts: [{ field: "congregations.1.code", message: "O codigo 31877 ja esta em uso por outra congregacao" }],
      });
      renderFlow();
      await goToCongregationsStepFilled();
      fireEvent.click(screen.getByRole("button", { name: "Adicionar congregação" }));
      type("Congregação 2", "Taquaral");
      type("Código da congregação 2", "31877");

      clickNext();

      await waitFor(() =>
        expect(screen.getByText("O codigo 31877 ja esta em uso por outra congregacao")).toBeInTheDocument(),
      );
      expect(screen.getByText("Etapa 3 de 3")).toBeInTheDocument();
      expect(screen.getByLabelText("Código da congregação 2")).toBeInvalid();
      expect(screen.getByLabelText("Código")).toBeValid();
    });

    it("deve mostrar o erro geral, sem trocar de etapa, quando a falha não aponta campo", async () => {
      submitCircuitSignupAction.mockResolvedValue({
        status: "error",
        message: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
        conflicts: [],
      });
      renderFlow();
      await goToCongregationsStepFilled();

      clickNext();

      await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Muitas tentativas em pouco tempo"));
      expect(screen.getByText("Etapa 3 de 3")).toBeInTheDocument();
      expect(screen.getByLabelText("Congregação")).toHaveValue("Jardim Paulista");
    });

    it("deve permitir reenviar depois de uma falha", async () => {
      submitCircuitSignupAction
        .mockResolvedValueOnce({ status: "error", message: "Não foi possível criar o circuito.", conflicts: [] })
        .mockResolvedValueOnce({ status: "success", email: "joao@example.com" });
      const { onSubmitted } = renderFlow();
      await goToCongregationsStepFilled();

      clickNext();
      await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
      clickNext();

      await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith("joao@example.com"));
    });
  });
});
