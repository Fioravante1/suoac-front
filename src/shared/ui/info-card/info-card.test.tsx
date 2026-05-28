import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { InfoCard } from "./info-card";

describe("InfoCard", () => {
  describe("variante compact (padrão)", () => {
    it("renderiza label e valor de cada item", () => {
      render(
        <InfoCard
          items={[
            { label: "Total:", value: "R$ 75,00" },
            { label: "Pago:", value: "R$ 25,00" },
          ]}
        />,
      );

      expect(screen.getByText("Total:")).toBeInTheDocument();
      expect(screen.getByText("R$ 75,00")).toBeInTheDocument();
      expect(screen.getByText("Pago:")).toBeInTheDocument();
      expect(screen.getByText("R$ 25,00")).toBeInTheDocument();
    });

    it("renderiza footer quando fornecido", () => {
      render(
        <InfoCard items={[{ label: "Status:", value: "Ativo" }]} footer={<span data-testid="footer">rodapé</span>} />,
      );

      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("não renderiza footer quando ausente", () => {
      const { container } = render(<InfoCard items={[{ label: "Status:", value: "Ativo" }]} />);

      expect(container.querySelector("[class*='footer']")).not.toBeInTheDocument();
    });

    it("aceita className customizado", () => {
      const { container } = render(<InfoCard items={[{ label: "A:", value: "1" }]} className="custom" />);

      expect(container.querySelector(".custom")).toBeInTheDocument();
    });

    it("aceita ReactNode como valor", () => {
      render(<InfoCard items={[{ label: "Badge:", value: <strong data-testid="bold">destaque</strong> }]} />);

      expect(screen.getByTestId("bold")).toHaveTextContent("destaque");
    });
  });

  describe("variante grid", () => {
    it("renderiza label, valor e ícone de cada item", () => {
      render(
        <InfoCard
          variant="grid"
          items={[
            {
              label: "Valor",
              value: "R$ 75,00",
              icon: <span data-testid="icon-valor">$</span>,
            },
            { label: "Data", value: "27/05/2026" },
          ]}
        />,
      );

      expect(screen.getByText("Valor")).toBeInTheDocument();
      expect(screen.getByText("R$ 75,00")).toBeInTheDocument();
      expect(screen.getByTestId("icon-valor")).toBeInTheDocument();
      expect(screen.getByText("Data")).toBeInTheDocument();
      expect(screen.getByText("27/05/2026")).toBeInTheDocument();
    });

    it("não renderiza ícone quando ausente no item", () => {
      const { container } = render(<InfoCard variant="grid" items={[{ label: "Sem ícone", value: "Teste" }]} />);

      expect(container.querySelector("[class*='icon']")).not.toBeInTheDocument();
    });

    it("usa container sem background de card", () => {
      const { container } = render(<InfoCard variant="grid" items={[{ label: "A", value: "1" }]} />);

      expect(container.querySelector("[class*='card']")).not.toBeInTheDocument();
      expect(container.querySelector("[class*='container']")).toBeInTheDocument();
    });
  });

  describe("variante list", () => {
    it("renderiza valor e ícone dos itens sem exibir label", () => {
      render(
        <InfoCard
          variant="list"
          items={[
            { label: "date", value: "27/05/2026", icon: <span data-testid="icon-date">cal</span> },
            { label: "departure", value: "Saída: 06:00", icon: <span data-testid="icon-dep">clk</span> },
          ]}
        />,
      );

      expect(screen.getByText("27/05/2026")).toBeInTheDocument();
      expect(screen.getByTestId("icon-date")).toBeInTheDocument();
      expect(screen.getByText("Saída: 06:00")).toBeInTheDocument();
      expect(screen.getByTestId("icon-dep")).toBeInTheDocument();
    });

    it("renderiza header quando fornecido", () => {
      render(
        <InfoCard
          variant="list"
          header={<span data-testid="header">Dia 1</span>}
          items={[{ label: "info", value: "teste" }]}
        />,
      );

      expect(screen.getByTestId("header")).toBeInTheDocument();
    });

    it("renderiza footer com separador visual", () => {
      const { container } = render(
        <InfoCard variant="list" items={[{ label: "info", value: "teste" }]} footer={<button>Ação</button>} />,
      );

      expect(screen.getByRole("button", { name: "Ação" })).toBeInTheDocument();
      expect(container.querySelector("[class*='listFooter']")).toBeInTheDocument();
    });

    it("usa container com background de card", () => {
      const { container } = render(<InfoCard variant="list" items={[{ label: "a", value: "1" }]} />);

      expect(container.querySelector("[class*='card']")).toBeInTheDocument();
    });
  });

  describe("header", () => {
    it("não renderiza header quando ausente", () => {
      const { container } = render(<InfoCard items={[{ label: "A:", value: "1" }]} />);

      expect(container.querySelector("[class*='header']")).not.toBeInTheDocument();
    });
  });

  describe("footerClassName", () => {
    it("aplica classe customizada ao container do footer", () => {
      const { container } = render(
        <InfoCard
          variant="list"
          items={[{ label: "info", value: "teste" }]}
          footer={<button>Ação</button>}
          footerClassName="custom-footer"
        />,
      );

      const footer = container.querySelector("[class*='listFooter']");
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass("custom-footer");
    });
  });
});
