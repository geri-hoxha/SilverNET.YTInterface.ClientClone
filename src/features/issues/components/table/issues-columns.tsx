import { clientStateTextColor, IssueTypeBadge, PriorityBadge } from "@/components/common/StatusBadge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { formatRelative, formatShortDate } from "@/shared/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import type { Issue } from "../../types";
import { issueReadableId } from "../../utils";
import { ApproveEstimationButton } from "../ApproveEstimationButton";

export type IssuesTableMeta = {
  canApproveEstimation: boolean;
  onApproveEstimation: (id: string) => void;
  isApprovingEstimation: (id: string) => boolean;
};

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

export function getIssueColumns(isDesktop: boolean): ColumnDef<Issue>[] {
  return [
    {
      id: "YouTrackReadableId",
      accessorFn: (row) => issueReadableId(row),
      enableSorting: true,
      size: 70,
      enableResizing: false,
      header: "ID",
      cell: ({ row }) => {
        const readableId = issueReadableId(row.original);
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-foreground truncate" title={readableId}>
              {readableId}
            </span>
          </div>
        );
      },
    },
    {
      id: "Title",
      accessorKey: "title",
      enableSorting: true,
      size: 280,
      minSize: 120,
      maxSize: 600,
      header: "Summary",
      cell: ({ row }) => {
        const title = row.original.title;

        return (
          <HoverCard openDelay={200} closeDelay={0}>
            <HoverCardTrigger asChild>
              <div className="group flex min-w-0 items-center gap-1.5">
                {projectBadge(row.original)}
                <span className="min-w-0 flex-1 truncate font-medium">{title}</span>
              </div>
            </HoverCardTrigger>
            <HoverCardContent align={isDesktop ? "start" : "center"} className="border-primary/10 bg-muted w-fit max-w-70 md:max-w-md xl:max-w-fit p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm leading-relaxed font-medium text-wrap xl:text-nowrap">{title}</p>
            </HoverCardContent>
          </HoverCard>
        );
      },
    },
    {
      id: "ProjectName",
      accessorKey: "projectName",
      enableSorting: true,
      header: "Project",
      cell: ({ row }) => (
        <div className="text-muted-foreground min-w-0 truncate" title={row.original.projectName}>
          {row.original.projectName}
        </div>
      ),
    },
    {
      id: "Priority",
      accessorFn: (row) => row.priorityLabel ?? row.priority,
      enableSorting: true,
      header: "Priority",
      cell: ({ row }) => <PriorityBadge priority={row.original.priorityLabel ?? row.original.priority} />,
    },
    {
      id: "issueType",
      accessorKey: "issueType",
      enableSorting: false,
      size: 80,
      header: "Type",
      cell: ({ row }) => (row.original.issueType ? <IssueTypeBadge issueType={row.original.issueType} /> : <span className="text-muted-foreground">—</span>),
    },
    {
      id: "ClientState",
      accessorKey: "clientState",
      enableSorting: true,
      header: "State",
      cell: ({ row }) => {
        const state = row.original.clientState;
        return (
          <div className={cn("truncate", state ? clientStateTextColor(state) : "text-muted-foreground italic")} title={state || "No state"}>
            {state || "—"}
          </div>
        );
      },
    },
    {
      id: "estimation",
      accessorKey: "estimation",
      enableSorting: false,
      size: 88,
      header: "Estimation",
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate" title={row.original.estimation || "No estimation"}>
          {row.original.estimation || "—"}
        </div>
      ),
    },
    {
      id: "CreatedOnUtc",
      accessorKey: "createdOnUtc",
      enableSorting: true,
      size: 112,
      header: "Created",
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate text-xs" title={formatShortDate(row.original.createdOnUtc)}>
          {formatRelative(row.original.createdOnUtc)}
        </div>
      ),
    },
    {
      id: "closedAt",
      accessorKey: "closedAt",
      enableSorting: false,
      size: 112,
      header: "Closed",
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate text-xs" title={row.original.closedAt ? formatShortDate(row.original.closedAt) : undefined}>
          {row.original.closedAt ? formatRelative(row.original.closedAt) : "—"}
        </div>
      ),
    },
    {
      id: "createdBy",
      accessorKey: "createdByUserFullName",
      enableSorting: false,
      header: "Created by",
      cell: ({ row }) => <div className="min-w-0 truncate">{row.original.createdByUserFullName || <span className="text-muted-foreground">—</span>}</div>,
    },
    {
      id: "actions",
      enableSorting: false,
      enableResizing: false,
      size: 80,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row, table }) => {
        const meta = table.options.meta as IssuesTableMeta | undefined;
        if (!meta?.canApproveEstimation) return null;

        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <ApproveEstimationButton
              variant="compact"
              clientState={row.original.clientState}
              issueTitle={row.original.title}
              confirmBeforeApprove
              onApprove={() => meta.onApproveEstimation(row.original.id)}
              isPending={meta.isApprovingEstimation(row.original.id)}
            />
          </div>
        );
      },
    },
  ];
}
