import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IssuePriority, IssueStatus } from "@/features/issues/types";

const STATUS_STYLES: Record<IssueStatus, string> = {
  Open: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  InProgress: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  Done: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  Blocked: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

const PRIORITY_STYLES: Record<string, string> = {
  "Show-stopper": "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  Critical: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  "S1 - Critical": "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  Major: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  "S2 - Major": "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  Normal: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "S3 - Normal": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  Minor: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  Low: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25",
  "S4 - Low": "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25",
};

const DEFAULT_PRIORITY_STYLE =
  "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30";

export function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[status])}>
      {status === "InProgress" ? "In Progress" : status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: IssuePriority | string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        PRIORITY_STYLES[priority] ?? DEFAULT_PRIORITY_STYLE,
      )}
    >
      {priority}
    </Badge>
  );
}
