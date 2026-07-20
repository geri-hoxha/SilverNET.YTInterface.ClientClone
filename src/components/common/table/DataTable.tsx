import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnResizeMode,
  type ColumnSizingState,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
} from "@tanstack/react-table";
import { GripVertical } from "lucide-react";
import { memo, useMemo, type CSSProperties } from "react";

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
  /**
   * `"onChange"` (default) = widths update live while dragging.
   * `"onEnd"` = widths only commit on mouse-up.
   * Live mode is cheap here because widths are pushed through CSS custom
   * properties (not React state per cell), and the body memoizes itself
   * away entirely while a resize is in progress — see `columnSizeVars`
   * and `MemoizedDataTableBody` below.
   */
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

/**
 * Width is expressed as a CSS var reference, not a literal number, so that
 * during a drag only the var on the <table> element needs to change —
 * React never has to re-render header/body cells just because a column
 * got wider or narrower.
 */
function getColumnVarStyle(columnId: string): CSSProperties {
  return {
    width: `calc(var(--col-${columnId}-size) * 1px)`,
    minWidth: `calc(var(--col-${columnId}-size) * 1px)`,
    maxWidth: `calc(var(--col-${columnId}-size) * 1px)`,
  };
}

type DataTableBodyProps<TData, TValue> = {
  table: TanstackTable<TData>;
  columns: ColumnDef<TData, TValue>[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyMessage: string;
  skeletonRows: number;
  onRowClick?: (row: TData) => void;
  getRowClassName?: (row: TData) => string;
};

function DataTableBodyInner<TData, TValue>({ table, columns, isLoading, isError, onRetry, emptyMessage, skeletonRows, onRowClick, getRowClassName }: DataTableBodyProps<TData, TValue>) {
  return (
    <TableBody>
      {isLoading ? (
        Array.from({ length: skeletonRows }).map((_, i) => (
          <TableRow key={i} className="hover:bg-transparent">
            {table.getVisibleFlatColumns().map((column) => (
              <TableCell key={column.id} className={cn("px-2 py-2.5 first:pl-4 last:pr-4", column.id === "select" && "w-10 px-2 first:pl-4", "overflow-hidden")} style={getColumnVarStyle(column.id)}>
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
                className={cn("px-2 py-2 first:pl-4 last:pr-4", cell.column.id === "select" && "w-10 px-2 first:pl-4", "overflow-hidden")}
                style={getColumnVarStyle(cell.column.id)}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))
      )}
    </TableBody>
  );
}

/**
 * While a column is actively being dragged, we swap in this memoized body.
 * The comparator only checks `table.options.data` (the raw row array
 * reference) rather than doing a deep prop comparison — exactly like
 * TanStack Table's own performant-resize example. Column widths change via
 * CSS vars on the <table>, not via props here, so the body has nothing to
 * re-render for during the drag; it only re-renders again once actual row
 * data changes.
 */
const MemoizedDataTableBody = memo(DataTableBodyInner, (prev, next) => prev.table.options.data === next.table.options.data) as typeof DataTableBodyInner;

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
  columnResizeMode = "onChange",
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
    // IMPORTANT: only pass this when the caller actually supplies a handler.
    // If we always pass `onColumnSizingChange` (even as `undefined`), TanStack
    // Table treats the key as "explicitly controlled" and stops managing
    // columnSizing internally — but since it's undefined, nothing ever
    // actually updates the state, so resizing silently does nothing.
    // Omitting the key entirely lets the table fall back to its own
    // (uncontrolled) internal columnSizing state when no callback is given.
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

  const { deltaOffset, isResizingColumn } = table.getState().columnSizingInfo;

  // In "onEnd" mode the column's real width only commits on mouse-up, so we
  // translate the resize handle by the live pointer delta to preview where
  // it'll land. In "onChange" mode the column's actual width is already
  // updating every pixel (via the CSS vars below), so adding the delta
  // transform on top would double-move the handle — skip it there.
  const showDeltaPreview = !!isResizingColumn && columnResizeMode !== "onChange";

  // CSS custom properties for every column's current width, recomputed only
  // when sizing actually changes. Header/body cells reference these via
  // `calc(var(--col-<id>-size) * 1px)` instead of receiving a literal
  // pixel number as a prop — so a resize only needs to update these vars on
  // the <table> element; it doesn't need to re-render any cell for the
  // browser to repaint the new widths.
  const columnSizeVars = useMemo(() => {
    const sizes: Record<string, number> = {};
    for (const header of table.getFlatHeaders()) {
      sizes[`--col-${header.column.id}-size`] = header.column.getSize();
    }
    return sizes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().columnSizingInfo, table.getState().columnSizing]);

  return (
    <div className={cn("relative w-full", className)}>
      {isFetching && !isLoading && (
        <div className="bg-background/40 absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden">
          <div className="bg-primary h-full w-full animate-pulse" />
        </div>
      )}

      <Table className="table-fixed" style={{ ...columnSizeVars, width: table.getTotalSize(), minWidth: "100%" }}>
        <colgroup>
          {table.getVisibleFlatColumns().map((col) => (
            <col key={col.id} style={getColumnVarStyle(col.id)} />
          ))}
        </colgroup>
        <TableHeader className="bg-zinc-100 dark:bg-muted sticky top-0 z-10">
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
                      "text-muted-foreground relative h-9 px-2 text-xs font-medium first:pl-4 last:pr-4",
                      header.column.id === "select" && "w-10 px-2 first:pl-4",
                      header.column.id === "actions" && "w-28",
                    )}
                    style={getColumnVarStyle(header.column.id)}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        className={cn("hover:text-foreground flex w-full min-w-0 items-center gap-1 overflow-hidden text-left select-none", sorted && "text-foreground")}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span className="truncate">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        <span className="shrink-0 text-[10px] opacity-60">{sorted === "asc" ? "↑" : sorted === "desc" ? "↓" : "⇅"}</span>
                      </button>
                    ) : (
                      <div className="min-w-0 truncate overflow-hidden">{flexRender(header.column.columnDef.header, header.getContext())}</div>
                    )}

                    {canResize && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onDoubleClick={() => header.column.resetSize()}
                        onClick={(e) => e.stopPropagation()}
                        className={cn("group/resize absolute top-0 right-0 z-10 flex h-full w-4 -translate-x-1/2 cursor-col-resize touch-none items-center justify-center select-none")}
                      >
                        {/* Icon + preview line move together as one unit while dragging
                            in "onEnd" mode, so the icon itself tracks the cursor instead
                            of lagging behind a separately-animated line. In "onChange"
                            mode the column itself already moves live, so no extra
                            transform is applied here (see showDeltaPreview above). */}
                        <div className="relative flex h-full items-center justify-center" style={showDeltaPreview && isResizing ? { transform: `translateX(${deltaOffset ?? 0}px)` } : undefined}>
                          {showDeltaPreview && isResizing && <div className="bg-primary absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2" />}
                          <GripVertical
                            className={cn(
                              "text-muted-foreground/50 bg-transparent relative h-3.5 w-3.5 shrink-0 rounded-sm",
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

        {isResizingColumn ? (
          <MemoizedDataTableBody
            table={table}
            columns={columns}
            isLoading={isLoading}
            isError={isError}
            onRetry={onRetry}
            emptyMessage={emptyMessage}
            skeletonRows={skeletonRows}
            onRowClick={onRowClick}
            getRowClassName={getRowClassName}
          />
        ) : (
          <DataTableBodyInner
            table={table}
            columns={columns}
            isLoading={isLoading}
            isError={isError}
            onRetry={onRetry}
            emptyMessage={emptyMessage}
            skeletonRows={skeletonRows}
            onRowClick={onRowClick}
            getRowClassName={getRowClassName}
          />
        )}
      </Table>
    </div>
  );
}
