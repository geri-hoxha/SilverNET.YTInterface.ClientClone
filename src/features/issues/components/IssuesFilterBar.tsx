import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
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
import type { IssuePriority, IssueStatus } from "../types";

type IssuesSearch = z.infer<typeof issuesSearchSchema>;

const ALL = "__all__";

const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: "Open", label: "Open" },
  { value: "InProgress", label: "In Progress" },
  { value: "Done", label: "Done" },
  { value: "Blocked", label: "Blocked" },
];

const PRIORITY_OPTIONS: { value: IssuePriority; label: string }[] = [
  { value: "Low", label: "Low" },
  { value: "Normal", label: "Normal" },
  { value: "Major", label: "Major" },
  { value: "Critical", label: "Critical" },
];

function dateInputValue(iso?: string) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function toStartOfDay(date: string) {
  return new Date(`${date}T00:00:00`).toISOString();
}

function toEndOfDay(date: string) {
  return new Date(`${date}T23:59:59.999`).toISOString();
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
    <div className="border-b bg-muted/20 px-4 py-3">
      <div className="flex flex-wrap items-end gap-3">
        <FilterField label="Search" className="min-w-[200px] flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateSearch({ search: searchDraft.trim() || undefined });
                }
              }}
              placeholder="Search issues..."
              className="h-8 pl-8"
            />
          </div>
        </FilterField>

        <FilterField label="Project" className="w-[180px]">
          <Select
            value={search.projectId ?? ALL}
            onValueChange={(value) =>
              updateSearch({
                projectId: value === ALL ? undefined : value,
              })
            }
          >
            <SelectTrigger className="h-8">
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

        <FilterField label="Status" className="w-[140px]">
          <Select
            value={search.status ?? ALL}
            onValueChange={(value) =>
              updateSearch({
                status: value === ALL ? undefined : (value as IssueStatus),
              })
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Priority" className="w-[140px]">
          <Select
            value={search.priority ?? ALL}
            onValueChange={(value) =>
              updateSearch({
                priority: value === ALL ? undefined : (value as IssuePriority),
              })
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All priorities</SelectItem>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="From" className="w-[150px]">
          <Input
            type="date"
            value={dateInputValue(search.from)}
            onChange={(e) =>
              updateSearch({
                from: e.target.value ? toStartOfDay(e.target.value) : undefined,
              })
            }
            className="h-8"
          />
        </FilterField>

        <FilterField label="To" className="w-[150px]">
          <Input
            type="date"
            value={dateInputValue(search.to)}
            onChange={(e) =>
              updateSearch({
                to: e.target.value ? toEndOfDay(e.target.value) : undefined,
              })
            }
            className="h-8"
          />
        </FilterField>

        <div className="flex items-center gap-2 pb-0.5">
          <Button
            size="sm"
            variant="secondary"
            className="h-8"
            onClick={() =>
              updateSearch({ search: searchDraft.trim() || undefined })
            }
          >
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
