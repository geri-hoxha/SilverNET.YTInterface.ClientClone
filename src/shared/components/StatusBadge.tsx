import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IssuePriority, IssueStatus } from "@/features/issues/types";

const STATUS_STYLES: Record<IssueStatus, string> = {
  Open: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  InProgress: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Done: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Blocked: "bg-red-500/10 text-red-600 border-red-500/20",
};

const PRIORITY_STYLES: Record<IssuePriority, string> = {
  Low: "bg-muted text-muted-foreground border-border",
  Normal: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  Major: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  Critical: "bg-red-500/10 text-red-600 border-red-500/20",
};

export function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[status])}>
      {status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: IssuePriority }) {
  return (
    <Badge variant="outline" className={cn("font-medium", PRIORITY_STYLES[priority])}>
      {priority}
    </Badge>
  );
}
