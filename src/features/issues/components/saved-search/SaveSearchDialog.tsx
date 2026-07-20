import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { useCreateSavedSearch, useUpdateSavedSearch } from "../../hooks";
import type { IssuesSearch } from "../../schemas";
import type { SavedSearch, SavedSearchFilters } from "../../types";

interface FilterBadge {
  key: string;
  label: string;
  value: string;
}

import { useMediaQuery } from "usehooks-ts";
import type { IssueSortField } from "../../types";

const SORT_FIELD_LABELS: Record<IssueSortField, string> = {
  YouTrackReadableId: "ID",
  Title: "Summary",
  ProjectName: "Project",
  Priority: "Priority",
  ClientState: "State",
  CreatedOnUtc: "Created date",
};

function buildFilterBadges(filters: SavedSearchFilters, projects: { id: string; name: string }[]): FilterBadge[] {
  const badges: FilterBadge[] = [];

  if (filters.search) {
    badges.push({ key: "search", label: "Text", value: `"${filters.search}"` });
  }
  if (filters.projectId) {
    const project = projects.find((p) => p.id === filters.projectId);
    badges.push({
      key: "project",
      label: "Project",
      value: project?.name ?? filters.projectId,
    });
  }
  if (filters.priority?.length) {
    badges.push({
      key: "priority",
      label: "Priority",
      value: filters.priority.join(", "),
    });
  }
  if (filters.status?.length) {
    badges.push({
      key: "status",
      label: "Status",
      value: filters.status.join(", "),
    });
  }
  if (filters.from || filters.to) {
    const from = filters.from ? new Date(filters.from).toLocaleDateString() : "…";
    const to = filters.to ? new Date(filters.to).toLocaleDateString() : "…";
    badges.push({ key: "created", label: "Created", value: `${from} – ${to}` });
  }
  if (filters.closedFrom || filters.closedTo) {
    const from = filters.closedFrom ? new Date(filters.closedFrom).toLocaleDateString() : "…";
    const to = filters.closedTo ? new Date(filters.closedTo).toLocaleDateString() : "…";
    badges.push({ key: "closed", label: "Closed", value: `${from} – ${to}` });
  }
  if (filters.sortBy) {
    const fieldLabel = SORT_FIELD_LABELS[filters.sortBy] ?? filters.sortBy;
    badges.push({
      key: "sort",
      label: "Sort",
      value: `${fieldLabel} (${filters.sortDescending ? "desc" : "asc"})`,
    });
  }

  return badges;
}

export function toSavedFilters(search: IssuesSearch): SavedSearchFilters {
  const { page, saved, savedSearchId, ...filters } = search;
  return filters;
}

interface FormContentProps {
  name: string;
  setName: (v: string) => void;
  isDefault: boolean;
  setIsDefault: (v: boolean) => void;
  badges: FilterBadge[];
  mode: "create" | "edit";
  isPending: boolean;
  onSave: () => void;
  onCancel: () => void;
}

function SaveSearchFormContent({ name, setName, isDefault, setIsDefault, badges, onSave }: FormContentProps) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="saved-search-name">Name</Label>
        <Input
          id="saved-search-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My open bugs"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
          }}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
        <Label htmlFor="saved-search-is-default" className="cursor-pointer text-sm font-normal">
          Set as default
        </Label>
        <Switch id="saved-search-is-default" checked={isDefault} onCheckedChange={setIsDefault} />
      </div>

      <div className="space-y-1.5">
        <Label>Filters</Label>
        {badges.length ? (
          <div className="flex flex-wrap gap-1.5 rounded-md border px-2.5 py-2">
            {badges.map((b) => (
              <span key={b.key} className="bg-muted inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs">
                <span className="text-muted-foreground">{b.label}:</span>
                <span className="font-medium text-blue-600">{b.value}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">No filters applied.</p>
        )}
      </div>
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: { id: string; name: string }[];
  onSaved?: (id: string) => void;
  mode?: "create" | "edit";
  currentSearch?: IssuesSearch;
  editingSearch?: SavedSearch;
}

export function SaveSearchDialog({ open, onOpenChange, currentSearch, editingSearch, projects, onSaved, mode = "create" }: Props) {
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const createSavedSearch = useCreateSavedSearch();
  const updateSavedSearch = useUpdateSavedSearch();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (!open) return;
    setName(mode === "edit" ? (editingSearch?.name ?? "") : "");
    setIsDefault(mode === "edit" ? (editingSearch?.isDefault ?? false) : false);
  }, [open, mode, editingSearch]);

  const filtersForBadges: SavedSearchFilters = mode === "edit" ? (editingSearch?.criteria ?? ({} as SavedSearchFilters)) : currentSearch ? toSavedFilters(currentSearch) : ({} as SavedSearchFilters);

  const badges = buildFilterBadges(filtersForBadges, projects);
  const isPending = createSavedSearch.isPending || updateSavedSearch.isPending;
  const title = mode === "edit" ? "Rename saved search" : "New saved search";

  // Only name and isDefault are editable in this dialog — criteria comes
  // along for the ride unchanged. So "dirty" just means either of those two
  // fields differs from what's on the record already.
  const isDirty = mode === "create" || !editingSearch || name.trim() !== editingSearch.name || isDefault !== editingSearch.isDefault;

  const canSave = Boolean(name.trim()) && isDirty && !isPending;

  const handleSave = () => {
    if (!canSave) return;

    if (mode === "edit") {
      if (!editingSearch) return;
      updateSavedSearch.mutate(
        {
          id: editingSearch.id,
          name: name.trim(),
          criteria: editingSearch.criteria,
          isDefault,
          successMessage: "Search has been renamed successfully!",
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            onSaved?.(editingSearch.id);
          },
        },
      );
      return;
    }

    if (!currentSearch) return;
    createSavedSearch.mutate(
      { name: name.trim(), criteria: toSavedFilters(currentSearch), isDefault },
      {
        onSuccess: (saved) => {
          setName("");
          setIsDefault(false);
          onOpenChange(false);
          onSaved?.(saved.id);
        },
      },
    );
  };

  const formProps: FormContentProps = {
    name,
    setName,
    isDefault,
    setIsDefault,
    badges,
    mode,
    isPending,
    onSave: handleSave,
    onCancel: () => onOpenChange(false),
  };

  if (!isDesktop) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4">
            <SaveSearchFormContent {...formProps} />
          </div>
          <DrawerFooter>
            <Button onClick={handleSave} disabled={!canSave}>
              {mode === "edit" ? "Save" : "Create"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <SaveSearchFormContent {...formProps} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {mode === "edit" ? "Save" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
