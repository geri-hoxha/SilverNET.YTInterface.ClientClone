import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { z } from "zod";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useProjects } from "@/features/projects/hooks";
import { issuesSearchSchema } from "../schemas";

type IssuesSearch = z.infer<typeof issuesSearchSchema>;

const ALL = "__all__";

const PRIORITY_OPTIONS = [
  "S5 - Discussion",
  "S4 - Low",
  "S3 - Minor",
  "S2 - Major",
  "S1 - Critical",
  "Show-stopper",
  "Critical",
  "Major",
  "Normal",
  "Minor",
] as const;

const WORKFLOW_STATE_OPTIONS = [
  "Pending Estimation",
  "Done",
  "Needs Clarification",
  "Provided Clarification",
  "Awaiting Est. Approval",
  "Approved Estimation",
  "Refused Estimation",
  "In Progress",
  "In Review",
] as const;

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

interface Props {
  search: IssuesSearch;
}

export function IssuesFilterBar({ search }: Props) {
  const navigate = useNavigate({ from: "/issues" });
  const projectsQ = useProjects();
  const [searchDraft, setSearchDraft] = useState(search.search ?? "");

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

  const commitDrafts = () =>
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

  const hasActiveFilters = Boolean(
    search.projectId ||
      search.status?.length ||
      search.priority?.length ||
      search.from ||
      search.to ||
      search.search ||
      search.sortBy,
  );

  return (
    <div className="border-b bg-muted/20 px-3 py-3 sm:px-4">
      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end">
        <FilterField label="Search" className="w-full sm:min-w-[200px] sm:flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitDrafts();
              }}
              placeholder="Search issues..."
              className="h-9 pl-8 sm:h-8"
            />
          </div>
        </FilterField>

        <FilterField label="Project" className="w-full sm:w-[180px]">
          <Select
            value={search.projectId ?? ALL}
            onValueChange={(value) =>
              updateSearch({
                projectId: value === ALL ? undefined : value,
              })
            }
          >
            <SelectTrigger className="h-9 sm:h-8">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All projects</SelectItem>
              {(projectsQ.data ?? []).map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Priority" className="w-full sm:w-[180px]">
          <MultiSelectFilter
            options={PRIORITY_OPTIONS}
            selected={search.priority ?? []}
            onChange={(next) =>
              updateSearch({ priority: next.length ? next : undefined })
            }
            placeholder="Any priority"
          />
        </FilterField>

        <FilterField label="Status" className="w-full sm:w-[200px]">
          <MultiSelectFilter
            options={WORKFLOW_STATE_OPTIONS}
            selected={search.status ?? []}
            onChange={(next) =>
              updateSearch({ status: next.length ? next : undefined })
            }
            placeholder="Any status"
          />
        </FilterField>

        <FilterField label="From" className="w-full sm:w-[170px]">
          <DatePicker
            value={isoToDate(search.from)}
            onChange={(date) =>
              updateSearch({
                from: date ? toStartOfDay(date) : undefined,
              })
            }
            placeholder="Start date"
            toDate={isoToDate(search.to)}
            className="h-9 sm:h-8"
          />
        </FilterField>

        <FilterField label="To" className="w-full sm:w-[170px]">
          <DatePicker
            value={isoToDate(search.to)}
            onChange={(date) =>
              updateSearch({
                to: date ? toEndOfDay(date) : undefined,
              })
            }
            placeholder="End date"
            fromDate={isoToDate(search.from)}
            className="h-9 sm:h-8"
          />
        </FilterField>

        <div className="flex items-center gap-2 pb-0.5 w-full sm:w-auto">
          <Button
            size="sm"
            variant="secondary"
            className="h-9 flex-1 sm:h-8 sm:flex-none"
            onClick={commitDrafts}
          >
            Apply
          </Button>
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              className="h-9 flex-1 sm:h-8 sm:flex-none text-muted-foreground"
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

function MultiSelectFilter({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between font-normal sm:h-8"
        >
          <span
            className={cn(
              "truncate",
              selected.length === 0 && "text-muted-foreground",
            )}
          >
            {label}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-[180px] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Filter..." />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const checked = selected.includes(option);
                return (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => toggle(option)}
                    className="flex items-center gap-2"
                  >
                    <Checkbox checked={checked} className="pointer-events-none" />
                    <span className="flex-1">{option}</span>
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
      <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
