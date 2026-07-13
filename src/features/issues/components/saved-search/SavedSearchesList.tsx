import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useDeleteSavedSearch, useSavedSearches, useSetDefaultSavedSearch } from "../../hooks";
import { issuesRouteApi } from "../../route";
import type { SavedSearch } from "../../types";
import { normalizeSavedCriteria } from "../../utils/utils";
import SavedSearchItem from "./SavedSearchItem";
import { SaveSearchDialog } from "./SaveSearchDialog";

// Reset every known filter key before spreading a saved search's criteria on
// top of the current URL state. Without this, a key that's absent from
// `s.criteria` (because it was empty when that search was saved — JSON drops
// `undefined` keys) silently inherits whatever value the *previous* search
// left behind, instead of clearing it.
const FILTER_RESET = {
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
} as const;

interface Props {
  onSelect: () => void;
  projects: { id: string; name: string }[];
}

export function SavedSearchesList({ onSelect, projects }: Props) {
  const navigate = issuesRouteApi.useNavigate();
  const { savedSearchId } = issuesRouteApi.useSearch();
  const { data: savedSearches = [] } = useSavedSearches();
  const deleteSavedSearch = useDeleteSavedSearch();
  const setDefaultSavedSearch = useSetDefaultSavedSearch();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);

  const pendingSearch = savedSearches.find((s) => s.id === pendingDeleteId);

  if (!savedSearches.length) {
    return <p className="text-muted-foreground px-2 py-3 text-center text-xs">No saved searches yet.</p>;
  }

  return (
    <>
      <div>
        <p className="text-muted-foreground px-2 pt-1 pb-2 text-xs font-medium">Saved searches</p>
        <div className="space-y-0.5">
          {savedSearches.map((search) => (
            <SavedSearchItem
              key={search.id}
              search={search}
              isActive={search.id === savedSearchId}
              onSelect={() => {
                navigate({
                  search: (p) => ({
                    ...p,
                    ...FILTER_RESET,
                    ...normalizeSavedCriteria(search.criteria),
                    page: 1,
                    savedSearchId: search.id,
                  }),
                });
                onSelect();
              }}
              onToggleDefault={() => setDefaultSavedSearch.mutate(search)}
              onEdit={() => setEditingSearch(search)}
              onDelete={() => setPendingDeleteId(search.id)}
            />
          ))}
        </div>
      </div>

      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete saved search?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingSearch ? (
                <>
                  <strong>&ldquo;{pendingSearch.name}&rdquo;</strong> will be permanently deleted.
                </>
              ) : (
                "This saved search will be permanently deleted."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingSearch) {
                  deleteSavedSearch.mutate({
                    id: pendingSearch.id,
                    name: pendingSearch.name,
                  });
                  setPendingDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SaveSearchDialog
        open={!!editingSearch}
        onOpenChange={(open) => !open && setEditingSearch(null)}
        mode="edit"
        editingSearch={editingSearch ?? undefined}
        projects={projects}
        onSaved={() => setEditingSearch(null)}
      />
    </>
  );
}
