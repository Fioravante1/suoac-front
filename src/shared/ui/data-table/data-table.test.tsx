import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { DataTable, type ColumnDef } from "./data-table";

interface TestItem {
  id: string;
  name: string;
  age: number;
}

const items: TestItem[] = [
  { id: "1", name: "Alice", age: 30 },
  { id: "2", name: "Bob", age: 25 },
];

const columns: ColumnDef<TestItem>[] = [
  { id: "name", header: "Nome", cell: (item) => item.name },
  { id: "age", header: "Idade", cell: (item) => item.age },
];

describe("DataTable", () => {
  it("renderiza cabeçalhos e linhas corretamente", () => {
    render(<DataTable columns={columns} data={items} getRowKey={(item) => item.id} />);

    expect(screen.getByRole("columnheader", { name: "Nome" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Idade" })).toBeInTheDocument();

    expect(screen.getByRole("cell", { name: "Alice" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "30" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Bob" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "25" })).toBeInTheDocument();
  });

  it("oculta colunas com visible=false", () => {
    const columnsWithHidden: ColumnDef<TestItem>[] = [
      { id: "name", header: "Nome", cell: (item) => item.name },
      { id: "age", header: "Idade", cell: (item) => item.age, visible: false },
    ];

    render(<DataTable columns={columnsWithHidden} data={items} getRowKey={(item) => item.id} />);

    expect(screen.getByRole("columnheader", { name: "Nome" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Idade" })).not.toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "30" })).not.toBeInTheDocument();
  });

  it("aplica classNames customizados em cabeçalhos e células", () => {
    const columnsWithClasses: ColumnDef<TestItem>[] = [
      {
        id: "name",
        header: "Nome",
        cell: (item) => item.name,
        headerClassName: "custom-header",
        cellClassName: "custom-cell",
      },
    ];

    const { container } = render(
      <DataTable columns={columnsWithClasses} data={[items[0]]} getRowKey={(item) => item.id} />,
    );

    expect(container.querySelector(".custom-header")).toBeInTheDocument();
    expect(container.querySelector(".custom-cell")).toBeInTheDocument();
  });

  it("aplica wrapperClassName no container", () => {
    const { container } = render(
      <DataTable columns={columns} data={items} getRowKey={(item) => item.id} wrapperClassName="my-wrapper" />,
    );

    expect(container.querySelector(".my-wrapper")).toBeInTheDocument();
  });

  it("renderiza tabela vazia quando data está vazio", () => {
    render(<DataTable columns={columns} data={[]} getRowKey={(item) => item.id} />);

    expect(screen.getByRole("columnheader", { name: "Nome" })).toBeInTheDocument();
    expect(screen.queryAllByRole("cell")).toHaveLength(0);
  });

  it("renderiza conteúdo JSX nas células", () => {
    const columnsWithJsx: ColumnDef<TestItem>[] = [
      {
        id: "name",
        header: "Nome",
        cell: (item) => <strong data-testid="bold-name">{item.name}</strong>,
      },
    ];

    render(<DataTable columns={columnsWithJsx} data={[items[0]]} getRowKey={(item) => item.id} />);

    expect(screen.getByTestId("bold-name")).toHaveTextContent("Alice");
  });
});
