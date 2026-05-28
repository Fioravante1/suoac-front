import type { ReactNode } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrapper } from "@/shared/ui/table";

export interface ColumnDef<T> {
  id: string;
  header: ReactNode;
  cell: (item: T) => ReactNode;
  visible?: boolean;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  getRowKey: (item: T) => string;
  wrapperClassName?: string;
}

export function DataTable<T>({ columns, data, getRowKey, wrapperClassName }: DataTableProps<T>) {
  const visibleColumns = columns.filter((col) => col.visible !== false);

  return (
    <TableWrapper className={wrapperClassName}>
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((col) => (
              <TableHead key={col.id} className={col.headerClassName}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={getRowKey(item)}>
              {visibleColumns.map((col) => (
                <TableCell key={col.id} className={col.cellClassName}>
                  {col.cell(item)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableWrapper>
  );
}
