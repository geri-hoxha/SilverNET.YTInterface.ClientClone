import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckSquare, ChevronDown, Star } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useIssues } from "../hooks";
import { issuesRouteApi } from "../route";
import { issuesSearchSchema } from "../schemas";
import { issueReadableId } from "../utils";
import { CreateIssueDialog } from "./CreateIssueDialog";
import { PriorityBadge } from "@/shared/components/StatusBadge";
import { TablePaginationToolbar } from "@/shared/components/TablePaginationToolbar";
import { formatRelative, formatShortDate } from "@/shared/utils/format";
import type { Issue } from "../types";

const ISSUE_GRID =
  "grid grid-cols-[36px_96px_minmax(220px,1fr)_minmax(150px,0.85fr)_100px_minmax(130px,0.85fr)_112px] items-center gap-2";

export function IssuesListPage() {
  const navigate = useNavigate({ from: "/issues" });
  const { page, pageSize, status, projectId } = issuesRouteApi.useSearch();
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const query = useIssues({ page, pageSize, status, projectId });
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  const setPage = (nextPage: number) =>
    navigate({
      search: (p: z.infer<typeof issuesSearchSchema>) => ({ ...p, page: nextPage }),
    });

  const setPageSize = (nextPageSize: number) =>
    navigate({
      search: (p: z.infer<typeof issuesSearchSchema>) => ({
        ...p,
        page: 1,
        pageSize: nextPageSize,
      }),
    });

  const allChecked = items.length > 0 && items.every((i) => selected[i.id]);
  const toggleAll = (v: boolean) => {
    const next: Record<string, boolean> = {};
    if (v) items.forEach((i) => (next[i.id] = true));
    setSelected(next);
  };

  return (
    <div className="-mx-6 -my-6 flex h-[calc(100vh-3.5rem)] flex-col">
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
            className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setCreateOpen(true)}
          >
            New Issue
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
              <SortHead label="ID" />
              <SortHead label="Summary" />
              <SortHead label="Project" />
              <SortHead label="Priority" />
              <SortHead label="Client state" />
              <SortHead label="Created" />
            </div>

            {query.isLoading ? (
              Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={cn(ISSUE_GRID, "border-b px-4 py-2.5")}>
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
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
    </div>
  );
}

function SortHead({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-1 text-left hover:text-foreground">
      {label}
      <span className="text-[10px] opacity-60">⇅</span>
    </button>
  );
}

const CLIENT_STATE_STYLE: Record<string, string> = {
  Done: "text-emerald-600",
  "In Progress": "text-amber-600",
  "In Review": "text-violet-600",
  "Needs Clarification": "text-orange-600",
  "Provided Clarification": "text-sky-600",
  "Pending Estimation": "text-amber-600",
  "Awaiting Est. Approval": "text-amber-700",
  "Approved Estimation": "text-emerald-600",
  "Refused Estimation": "text-red-600",
};

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
}: {
  issue: Issue;
  checked: boolean;
  onCheck: (v: boolean) => void;
  onOpen: () => void;
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
      </div>
      <div className="min-w-0 truncate text-muted-foreground" title={issue.projectName}>
        {issue.projectName}
      </div>
    <div className="w-max">
        <PriorityBadge priority={priorityLabel} />
    </div>
      <div
        className={cn(
          "truncate",
          issue.clientState
            ? (CLIENT_STATE_STYLE[issue.clientState] ?? "text-foreground")
            : "text-muted-foreground italic",
        )}
        title={issue.clientState || "No client state"}
      >
        {issue.clientState || "—"}
      </div>
      <div
        className="truncate text-xs text-muted-foreground"
        title={formatShortDate(issue.createdAt)}
      >
        {formatRelative(issue.createdAt)}
      </div>
    </div>
  );
}
