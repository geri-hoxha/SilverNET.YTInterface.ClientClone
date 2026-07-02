import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckSquare, ChevronDown, Download, Star } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PERMISSIONS, useAuth } from "@/features/auth";
import { useApproveEstimation, useIssues } from "../hooks";
import { issuesRouteApi } from "../route";
import { issuesSearchSchema } from "../schemas";
import { issueReadableId } from "../utils";
import { ApproveEstimationButton } from "./ApproveEstimationButton";
import { CreateIssueDialog } from "./CreateIssueDialog";
import { ExportIssuesDialog } from "./ExportIssuesDialog";
import { IssuesFilterBar } from "./IssuesFilterBar";
import {
  clientStateTextColor,
  IssueTypeBadge,
  PriorityBadge,
} from "@/shared/components/StatusBadge";
import { TablePaginationToolbar } from "@/shared/components/TablePaginationToolbar";
import { formatRelative, formatShortDate } from "@/shared/utils/format";
import type { Issue, IssueSortField } from "../types";

const ISSUE_GRID =
  "grid grid-cols-[36px_72px_minmax(0,1fr)_72px_88px] md:grid-cols-[36px_96px_minmax(220px,1fr)_minmax(150px,0.85fr)_100px_80px_minmax(130px,0.85fr)_88px_112px_112px_minmax(120px,0.75fr)] items-center gap-2";

type IssuesSearch = z.infer<typeof issuesSearchSchema>;

export function IssuesListPage() {
  const navigate = useNavigate({ from: "/issues" });
  const search = issuesRouteApi.useSearch();
  const {
    page,
    pageSize,
    status,
    projectId,
    priority,
    from,
    to,
    closedFrom,
    closedTo,
    search: searchText,
    sortBy,
    sortDescending,
  } = search;
  const [createOpen, setCreateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.issuesCreate);
  const canApproveEstimation = hasPermission(PERMISSIONS.issuesEstimationApprove);

  const approveEstimation = useApproveEstimation();

  const query = useIssues({
    page,
    pageSize,
    status,
    projectId,
    priority,
    from,
    to,
    closedFrom,
    closedTo,
    search: searchText,
    sortBy,
    sortDescending,
  });
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  const setPage = (nextPage: number) =>
    navigate({
      search: (p: IssuesSearch) => ({ ...p, page: nextPage }),
    });

  const setPageSize = (nextPageSize: number) =>
    navigate({
      search: (p: IssuesSearch) => ({
        ...p,
        page: 1,
        pageSize: nextPageSize,
      }),
    });

  const setSort = (field: IssueSortField) =>
    navigate({
      search: (p: IssuesSearch) => ({
        ...p,
        page: 1,
        sortBy: field,
        sortDescending:
          p.sortBy === field ? !p.sortDescending : false,
      }),
    });

  const allChecked = items.length > 0 && items.every((i) => selected[i.id]);
  const toggleAll = (v: boolean) => {
    const next: Record<string, boolean> = {};
    if (v) items.forEach((i) => (next[i.id] = true));
    setSelected(next);
  };

  return (
    <div className="-mx-3 -my-3 sm:-mx-6 sm:-my-6 flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b bg-background px-5 py-3">
        <div className="flex items-baseline gap-2">
          <h1 className="flex items-center gap-1 text-base font-semibold">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-emerald-500/15 text-emerald-600">
              <CheckSquare className="h-3.5 w-3.5" />
            </span>
            Issues
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </h1>
          <span className="text-xs text-muted-foreground">{total}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setExportOpen(true)}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
          {canCreate && (
            <Button
              size="sm"
              className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setCreateOpen(true)}
            >
              New Issue
            </Button>
          )}
        </div>
      </div>

      <IssuesFilterBar search={search} />

      <main className="flex flex-1 flex-col overflow-hidden">
          <div className="min-w-full flex-1 overflow-auto">
            <div
              className={cn(
                ISSUE_GRID,
                "border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground",
              )}
            >
              <Checkbox
                checked={allChecked}
                onCheckedChange={(v) => toggleAll(!!v)}
              />
              <SortHead
                label="ID"
                field="YouTrackReadableId"
                sortBy={sortBy}
                sortDescending={sortDescending}
                onSort={setSort}
              />
              <SortHead
                label="Summary"
                field="Title"
                sortBy={sortBy}
                sortDescending={sortDescending}
                onSort={setSort}
              />
              <span className="hidden md:block">
                <SortHead
                  label="Project"
                  field="ProjectName"
                  sortBy={sortBy}
                  sortDescending={sortDescending}
                  onSort={setSort}
                />
              </span>
              <SortHead
                label="Priority"
                field="Priority"
                sortBy={sortBy}
                sortDescending={sortDescending}
                onSort={setSort}
              />
              <span>Type</span>
              <span className="hidden md:block">
                <SortHead
                  label="State"
                  field="ClientState"
                  sortBy={sortBy}
                  sortDescending={sortDescending}
                  onSort={setSort}
                />
              </span>
              <span className="hidden md:block">Estimation</span>
              <span className="hidden md:block">
                <SortHead
                  label="Created"
                  field="CreatedOnUtc"
                  sortBy={sortBy}
                  sortDescending={sortDescending}
                  onSort={setSort}
                />
              </span>
              <span className="hidden md:block">Closed</span>
              <span className="hidden md:block">Created by</span>
            </div>

            {query.isLoading ? (
              Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={cn(ISSUE_GRID, "border-b px-4 py-2.5")}>
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="hidden md:block h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="hidden md:block h-4 w-20" />
                  <Skeleton className="hidden md:block h-4 w-16" />
                  <Skeleton className="hidden md:block h-4 w-20" />
                  <Skeleton className="hidden md:block h-4 w-20" />
                  <Skeleton className="hidden md:block h-4 w-24" />
                </div>
              ))
            ) : query.isError ? (
              <div className="px-4 py-16 text-center">
                <p className="text-sm font-medium text-destructive">
                  Failed to load issues
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => query.refetch()}
                >
                  Try again
                </Button>
              </div>
            ) : !items.length ? (
              <div className="px-4 py-16 text-center text-sm text-muted-foreground">
                No issues match your filters.
              </div>
            ) : (
              items.map((issue) => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  checked={!!selected[issue.id]}
                  onCheck={(v) =>
                    setSelected((s) => ({ ...s, [issue.id]: v }))
                  }
                  onOpen={() =>
                    navigate({ to: "/issues/$id", params: { id: issue.id } })
                  }
                  onApproveEstimation={() =>
                    approveEstimation.mutate(issue.id)
                  }
                  isApprovingEstimation={
                    approveEstimation.isPending &&
                    approveEstimation.variables === issue.id
                  }
                  canApproveEstimation={canApproveEstimation}
                />
              ))
            )}
          </div>
          <TablePaginationToolbar
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[25, 50, 100]}
            className="shrink-0 bg-background"
          />
      </main>

      <CreateIssueDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultProjectId={projectId}
        onCreated={(id) => navigate({ to: "/issues/$id", params: { id } })}
      />

      <ExportIssuesDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        filters={{
          projectId,
          status,
          priority,
          from,
          to,
          closedFrom,
          closedTo,
          search: searchText,
          sortBy,
          sortDescending,
        }}
      />
    </div>
  );
}

function SortHead({
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
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1 text-left hover:text-foreground",
        active && "text-foreground",
      )}
    >
      {label}
      <span className="text-[10px] opacity-60">
        {active ? (sortDescending ? "↓" : "↑") : "⇅"}
      </span>
    </button>
  );
}

function projectBadge(issue: Issue) {
  const code =
    issue.youTrackReadableId?.split("-")[0] ??
    issue.projectShortCode ??
    (issue.key ? issue.key.split("-")[0] : issue.projectName?.[0] ?? "?");
  const letter = code[0]?.toUpperCase() ?? "?";
  const isS = letter === "S";
  return (
    <span
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold text-white",
        isS ? "bg-orange-500" : "bg-emerald-600",
      )}
      title={code}
    >
      {letter}
    </span>
  );
}

function IssueRow({
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
    <div
      onClick={onOpen}
      className={cn(
        ISSUE_GRID,
        "border-b px-4 py-2 text-sm cursor-pointer hover:bg-accent/40",
        checked && "bg-accent/30",
      )}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={checked} onCheckedChange={(v) => onCheck(!!v)} />
      </div>
      <div className="flex items-center gap-1.5 font-mono text-xs">
        {issue.starred ? (
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        ) : (
          <span className="w-3.5" />
        )}
        <span className="truncate text-foreground" title={readableId}>
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
      <div className="min-w-0 truncate text-muted-foreground hidden md:block" title={issue.projectName}>
        {issue.projectName}
      </div>
      <div className="w-max">
        <PriorityBadge priority={priorityLabel} />
      </div>
      <div className="w-max">
        {issue.issueType ? (
          <IssueTypeBadge issueType={issue.issueType} />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
      <div
        className={cn(
          "hidden md:block truncate",
          issue.clientState
            ? clientStateTextColor(issue.clientState)
            : "text-muted-foreground italic",
        )}
        title={issue.clientState || "No state"}
      >
        {issue.clientState || "—"}
      </div>
      <div
        className="hidden md:block truncate text-muted-foreground"
        title={issue.estimation || "No estimation"}
      >
        {issue.estimation || "—"}
      </div>
      <div
        className="hidden md:block truncate text-xs text-muted-foreground"
        title={formatShortDate(issue.createdOnUtc)}
      >
        {formatRelative(issue.createdOnUtc)}
      </div>
      <div
        className="hidden md:block truncate text-xs text-muted-foreground"
        title={issue.closedAt ? formatShortDate(issue.closedAt) : undefined}
      >
        {issue.closedAt ? formatRelative(issue.closedAt) : "—"}
      </div>
      <div
        className="hidden md:block min-w-0 truncate"
        onClick={(e) => e.stopPropagation()}
      >
        {issue.createdByUserFullName ? (
          <div
            className=" "
          >
            {issue.createdByUserFullName}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}
