import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { TableWrapper, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./table";

describe("Table components", () => {
  it("renderiza a estrutura de tabela corretamente", () => {
    render(
      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coluna 1</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Dado 1</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableWrapper>,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("rowgroup")).toHaveLength(2); // thead and tbody
    expect(screen.getByRole("row", { name: "Coluna 1" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Coluna 1" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Dado 1" })).toBeInTheDocument();
  });

  it("repassa classNames customizados corretamente", () => {
    const { container } = render(
      <TableWrapper className="custom-wrapper">
        <Table className="custom-table">
          <TableHeader className="custom-header">
            <TableRow className="custom-row">
              <TableHead className="custom-head">Head</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="custom-body">
            <TableRow>
              <TableCell className="custom-cell">Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableWrapper>,
    );

    expect(container.querySelector(".custom-wrapper")).toBeInTheDocument();
    expect(container.querySelector(".custom-table")).toBeInTheDocument();
    expect(container.querySelector(".custom-header")).toBeInTheDocument();
    expect(container.querySelector(".custom-body")).toBeInTheDocument();
    expect(container.querySelector(".custom-row")).toBeInTheDocument();
    expect(container.querySelector(".custom-head")).toBeInTheDocument();
    expect(container.querySelector(".custom-cell")).toBeInTheDocument();
  });
});
