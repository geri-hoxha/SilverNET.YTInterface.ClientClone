import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pencil, Star, Trash2 } from "lucide-react";
import { SavedSearch } from "../../types";

type SavedSearchItemProps = {
  search: SavedSearch;
  isActive: boolean;
  onSelect: () => void;
  onToggleDefault: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function SavedSearchItem({ search, isActive, onSelect, onToggleDefault, onEdit, onDelete }: SavedSearchItemProps) {
  return (
    <div className="group hover:bg-primary/10 flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm">
      <button type="button" className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 truncate text-left" onClick={onSelect}>
        {isActive && <span className="bg-primary mr-1 size-1.5 rounded-full"></span>}
        <span className="truncate">{search.name}</span>
      </button>

      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleDefault();
          }}
          aria-label={search.isDefault ? "Unset as default search" : "Set as default search"}
          title={search.isDefault ? "Default search — click to unset" : "Set as default search"}
        >
          <Star className={cn("h-3.5 w-3.5", search.isDefault ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
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
            onDelete();
          }}
          aria-label="Delete saved search"
        >
          <Trash2 className="text-destructive group-hover/delete:text-destructive-foreground h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default SavedSearchItem;
