import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSIONS, useAuth } from "@/features/auth";
import { useProjects } from "@/features/projects/hooks";
import { cn } from "@/lib/utils";
import { TablePaginationToolbar } from "@/shared/components/TablePaginationToolbar";
import { useNavigate } from "@tanstack/react-router";
import { CheckSquare, ChevronDown, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { z } from "zod";
import { useApproveEstimation, useIssues, useSavedSearches, useUpdateSavedSearch } from "../hooks";
import { issuesRouteApi } from "../route";
import { issuesSearchSchema } from "../schemas";
import type { IssueSortField } from "../types";
import { filtersMatchSaved, hasActiveCriteria, normalizeSavedCriteria } from "../utils/utils";

import { IssueRow } from "./IssueRow";

import { FILTER_RESET, ISSUE_GRID } from "../constants/constants";
import { CreateIssueDialog } from "./issue-dialogs/CreateIssueDialog";
import { ExportIssuesDialog } from "./issue-dialogs/ExportIssuesDialog";
import { IssuesFilterBar } from "./IssuesFilterBar";
import { SavedSearchesList } from "./saved-search/SavedSearchesList";
import { SaveSearchDialog, toSavedFilters } from "./saved-search/SaveSearchDialog";
import { SortHead } from "./SortHead";

type IssuesSearch = z.infer<typeof issuesSearchSchema>;

export function IssuesListPage() {
  const navigate = useNavigate({ from: "/issues/" });
  const search = issuesRouteApi.useSearch();
  const { page, pageSize, savedSearchId, status, projectId, priority, from, to, closedFrom, closedTo, search: searchText, sortBy, sortDescending } = search;

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
        ...normalizeSavedCriteria(defaultSearch.criteria),
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

          {!savedSearchId && hasActiveCriteria(search) && (
            <Button type="button" variant="link" onClick={() => setSaveSearchOpen(true)} className="px-0 text-xs font-medium text-pink-600 hover:underline">
              Save as new search
            </Button>
          )}

          {savedSearchId && activeSavedSearch && isDirty && (
            <div className="ml-3 flex items-center gap-4">
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
                className="px-0 text-xs font-medium text-emerald-600 hover:underline"
              >
                Update filters
              </Button>
              <Button type="button" variant="link" onClick={() => setSaveSearchOpen(true)} className="px-0 text-xs font-medium text-pink-600 hover:underline">
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
                onOpen={() =>
                  navigate({
                    to: "/issues/$id",
                    params: { id: issue.id },
                  })
                }
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
        onSaved={(id) =>
          navigate({
            search: (p) => ({ ...p, savedSearchId: id }),
          })
        }
      />
    </div>
  );
}
