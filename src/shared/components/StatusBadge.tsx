import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IssuePriority, IssueStatus } from "@/features/issues/types";

const STATUS_STYLES: Record<IssueStatus, string> = {
  Open: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  InProgress: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Done: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Blocked: "bg-red-500/10 text-red-600 border-red-500/20",
};

const PRIORITY_STYLES: Record<string, string> = {
  "Show-stopper": "bg-red-700 text-white border-red-700",
  Critical: "bg-red-600 text-white border-red-600",
  "S1 - Critical": "bg-red-600 text-white border-red-600",
  Major: "bg-orange-500 text-white border-orange-500",
  "S2 - Major": "bg-orange-500 text-white border-orange-500",
  Normal: "bg-sky-500 text-white border-sky-500",
  "S3 - Normal": "bg-sky-500 text-white border-sky-500",
  Minor: "bg-slate-500 text-white border-slate-500",
  Low: "bg-slate-400 text-white border-slate-400",
  "S4 - Low": "bg-slate-400 text-white border-slate-400",
};

const DEFAULT_PRIORITY_STYLE =
  "bg-violet-500 text-white border-violet-500";

export function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[status])}>
      {status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: IssuePriority | string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold shadow-sm",
        PRIORITY_STYLES[priority] ?? DEFAULT_PRIORITY_STYLE,
      )}
    >
      {priority}
    </Badge>
  );
}
