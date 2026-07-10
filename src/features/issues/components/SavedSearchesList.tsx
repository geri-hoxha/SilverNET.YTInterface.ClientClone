import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pencil, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDeleteSavedSearch, useSavedSearches, useSetDefaultSavedSearch } from "../hooks";
import { issuesRouteApi } from "../route";
import type { SavedSearch } from "../types";
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
  const { data: savedSearches = [] } = useSavedSearches();
  const deleteSavedSearch = useDeleteSavedSearch();
  const setDefaultSavedSearch = useSetDefaultSavedSearch();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);

  const pendingSearch = savedSearches.find((s) => s.id === pendingDeleteId);

  if (!savedSearches.length) return <p className="text-muted-foreground px-2 py-3 text-center text-xs">No saved searches yet.</p>;

  return (
    <>
      <div>
        <p className="text-muted-foreground px-2 py-1 text-xs font-medium">Saved searches</p>
        {savedSearches.map((s) => (
          <div key={s.id} className="group hover:bg-primary/10 flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm">
            <button
              type="button"
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 truncate text-left"
              onClick={() => {
                navigate({
                  search: (p) => ({ ...p, ...FILTER_RESET, ...s.criteria, page: 1, savedSearchId: s.id }),
                });
                onSelect();
              }}
            >
              <span className="truncate">{s.name}</span>
            </button>

            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setDefaultSavedSearch.mutate(s);
                }}
                aria-label={s.isDefault ? "Unset as default search" : "Set as default search"}
                title={s.isDefault ? "Default search — click to unset" : "Set as default search"}
              >
                <Star className={cn("h-3.5 w-3.5", s.isDefault ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingSearch(s);
                }}
                aria-label="Rename saved search"
              >
                <Pencil className="text-muted-foreground h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="group/delete hover:bg-destructive h-6 w-6 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingDeleteId(s.id);
                }}
                aria-label="Delete saved search"
              >
                <Trash2 className="text-destructive group-hover/delete:text-destructive-foreground h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
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
                  deleteSavedSearch.mutate({ id: pendingSearch.id, name: pendingSearch.name });
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
