import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  type ColumnDef,
  type ColumnResizeMode,
  type ColumnSizingState,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { GripVertical } from "lucide-react";
import type { CSSProperties } from "react";

export type DataTableProps<TData, TValue = unknown> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Click whole row (checkbox / actions should stopPropagation). */
  onRowClick?: (row: TData) => void;
  getRowClassName?: (row: TData) => string;

  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;

  /** Controlled column sizing (optional — table manages it if omitted). */
  columnSizing?: ColumnSizingState;
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>;

  enableColumnResizing?: boolean;
  /** `"onEnd"` (default) = update widths on mouse-up; `"onChange"` = live. */
  columnResizeMode?: ColumnResizeMode;

  /** Server-side mode (default true for list pages). */
  manualSorting?: boolean;

  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  isFetching?: boolean;
  emptyMessage?: string;
  skeletonRows?: number;

  /** Extra stuff columns can read (e.g. permissions). */
  meta?: Record<string, unknown>;

  className?: string;
};

function getColumnSizeStyle(size: number): CSSProperties {
  return {
    width: size,
    minWidth: size,
    maxWidth: size,
  };
}

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  onRowClick,
  getRowClassName,
  sorting,
  onSortingChange,
  rowSelection = {},
  onRowSelectionChange,
  columnSizing,
  onColumnSizingChange,
  enableColumnResizing = true,
  columnResizeMode = "onEnd",
  manualSorting = true,
  isLoading,
  isError,
  onRetry,
  isFetching,
  emptyMessage = "No records found.",
  skeletonRows = 10,
  meta,
  className,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
      ...(columnSizing != null ? { columnSizing } : {}),
    },
    onSortingChange,
    onRowSelectionChange,

    ...(onColumnSizingChange != null ? { onColumnSizingChange } : {}),
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row, index) => {
      if (typeof row === "object" && row !== null && "id" in row && (row as { id: unknown }).id != null) {
        return String((row as { id: string | number }).id);
      }
      return String(index);
    },
    enableRowSelection: true,
    enableSortingRemoval: false,
    manualSorting,
    enableColumnResizing,
    columnResizeMode,
    defaultColumn: {
      size: 150,
      minSize: 40,
      maxSize: 800,
    },
    meta,
  });

  const deltaOffset = table.getState().columnSizingInfo.deltaOffset ?? 0;

  return (
    <div className={cn("relative w-full", className)}>
      {isFetching && !isLoading && (
        <div className="bg-background/40 absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden">
          <div className="bg-primary h-full w-1/3 animate-pulse" />
        </div>
      )}

      <Table className="table-fixed" style={{ width: table.getTotalSize(), minWidth: "100%" }}>
        <colgroup>
          {table.getVisibleFlatColumns().map((col) => (
            <col key={col.id} style={getColumnSizeStyle(col.getSize())} />
          ))}
        </colgroup>
        <TableHeader className="bg-muted/30 sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                const canResize = header.column.getCanResize();
                const isResizing = header.column.getIsResizing();

                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "text-muted-foreground relative h-9 text-xs font-medium first:pl-4 last:pr-4",
                      header.column.id === "select" && "w-10 first:pl-4",
                      header.column.id === "actions" && "w-28",
                      "overflow-hidden",
                    )}
                    style={getColumnSizeStyle(header.getSize())}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        className={cn("hover:text-foreground flex w-full min-w-0 items-center gap-1 text-left select-none", sorted && "text-foreground")}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span className="truncate">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        <span className="shrink-0 text-[10px] opacity-60">{sorted === "asc" ? "↑" : sorted === "desc" ? "↓" : "⇅"}</span>
                      </button>
                    ) : (
                      <div className="min-w-0 truncate">{flexRender(header.column.columnDef.header, header.getContext())}</div>
                    )}

                    {canResize && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onDoubleClick={() => header.column.resetSize()}
                        onClick={(e) => e.stopPropagation()}
                        className={cn("group/resize absolute top-0 -right-2 z-10 flex h-full w-4 -translate-x-1/2 cursor-col-resize touch-none items-center justify-center select-none")}
                      >
                      

                        {/* Icon + preview line move together as one unit while dragging,
                            so the icon itself tracks the cursor instead of lagging behind
                            a separately-animated line. */}
                        <div className="relative flex h-full items-center justify-center" style={isResizing ? { transform: `translateX(${deltaOffset}px)` } : undefined}>
                          {isResizing && <div className="bg-primary absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2" />}
                          <GripVertical
                            className={cn(
                              "text-muted-foreground/80 dark:text-muted-foreground bg-transparent relative h-3.5 w-3.5 shrink-0 rounded-sm",
                              "group-hover/resize:text-foreground group-hover/resize:opacity-100",
                              isResizing ? "text-primary opacity-100" : "opacity-70",
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                {table.getVisibleFlatColumns().map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn("py-2.5 pr-4 first:pl-4 last:pr-4", column.id === "select" && "w-10 pr-4 first:pl-4", "overflow-hidden")}
                    style={getColumnSizeStyle(column.getSize())}
                  >
                    <Skeleton className="h-4 w-full max-w-48" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-40 text-center">
                <p className="text-destructive text-sm font-medium">Failed to load data</p>
                {onRetry && (
                  <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
                    Try again
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="text-muted-foreground h-40 text-center text-sm">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => onRowClick?.(row.original)}
                className={cn("border-b", onRowClick && "hover:bg-accent/40 cursor-pointer", row.getIsSelected() && "bg-accent/30", getRowClassName?.(row.original))}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn("py-2 pr-4 first:pl-4 last:pr-4", cell.column.id === "select" && "w-10 pr-4 first:pl-4", "overflow-hidden")}
                    style={getColumnSizeStyle(cell.column.getSize())}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
