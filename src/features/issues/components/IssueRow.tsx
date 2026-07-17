import { clientStateTextColor, IssueTypeBadge, PriorityBadge } from "@/components/common/StatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatRelative, formatShortDate } from "@/shared/utils/format";
import { Star } from "lucide-react";
import { ISSUE_GRID } from "../constants/constants";
import type { Issue } from "../types";
import { issueReadableId } from "../utils";
import { ApproveEstimationButton } from "./ApproveEstimationButton";

function projectBadge(issue: Issue) {
  const code = issue.youTrackReadableId?.split("-")[0] ?? issue.projectShortCode ?? (issue.key ? issue.key.split("-")[0] : (issue.projectName?.[0] ?? "?"));
  const letter = code[0]?.toUpperCase() ?? "?";
  const isS = letter === "S";

  return (
    <span className={cn("inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold text-white", isS ? "bg-orange-500" : "bg-emerald-600")} title={code}>
      {letter}
    </span>
  );
}

export function IssueRow({
  issue,
  checked,
  onCheck,
  onOpen,
  onApproveEstimation,
  isApprovingEstimation,
  canApproveEstimation,
}: {
  issue: Issue;
  checked: boolean;
  onCheck: (v: boolean) => void;
  onOpen: () => void;
  onApproveEstimation: () => void;
  isApprovingEstimation: boolean;
  canApproveEstimation: boolean;
}) {
  const priorityLabel = issue.priorityLabel ?? issue.priority;
  const readableId = issueReadableId(issue);

  return (
    <div onClick={onOpen} className={cn(ISSUE_GRID, "hover:bg-accent/40 cursor-pointer border-b px-4 py-2 text-sm", checked && "bg-accent/30")}>
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={checked} onCheckedChange={(v) => onCheck(!!v)} />
      </div>

      <div className="flex items-center gap-1.5 font-mono text-xs">
        {issue.starred ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> : <span className="w-3.5" />}
        <span className="text-foreground truncate" title={readableId}>
          {readableId}
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        {projectBadge(issue)}
        <span className="truncate font-medium">{issue.title}</span>
        {canApproveEstimation && (
          <div onClick={(e) => e.stopPropagation()}>
            <ApproveEstimationButton
              variant="compact"
              clientState={issue.clientState}
              issueTitle={issue.title}
              confirmBeforeApprove
              onApprove={onApproveEstimation}
              isPending={isApprovingEstimation}
            />
          </div>
        )}
      </div>

      <div className="text-muted-foreground hidden min-w-0 truncate md:block" title={issue.projectName}>
        {issue.projectName}
      </div>

      <div className="w-max">
        <PriorityBadge priority={priorityLabel} />
      </div>

      <div className="w-max">{issue.issueType ? <IssueTypeBadge issueType={issue.issueType} /> : <span className="text-muted-foreground">—</span>}</div>

      <div className={cn("hidden truncate md:block", issue.clientState ? clientStateTextColor(issue.clientState) : "text-muted-foreground italic")} title={issue.clientState || "No state"}>
        {issue.clientState || "—"}
      </div>

      <div className="text-muted-foreground hidden truncate md:block" title={issue.estimation || "No estimation"}>
        {issue.estimation || "—"}
      </div>

      <div className="text-muted-foreground hidden truncate text-xs md:block" title={formatShortDate(issue.createdOnUtc)}>
        {formatRelative(issue.createdOnUtc)}
      </div>

      <div className="text-muted-foreground hidden truncate text-xs md:block" title={issue.closedAt ? formatShortDate(issue.closedAt) : undefined}>
        {issue.closedAt ? formatRelative(issue.closedAt) : "—"}
      </div>

      <div className="hidden min-w-0 truncate md:block" onClick={(e) => e.stopPropagation()}>
        {issue.createdByUserFullName ? <div>{issue.createdByUserFullName}</div> : <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}
