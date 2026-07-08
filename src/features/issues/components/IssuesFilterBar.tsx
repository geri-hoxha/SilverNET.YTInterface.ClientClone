import { endOfDay, parseISO, startOfDay } from "date-fns";
import { Check, ChevronsUpDown, ListFilter, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useClientStates, usePriorities, useProjects } from "@/features/projects/hooks";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { issuesRouteApi } from "../route";
import { issuesSearchSchema } from "../schemas";

type IssuesSearch = z.infer<typeof issuesSearchSchema>;

const ALL = "__all__";
const EMPTY_CLIENT_STATE_VALUE = "-";
const EMPTY_CLIENT_STATE_LABEL = "No state";

type FilterDraft = {
  projectId?: string;
  priority: string[];
  status: string[];
  from?: string;
  to?: string;
  closedFrom?: string;
  closedTo?: string;
};

function isoToDate(iso?: string) {
  if (!iso) return undefined;
  try {
    return parseISO(iso);
  } catch {
    return undefined;
  }
}

function toStartOfDay(date: Date) {
  return startOfDay(date).toISOString();
}

function toEndOfDay(date: Date) {
  return endOfDay(date).toISOString();
}

function countActiveFilters(search: IssuesSearch) {
  return countSheetFilters(search) + (search.search ? 1 : 0);
}

function countSheetFilters(search: IssuesSearch) {
  let count = 0;
  if (search.projectId) count++;
  if (search.priority?.length) count++;
  if (search.status?.length) count++;
  if (search.from) count++;
  if (search.to) count++;
  if (search.closedFrom) count++;
  if (search.closedTo) count++;
  return count;
}

function emptyFilterDraft(): FilterDraft {
  return {
    projectId: undefined,
    priority: [],
    status: [],
    from: undefined,
    to: undefined,
    closedFrom: undefined,
    closedTo: undefined,
  };
}

function filterDraftFromSearch(search: IssuesSearch): FilterDraft {
  return {
    projectId: search.projectId,
    priority: search.priority ?? [],
    status: search.status ?? [],
    from: search.from,
    to: search.to,
    closedFrom: search.closedFrom,
    closedTo: search.closedTo,
  };
}

interface Props {
  search: IssuesSearch;
}

export function IssuesFilterBar({ search }: Props) {
  const isMobile = useIsMobile();
  const navigate = issuesRouteApi.useNavigate();
  const projectsQ = useProjects();
  const prioritiesQ = usePriorities();
  const clientStatesQ = useClientStates();
  const [searchDraft, setSearchDraft] = useState(search.search ?? "");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [mobileDraft, setMobileDraft] = useState<FilterDraft>(() => filterDraftFromSearch(search));

  useEffect(() => {
    setSearchDraft(search.search ?? "");
  }, [search.search]);

  const updateSearch = (next: Partial<IssuesSearch>) =>
    navigate({
      search: (current: IssuesSearch) => ({
        ...current,
        ...next,
        page: next.page ?? 1,
      }),
    });

  const commitSearchDraft = () =>
    updateSearch({
      search: searchDraft.trim() || undefined,
    });

  const clearFilters = () =>
    navigate({
      search: {
        page: 1,
        pageSize: search.pageSize,
      },
    });

  const hasActiveFilters = countActiveFilters(search) > 0 || Boolean(search.sortBy);
  const sheetFilterCount = countSheetFilters(search);
  const projects = projectsQ.data ?? [];
  const priorities = prioritiesQ.data ?? [];
  const clientStates = clientStatesQ.data ?? [];

  const handleFilterSheetOpenChange = (open: boolean) => {
    if (open) {
      setMobileDraft(filterDraftFromSearch(search));
    }
    setFilterSheetOpen(open);
  };

  const applyMobileFilters = () => {
    updateSearch({
      projectId: mobileDraft.projectId,
      priority: mobileDraft.priority.length ? mobileDraft.priority : undefined,
      status: mobileDraft.status.length ? mobileDraft.status : undefined,
      from: mobileDraft.from,
      to: mobileDraft.to,
      closedFrom: mobileDraft.closedFrom,
      closedTo: mobileDraft.closedTo,
    });
    handleFilterSheetOpenChange(false);
  };

  const resetMobileFilters = () => {
    const cleared = emptyFilterDraft();
    setMobileDraft(cleared);
    updateSearch({
      projectId: undefined,
      priority: undefined,
      status: undefined,
      from: undefined,
      to: undefined,
      closedFrom: undefined,
      closedTo: undefined,
    });
    handleFilterSheetOpenChange(false);
  };

  const searchDraftDirty = searchDraft.trim() !== (search.search ?? "").trim();

  if (isMobile) {
    return (
      <>
        <div className="border-b bg-muted/20 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitSearchDraft();
                }}
                placeholder="Search issues..."
                className={cn("h-9 pl-8", searchDraft ? "pr-16" : "pr-9")}
              />
              {searchDraft && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchDraft("");
                    if (search.search) updateSearch({ search: undefined });
                  }}
                  className="absolute right-9 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <Button
                type="button"
                size="icon"
                variant={searchDraftDirty ? "default" : "ghost"}
                className="absolute right-0.5 top-1/2 h-8 w-8 -translate-y-1/2"
                onClick={commitSearchDraft}
                aria-label="Search issues"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="relative h-9 shrink-0 gap-1.5 px-3"
              onClick={() => handleFilterSheetOpenChange(true)}
            >
              <ListFilter className="h-4 w-4" />
              Filters
              {sheetFilterCount > 0 && (
                <Badge className="ml-0.5 h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
                  {sheetFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {hasActiveFilters && (
            <MobileActiveFilterChips
              search={search}
              projects={projects}
              onRemove={(next) => updateSearch(next)}
              onClearAll={clearFilters}
            />
          )}
        </div>

        <Sheet open={filterSheetOpen} onOpenChange={handleFilterSheetOpenChange}>
          <SheetContent
            side="bottom"
            className="flex h-[min(88dvh,720px)] flex-col gap-0 rounded-t-2xl p-0"
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/25" />
            <SheetHeader className="shrink-0 border-b px-4 pb-3 pt-4 text-left">
              <SheetTitle>Filter issues</SheetTitle>
              <SheetDescription>
                Narrow the list by project, priority, status, or date range.
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <IssuesFilterFields
                draft={mobileDraft}
                onDraftChange={setMobileDraft}
                projects={projects}
                priorities={priorities}
                clientStates={clientStates}
              />
            </div>

            <SheetFooter className="grid shrink-0 grid-cols-2 gap-2 border-t bg-background px-4 py-3">
              <Button type="button" variant="outline" onClick={resetMobileFilters}>
                Reset filters
              </Button>
              <Button type="button" onClick={applyMobileFilters}>
                Apply filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <div className="border-b bg-muted/20 px-4 py-3">
      <div className="flex flex-wrap items-end gap-3">
        <FilterField label="Search" className="w-85 shrink-0">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitSearchDraft();
              }}
              placeholder="Search issues..."
              className="h-8 pl-8"
            />
          </div>
        </FilterField>

        <IssuesFilterFields
          draft={{
            projectId: search.projectId,
            priority: search.priority ?? [],
            status: search.status ?? [],
            from: search.from,
            to: search.to,
            closedFrom: search.closedFrom,
            closedTo: search.closedTo,
          }}
          onDraftChange={(next) =>
            updateSearch({
              projectId: next.projectId,
              priority: next.priority.length ? next.priority : undefined,
              status: next.status.length ? next.status : undefined,
              from: next.from,
              to: next.to,
              closedFrom: next.closedFrom,
              closedTo: next.closedTo,
            })
          }
          projects={projects}
          priorities={priorities}
          clientStates={clientStates}
          layout="inline"
        />

        <div className="flex items-center gap-2 pb-0.5">
          <Button size="sm" variant="secondary" className="h-8" onClick={commitSearchDraft}>
            Apply
          </Button>
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-muted-foreground"
              onClick={clearFilters}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function IssuesFilterFields({
  draft,
  onDraftChange,
  projects,
  priorities,
  clientStates,
  layout = "stacked",
}: {
  draft: FilterDraft;
  onDraftChange: (next: FilterDraft) => void;
  projects: { id: string; name: string }[];
  priorities: readonly string[];
  clientStates: readonly string[];
  layout?: "stacked" | "inline";
}) {
  const patch = (next: Partial<FilterDraft>) => onDraftChange({ ...draft, ...next });

  const containerClass = layout === "inline" ? "contents" : "grid grid-cols-1 gap-4";

  return (
    <div className={containerClass}>
      <FilterField label="Project" className={layout === "inline" ? "w-45" : undefined}>
        <Select
          value={draft.projectId ?? ALL}
          onValueChange={(value) => patch({ projectId: value === ALL ? undefined : value })}
        >
          <SelectTrigger className={layout === "inline" ? "h-8" : "h-10"}>
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Priority" className={layout === "inline" ? "w-45" : undefined}>
        <MultiSelectFilter
          options={priorities}
          selected={draft.priority}
          onChange={(next) => patch({ priority: next })}
          placeholder="Any priority"
          triggerClassName={layout === "inline" ? "h-8" : "h-10"}
        />
      </FilterField>

      <FilterField label="Status" className={layout === "inline" ? "w-50" : undefined}>
        <MultiSelectFilter
          options={[
            EMPTY_CLIENT_STATE_VALUE,
            ...clientStates.filter((state) => state !== EMPTY_CLIENT_STATE_VALUE),
          ]}
          optionLabels={{
            [EMPTY_CLIENT_STATE_VALUE]: EMPTY_CLIENT_STATE_LABEL,
          }}
          selected={draft.status}
          onChange={(next) => patch({ status: next })}
          placeholder="Any status"
          triggerClassName={layout === "inline" ? "h-8" : "h-10"}
        />
      </FilterField>

      <FilterField label="Created from" className={layout === "inline" ? "w-[155px]" : undefined}>
        <DatePicker
          value={isoToDate(draft.from)}
          onChange={(date) => patch({ from: date ? toStartOfDay(date) : undefined })}
          placeholder="Start date"
          toDate={isoToDate(draft.to)}
          className={layout === "inline" ? "h-8" : "h-10"}
        />
      </FilterField>

      <FilterField label="Created to" className={layout === "inline" ? "w-[155px]" : undefined}>
        <DatePicker
          value={isoToDate(draft.to)}
          onChange={(date) => patch({ to: date ? toEndOfDay(date) : undefined })}
          placeholder="End date"
          fromDate={isoToDate(draft.from)}
          className={layout === "inline" ? "h-8" : "h-10"}
        />
      </FilterField>

      <FilterField label="Closed from" className={layout === "inline" ? "w-[155px]" : undefined}>
        <DatePicker
          value={isoToDate(draft.closedFrom)}
          onChange={(date) => patch({ closedFrom: date ? toStartOfDay(date) : undefined })}
          placeholder="Start date"
          toDate={isoToDate(draft.closedTo)}
          className={layout === "inline" ? "h-8" : "h-10"}
        />
      </FilterField>

      <FilterField label="Closed to" className={layout === "inline" ? "w-[155px]" : undefined}>
        <DatePicker
          value={isoToDate(draft.closedTo)}
          onChange={(date) => patch({ closedTo: date ? toEndOfDay(date) : undefined })}
          placeholder="End date"
          fromDate={isoToDate(draft.closedFrom)}
          className={layout === "inline" ? "h-8" : "h-10"}
        />
      </FilterField>
    </div>
  );
}

function MobileActiveFilterChips({
  search,
  projects,
  onRemove,
  onClearAll,
}: {
  search: IssuesSearch;
  projects: { id: string; name: string }[];
  onRemove: (next: Partial<IssuesSearch>) => void;
  onClearAll: () => void;
}) {
  const chips: { key: string; label: string; clear: Partial<IssuesSearch> }[] = [];

  if (search.search) {
    chips.push({
      key: "search",
      label: `"${search.search}"`,
      clear: { search: undefined },
    });
  }

  if (search.projectId) {
    const project = projects.find((p) => p.id === search.projectId);
    chips.push({
      key: "project",
      label: project?.name ?? "Project",
      clear: { projectId: undefined },
    });
  }

  if (search.priority?.length) {
    chips.push({
      key: "priority",
      label:
        search.priority.length === 1 ? search.priority[0] : `${search.priority.length} priorities`,
      clear: { priority: undefined },
    });
  }

  if (search.status?.length) {
    const labels = search.status.map((s) =>
      s === EMPTY_CLIENT_STATE_VALUE ? EMPTY_CLIENT_STATE_LABEL : s,
    );
    chips.push({
      key: "status",
      label: labels.length === 1 ? labels[0] : `${labels.length} statuses`,
      clear: { status: undefined },
    });
  }

  if (search.from || search.to) {
    const from = search.from ? isoToDate(search.from) : undefined;
    const to = search.to ? isoToDate(search.to) : undefined;
    const label =
      from && to
        ? `Created ${from.toLocaleDateString()} – ${to.toLocaleDateString()}`
        : from
          ? `Created from ${from.toLocaleDateString()}`
          : `Created until ${to!.toLocaleDateString()}`;
    chips.push({
      key: "created-dates",
      label,
      clear: { from: undefined, to: undefined },
    });
  }

  if (search.closedFrom || search.closedTo) {
    const from = search.closedFrom ? isoToDate(search.closedFrom) : undefined;
    const to = search.closedTo ? isoToDate(search.closedTo) : undefined;
    const label =
      from && to
        ? `Closed ${from.toLocaleDateString()} – ${to.toLocaleDateString()}`
        : from
          ? `Closed from ${from.toLocaleDateString()}`
          : `Closed until ${to!.toLocaleDateString()}`;
    chips.push({
      key: "closed-dates",
      label,
      clear: { closedFrom: undefined, closedTo: undefined },
    });
  }

  if (!chips.length) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip.clear)}
          className="inline-flex max-w-full items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs text-foreground"
        >
          <span className="truncate">{chip.label}</span>
          <X className="h-3 w-3 shrink-0 opacity-60" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}

function MultiSelectFilter({
  options,
  optionLabels,
  selected,
  onChange,
  placeholder,
  triggerClassName,
}: {
  options: readonly string[];
  optionLabels?: Record<string, string>;
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  triggerClassName?: string;
}) {
  const labelFor = (option: string) => optionLabels?.[option] ?? option;
  const [open, setOpen] = useState(false);

  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const allSelected = options.length > 0 && options.every((o) => selected.includes(o));

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? labelFor(selected[0])
        : `${selected.length} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", triggerClassName ?? "h-8")}
        >
          <span className={cn("truncate", selected.length === 0 && "text-muted-foreground")}>
            {label}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-45 p-0" align="start">
        <Command>
          <CommandInput placeholder="Filter..." />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.length > 0 && (
                <CommandItem
                  value={ALL}
                  onSelect={toggleAll}
                  className="mb-1 flex items-center gap-2 border-b font-medium text-primary data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                >
                  <Checkbox
                    checked={allSelected}
                    className="pointer-events-none border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <span className="flex-1">Select All</span>
                  {allSelected && <Check className="h-4 w-4" />}
                </CommandItem>
              )}
              {options.map((option) => {
                const checked = selected.includes(option);
                return (
                  <CommandItem
                    key={option}
                    value={`${option} ${labelFor(option)}`}
                    onSelect={() => toggle(option)}
                    className="flex items-center gap-2"
                  >
                    <Checkbox checked={checked} className="pointer-events-none" />
                    <span className="flex-1">{labelFor(option)}</span>
                    {checked && <Check className="h-4 w-4" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          {selected.length > 0 && (
            <div className="border-t p-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs text-muted-foreground"
                onClick={() => onChange([])}
              >
                Clear selection
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function FilterField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
