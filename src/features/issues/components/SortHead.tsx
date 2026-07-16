import { cn } from "@/lib/utils";
import type { IssueSortField } from "../types";

export function SortHead({
  label,
  field,
  sortBy,
  sortDescending,
  onSort,
}: {
  label: string;
  field: IssueSortField;
  sortBy?: IssueSortField;
  sortDescending?: boolean;
  onSort: (field: IssueSortField) => void;
}) {
  const active = sortBy === field;

  return (
    <button type="button" onClick={() => onSort(field)} className={cn("hover:text-foreground flex items-center gap-1 text-left", active && "text-foreground")}>
      {label}
      <span className="text-[10px] opacity-60">{active ? (sortDescending ? "↓" : "↑") : "⇅"}</span>
    </button>
  );
}
