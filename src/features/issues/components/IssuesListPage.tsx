import { TablePaginationToolbar } from "@/components/common/TablePaginationToolbar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PERMISSIONS, useAuth } from "@/features/auth";
import { useProjects } from "@/features/projects/hooks";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import type { OnChangeFn, RowSelectionState, SortingState } from "@tanstack/react-table";
import { CheckSquare, ChevronDown, Download } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { z } from "zod";
import { useApproveEstimation, useIssues, useSavedSearches, useUpdateSavedSearch } from "../hooks";
import { issuesRouteApi } from "../route";
import { issuesSearchSchema } from "../schemas";
import type { IssueSortField } from "../types";
import { filtersMatchSaved, hasActiveCriteria, normalizeSavedCriteria } from "../utils/utils";

import { DataTable } from "@/components/common/table/DataTable";
import { useMediaQuery } from "usehooks-ts";
import { FILTER_RESET } from "../constants/constants";
import { CreateIssueDialog } from "./issue-dialogs/CreateIssueDialog";
import { ExportIssuesDialog } from "./issue-dialogs/ExportIssuesDialog";
import { IssuesFilterBar } from "./IssuesFilterBar";
import { SavedSearchesList } from "./saved-search/SavedSearchesList";
import { SaveSearchDialog, toSavedFilters } from "./saved-search/SaveSearchDialog";
import { getIssueColumns, IssuesTableMeta } from "./table/issues-columns";

type IssuesSearch = z.infer<typeof issuesSearchSchema>;

export function IssuesListPage() {
  const navigate = useNavigate({ from: "/issues/" });
  const search = issuesRouteApi.useSearch();
  const { page, pageSize, savedSearchId, status, projectId, priority, from, to, closedFrom, closedTo, search: searchText, sortBy, sortDescending } = search;

  const [createOpen, setCreateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
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

  const isDesktop = useMediaQuery("(min-width: 768px)");

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

  const columns = useMemo(() => getIssueColumns(isDesktop), [isDesktop]);

  // URL → TanStack sorting state
  const sorting: SortingState = useMemo(() => (sortBy ? [{ id: sortBy, desc: !!sortDescending }] : []), [sortBy, sortDescending]);

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

  // Product rule: new field → asc, same field → toggle.
  // Ignore TanStack's derived desc so first click on a new column is always asc.
  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const first = next[0];
    if (!first) return;

    const field = first.id as IssueSortField;

    navigate({
      search: (p: IssuesSearch) => ({
        ...p,
        page: 1,
        sortBy: field,
        sortDescending: p.sortBy === field ? !p.sortDescending : false,
      }),
    });
  };

  const tableMeta: IssuesTableMeta = {
    canApproveEstimation,
    onApproveEstimation: (id) => approveEstimation.mutate(id),
    isApprovingEstimation: (id) => approveEstimation.isPending && approveEstimation.variables === id,
  };

  return (
    <div className="flex h-full flex-col">
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

      <div className="flex grow flex-col overflow-hidden">
        <div className="min-w-full grow overflow-auto">
          <DataTable
            columns={columns}
            data={items}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            isLoading={query.isLoading}
            isError={query.isError}
            isFetching={query.isFetching}
            onRetry={() => query.refetch()}
            emptyMessage="No issues match your filters."
            skeletonRows={12}
            onRowClick={(issue) =>
              navigate({
                to: "/issues/$id",
                params: { id: issue.id },
              })
            }
            meta={tableMeta}
          />
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
      </div>

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
