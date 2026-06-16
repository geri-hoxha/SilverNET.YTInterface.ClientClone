import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import { Search, X } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjects } from "@/features/projects/hooks";
import { issuesSearchSchema } from "../schemas";

type IssuesSearch = z.infer<typeof issuesSearchSchema>;

const ALL = "__all__";

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
  const [statusDraft, setStatusDraft] = useState(search.status ?? "");
  const [priorityDraft, setPriorityDraft] = useState(search.priority ?? "");

  useEffect(() => {
    setSearchDraft(search.search ?? "");
  }, [search.search]);

  useEffect(() => {
    setStatusDraft(search.status ?? "");
  }, [search.status]);

  useEffect(() => {
    setPriorityDraft(search.priority ?? "");
  }, [search.priority]);

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
      status: statusDraft.trim() || undefined,
      priority: priorityDraft.trim() || undefined,
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
      search.status ||
      search.priority ||
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

        <FilterField label="Priority" className="w-full sm:w-[140px]">
          <Input
            value={priorityDraft}
            onChange={(e) => setPriorityDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitDrafts();
            }}
            onBlur={() =>
              updateSearch({ priority: priorityDraft.trim() || undefined })
            }
            placeholder="Any priority"
            className="h-9 sm:h-8"
          />
        </FilterField>

        <FilterField label="Status" className="w-full sm:w-[140px]">
          <Input
            value={statusDraft}
            onChange={(e) => setStatusDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitDrafts();
            }}
            onBlur={() =>
              updateSearch({ status: statusDraft.trim() || undefined })
            }
            placeholder="Any status"
            className="h-9 sm:h-8"
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
