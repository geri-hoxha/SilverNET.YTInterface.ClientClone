import { useNavigate } from "@tanstack/react-router";
import { CheckSquare, ChevronDown, Download, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSIONS, useAuth } from "@/features/auth";
import { useProjects } from "@/features/projects/hooks";
import { cn } from "@/lib/utils";
import { clientStateTextColor, IssueTypeBadge, PriorityBadge } from "@/shared/components/StatusBadge";
import { TablePaginationToolbar } from "@/shared/components/TablePaginationToolbar";
import { formatRelative, formatShortDate } from "@/shared/utils/format";
import { useApproveEstimation, useIssues, useSavedSearches, useUpdateSavedSearch } from "../hooks";
import { issuesRouteApi } from "../route";
import { issuesSearchSchema } from "../schemas";
import type { Issue, IssueSortField, SavedSearchFilters } from "../types";
import { issueReadableId } from "../utils";
import { ApproveEstimationButton } from "./ApproveEstimationButton";
import { CreateIssueDialog } from "./CreateIssueDialog";
import { ExportIssuesDialog } from "./ExportIssuesDialog";
import { IssuesFilterBar } from "./IssuesFilterBar";
import { SavedSearchesList } from "./SavedSearchesList";
import { SaveSearchDialog, toSavedFilters } from "./SaveSearchDialog";

const ISSUE_GRID =
  "grid grid-cols-[36px_72px_minmax(0,1fr)_72px_88px] md:grid-cols-[36px_96px_minmax(220px,1fr)_minmax(150px,0.85fr)_100px_80px_minmax(130px,0.85fr)_88px_112px_112px_minmax(120px,0.75fr)] items-center gap-2";

type IssuesSearch = z.infer<typeof issuesSearchSchema>;

// Same rationale as SavedSearchesList: reset every key before merging saved
// criteria on top of live search state, so absence in the saved criteria
// actually clears the field instead of inheriting whatever was there before.
const FILTER_RESET: Partial<IssuesSearch> = {
  projectId: undefined,
  status: undefined,
  priority: undefined,
  from: undefined,
  to: undefined,
  closedFrom: undefined,
  closedTo: undefined,
  search: undefined,
  sortBy: undefined,
  sortDescending: undefined,
  pageSize: undefined,
};

function hasActiveCriteria(search: IssuesSearch) {
  return Boolean(search.search || search.projectId || search.priority?.length || search.status?.length || search.from || search.to || search.closedFrom || search.closedTo);
}

function filtersMatchSaved(current: IssuesSearch, saved: SavedSearchFilters): boolean {
  const { page: _p, saved: _s, savedSearchId: _ssi, ...c } = current;
  const arrEq = (a?: string[], b?: string[]) => {
    if (!a?.length && !b?.length) return true;
    if ((a?.length ?? 0) !== (b?.length ?? 0)) return false;
    return [...(a ?? [])].sort().join() === [...(b ?? [])].sort().join();
  };
  return (
    c.projectId === saved.projectId &&
    c.search === saved.search &&
    c.from === saved.from &&
    c.to === saved.to &&
    c.closedFrom === saved.closedFrom &&
    c.closedTo === saved.closedTo &&
    c.sortBy === saved.sortBy &&
    c.sortDescending === saved.sortDescending &&
    c.pageSize === saved.pageSize &&
    arrEq(c.status, saved.status) &&
    arrEq(c.priority, saved.priority)
  );
}

export function IssuesListPage() {
  const navigate = useNavigate({ from: "/issues/" });
  const search = issuesRouteApi.useSearch();
  const { page, pageSize, saved, savedSearchId, status, projectId, priority, from, to, closedFrom, closedTo, search: searchText, sortBy, sortDescending } = search;
  const [createOpen, setCreateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [searchesListOpen, setSearchesListOpen] = useState(false);

  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.issuesCreate);
  const canApproveEstimation = hasPermission(PERMISSIONS.issuesEstimationApprove);

  const approveEstimation = useApproveEstimation();
  const updateSavedSearch = useUpdateSavedSearch();
  const projectsQ = useProjects();
  const savedSearches = useSavedSearches();

  const activeSavedSearch = savedSearchId ? (savedSearches.data?.find((s) => s.id === savedSearchId) ?? null) : null;

  const isDirty = activeSavedSearch ? !filtersMatchSaved(search, activeSavedSearch.criteria) : false;

  // Apply the default saved search (if any) exactly once, on initial mount,
  // and only when the URL is otherwise "empty" — no filters, no active saved
  // search, no sort. This intentionally won't fire again after the user
  // clears filters mid-session, and won't override an explicit deep link.
  const appliedDefaultSearchRef = useRef(false);

  useEffect(() => {
    if (appliedDefaultSearchRef.current) return;
    if (!savedSearches.isSuccess) return;
    appliedDefaultSearchRef.current = true;

    const isEmptySearch = !hasActiveCriteria(search) && !savedSearchId && !sortBy;
    if (!isEmptySearch) return;

    const defaultSearch = savedSearches.data.find((s) => s.isDefault);
    if (!defaultSearch) return;

    navigate({
      search: (p: IssuesSearch) => ({
        ...p,
        ...FILTER_RESET,
        ...defaultSearch.criteria,
        page: p.page ?? 1,
        savedSearchId: defaultSearch.id,
      }),
    });
    // Deliberately narrow deps: this should only ever evaluate once, driven
    // by savedSearches finishing its first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedSearches.isSuccess, savedSearches.data]);

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
      search: (p: IssuesSearch) => ({ ...p, page: 1, pageSize: nextPageSize }),
    });

  const setSort = (field: IssueSortField) =>
    navigate({
      search: (p: IssuesSearch) => ({
        ...p,
        page: 1,
        sortBy: field,
        sortDescending: p.sortBy === field ? !p.sortDescending : false,
      }),
    });

  const allChecked = items.length > 0 && items.every((i) => selected[i.id]);
  const toggleAll = (v: boolean) => {
    const next: Record<string, boolean> = {};
    if (v) items.forEach((i) => (next[i.id] = true));
    setSelected(next);
  };

  return (
    <div className="-mx-3 -my-3 flex h-[calc(100vh-3.5rem)] flex-col sm:-mx-6 sm:-my-6">
      {/* Top bar */}
      <div className="bg-background flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <Popover open={searchesListOpen} onOpenChange={setSearchesListOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="text-foreground flex cursor-pointer items-center gap-1 text-base font-semibold hover:opacity-80">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-emerald-500/15 text-emerald-600">
                  <CheckSquare className="h-3.5 w-3.5" />
                </span>
                Issues
                {activeSavedSearch && (
                  <>
                    <span className="text-muted-foreground font-normal"> - </span>
                    <span className="text-muted-foreground mt-0.5 text-xs text-nowrap">{activeSavedSearch.name}</span>
                  </>
                )}
                <ChevronDown className={cn("text-muted-foreground size-3.5 duration-200 ease-in-out", searchesListOpen && "rotate-180")} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="min-w-64 p-2">
              <SavedSearchesList projects={projectsQ.data ?? []} onSelect={() => setSearchesListOpen(false)} />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground text-xs">{total}</span>

          {/* No active saved search + has filters */}
          {!savedSearchId && hasActiveCriteria(search) && (
            <Button type="button" variant="link" onClick={() => setSaveSearchOpen(true)} className="text-xs font-medium text-pink-600 px-0 hover:underline">
              Save as new search
            </Button>
          )}

          {/* Active saved search + dirty */}
          {savedSearchId && activeSavedSearch && isDirty && (
            <div className="flex items-center gap-4 ml-3">
              <Button
                type="button"
                variant="link"
                onClick={() =>
                  updateSavedSearch.mutate({
                    id: activeSavedSearch.id,
                    name: activeSavedSearch.name,
                    criteria: toSavedFilters(search),
                    isDefault: activeSavedSearch.isDefault,
                    successMessage: "Search filters updated",
                  })
                }
                disabled={updateSavedSearch.isPending}
                className="text-xs font-medium text-emerald-600 px-0 hover:underline"
              >
                Update filters
              </Button>
              <Button type="button" variant="link" onClick={() => setSaveSearchOpen(true)} className="text-xs font-medium text-pink-600 px-0 hover:underline">
                Save as new search
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 w-8 bg-emerald-600 text-white hover:bg-emerald-700 md:w-fit" onClick={() => setExportOpen(true)}>
            <Download className="h-3.5 w-3.5" />
            <span className="hidden md:block">Export</span>
          </Button>
          {canCreate && (
            <Button size="sm" className="h-8 bg-blue-600 text-white hover:bg-blue-700" onClick={() => setCreateOpen(true)}>
              New Issue
            </Button>
          )}
        </div>
      </div>

      <IssuesFilterBar search={search} />

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="min-w-full flex-1 overflow-auto">
          <div className={cn(ISSUE_GRID, "bg-muted/30 text-muted-foreground border-b px-4 py-2 text-xs font-medium")}>
            <Checkbox checked={allChecked} onCheckedChange={(v) => toggleAll(!!v)} />
            <SortHead label="ID" field="YouTrackReadableId" sortBy={sortBy} sortDescending={sortDescending} onSort={setSort} />
            <SortHead label="Summary" field="Title" sortBy={sortBy} sortDescending={sortDescending} onSort={setSort} />
            <span className="hidden md:block">
              <SortHead label="Project" field="ProjectName" sortBy={sortBy} sortDescending={sortDescending} onSort={setSort} />
            </span>
            <SortHead label="Priority" field="Priority" sortBy={sortBy} sortDescending={sortDescending} onSort={setSort} />
            <span>Type</span>
            <span className="hidden md:block">
              <SortHead label="State" field="ClientState" sortBy={sortBy} sortDescending={sortDescending} onSort={setSort} />
            </span>
            <span className="hidden md:block">Estimation</span>
            <span className="hidden md:block">
              <SortHead label="Created" field="CreatedOnUtc" sortBy={sortBy} sortDescending={sortDescending} onSort={setSort} />
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
                <Skeleton className="hidden h-4 w-28 md:block" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="hidden h-4 w-20 md:block" />
                <Skeleton className="hidden h-4 w-16 md:block" />
                <Skeleton className="hidden h-4 w-20 md:block" />
                <Skeleton className="hidden h-4 w-20 md:block" />
                <Skeleton className="hidden h-4 w-24 md:block" />
              </div>
            ))
          ) : query.isError ? (
            <div className="px-4 py-16 text-center">
              <p className="text-destructive text-sm font-medium">Failed to load issues</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => query.refetch()}>
                Try again
              </Button>
            </div>
          ) : !items.length ? (
            <div className="text-muted-foreground px-4 py-16 text-center text-sm">No issues match your filters.</div>
          ) : (
            items.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                checked={!!selected[issue.id]}
                onCheck={(v) => setSelected((s) => ({ ...s, [issue.id]: v }))}
                onOpen={() => navigate({ to: "/issues/$id", params: { id: issue.id } })}
                onApproveEstimation={() => approveEstimation.mutate(issue.id)}
                isApprovingEstimation={approveEstimation.isPending && approveEstimation.variables === issue.id}
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
          className="bg-background shrink-0"
        />
      </main>

      <CreateIssueDialog open={createOpen} onOpenChange={setCreateOpen} defaultProjectId={projectId} onCreated={(id) => navigate({ to: "/issues/$id", params: { id } })} />

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

      <SaveSearchDialog
        open={saveSearchOpen}
        onOpenChange={setSaveSearchOpen}
        mode="create"
        currentSearch={search}
        projects={projectsQ.data ?? []}
        onSaved={(id) => navigate({ search: (p) => ({ ...p, savedSearchId: id }) })}
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
    <button type="button" onClick={() => onSort(field)} className={cn("hover:text-foreground flex items-center gap-1 text-left", active && "text-foreground")}>
      {label}
      <span className="text-[10px] opacity-60">{active ? (sortDescending ? "↓" : "↑") : "⇅"}</span>
    </button>
  );
}

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
        {issue.createdByUserFullName ? <div className=" ">{issue.createdByUserFullName}</div> : <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}
