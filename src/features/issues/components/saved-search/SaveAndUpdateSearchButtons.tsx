import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUpdateSavedSearch } from "../../hooks";
import type { IssuesSearch } from "../../schemas";
import { SavedSearch } from "../../types";
import { hasActiveCriteria, toSavedFilters } from "../../utils/utils";

type SaveAndUpdateSearchButtonsProps = {
  search: IssuesSearch;
  savedSearchId?: string | null;
  activeSavedSearch: SavedSearch | null;
  isDirty: boolean;
  onOpenSaveSearch: () => void;
  isDesktop: boolean;
};

export function SaveAndUpdateSearchButtons({ search, savedSearchId, activeSavedSearch, isDirty, onOpenSaveSearch, isDesktop }: SaveAndUpdateSearchButtonsProps) {
  const updateSavedSearch = useUpdateSavedSearch();

  if (!savedSearchId && hasActiveCriteria(search)) {
    return (
      <Button type="button" variant="link" onClick={onOpenSaveSearch} className="h-fit w-fit px-0 py-0 text-xs font-medium text-pink-600 hover:underline md:py-2">
        Save as new search
      </Button>
    );
  }

  if (savedSearchId && activeSavedSearch && isDirty) {
    return (
      <div className={cn("flex items-center gap-4", isDesktop ? "ml-3" : "col-span-2 ml-0.5 w-full")}>
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
          className="h-fit p-0 text-xs font-medium text-emerald-600 hover:underline md:py-2"
        >
          Update filters
        </Button>
        <Button type="button" variant="link" onClick={onOpenSaveSearch} className="h-fit p-0 text-xs font-medium text-pink-600 hover:underline md:py-2">
          Save as new search
        </Button>
      </div>
    );
  }

  return null;
}
