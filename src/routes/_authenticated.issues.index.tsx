import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useIssues } from "@/features/issues/hooks";
import { CreateIssueDialog } from "@/features/issues/CreateIssueDialog";
import { UserAvatar } from "@/shared/components/UserAvatar";
import type { Issue, IssueStatus } from "@/features/issues/types";

const searchSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(50),
  q: z.string().optional(),
  status: z.enum(["Open", "InProgress", "Done", "Blocked"]).optional(),
  projectId: z.string().optional(),
  saved: z.enum(["assigned", "commented", "reported", "star"]).optional(),
});

export const Route = createFileRoute("/_authenticated/issues/")({
  validateSearch: zodValidator(searchSchema),
  component: IssuesListPage,
});

function IssuesListPage() {
  const navigate = useNavigate({ from: "/issues" });
  const { page, pageSize, q, status, projectId, saved } = Route.useSearch();
  const [searchText, setSearchText] = useState(q ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [sections, setSections] = useState({
    drafts: true,
    projects: true,
    tags: true,
    saved: true,
  });

  const query = useIssues({ page, pageSize, search: q, status, projectId });
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  const allChecked = items.length > 0 && items.every((i) => selected[i.id]);
  const toggleAll = (v: boolean) => {
    const next: Record<string, boolean> = {};
    if (v) items.forEach((i) => (next[i.id] = true));
    setSelected(next);
  };

  return (
    <div className="-mx-6 -my-6 flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b bg-background px-5 py-3">
        <div className="flex items-baseline gap-2">
          <h1 className="flex items-center gap-1 text-base font-semibold">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-emerald-500/15 text-emerald-600">
              <CheckSquare className="h-3.5 w-3.5" />
            </span>
            Issues
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </h1>
          <span className="text-xs text-muted-foreground">{total}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setCreateOpen(true)}
          >
            New Issue
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left filter sidebar */}
        <aside className="w-[240px] shrink-0 border-r bg-muted/20 overflow-y-auto py-3 text-sm">
          <FilterSection
            label="Drafts"
            open={sections.drafts}
            onToggle={() => setSections((s) => ({ ...s, drafts: !s.drafts }))}
          />
          <FilterSection
            label="Projects"
            open={sections.projects}
            onToggle={() =>
              setSections((s) => ({ ...s, projects: !s.projects }))
            }
          >
            <SidebarItem label="No favorite projects" muted />
          </FilterSection>
          <FilterSection
            label="Tags"
            open={sections.tags}
            onToggle={() => setSections((s) => ({ ...s, tags: !s.tags }))}
          >
            <SidebarItem
              label="Star"
              icon={<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
              active={saved === "star"}
              onClick={() =>
                navigate({
                  search: (p: z.infer<typeof searchSchema>) => ({
                    ...p,
                    saved: saved === "star" ? undefined : "star",
                    page: 1,
                  }),
                })
              }
            />
          </FilterSection>
          <FilterSection
            label="Saved Searches"
            open={sections.saved}
            onToggle={() => setSections((s) => ({ ...s, saved: !s.saved }))}
          >
            <SidebarItem
              label="Assigned to me"
              count={44}
              active={saved === "assigned"}
              onClick={() =>
                navigate({
                  search: (p: z.infer<typeof searchSchema>) => ({
                    ...p,
                    saved: saved === "assigned" ? undefined : "assigned",
                    page: 1,
                  }),
                })
              }
            />
            <SidebarItem
              label="Commented by me"
              count={0}
              active={saved === "commented"}
              onClick={() =>
                navigate({
                  search: (p: z.infer<typeof searchSchema>) => ({
                    ...p,
                    saved: saved === "commented" ? undefined : "commented",
                    page: 1,
                  }),
                })
              }
            />
            <SidebarItem
              label="Reported by me"
              count={0}
              active={saved === "reported"}
              onClick={() =>
                navigate({
                  search: (p: z.infer<typeof searchSchema>) => ({
                    ...p,
                    saved: saved === "reported" ? undefined : "reported",
                    page: 1,
                  }),
                })
              }
            />
          </FilterSection>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto">
          {/* Search bar */}
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background px-4 py-2.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate({
                  search: (p: z.infer<typeof searchSchema>) => ({
                    ...p,
                    q: searchText || undefined,
                    page: 1,
                  }),
                });
              }}
              className="relative flex-1"
            >
              <Plus className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search for text or add a filter"
                className="h-8 pl-7 text-sm"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </form>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Search className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          {/* Table */}
          <div className="min-w-full">
            <div className="grid grid-cols-[36px_100px_minmax(280px,1fr)_120px_160px_120px_140px_120px] items-center gap-2 border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
              <Checkbox
                checked={allChecked}
                onCheckedChange={(v) => toggleAll(!!v)}
              />
              <SortHead label="ID" />
              <SortHead label="Summary" />
              <SortHead label="State" />
              <SortHead label="Assignee" />
              <SortHead label="Priority" />
              <SortHead label="Client State" />
              <div className="flex items-center justify-between">
                <SortHead label="Spent time" />
                <button className="text-muted-foreground hover:text-foreground">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {query.isLoading ? (
              Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[36px_100px_minmax(280px,1fr)_120px_160px_120px_140px_120px] items-center gap-2 border-b px-4 py-2.5"
                >
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))
            ) : query.isError ? (
              <div className="px-4 py-16 text-center">
                <p className="text-sm font-medium text-destructive">
                  Failed to load issues
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => query.refetch()}
                >
                  Try again
                </Button>
              </div>
            ) : !items.length ? (
              <div className="px-4 py-16 text-center text-sm text-muted-foreground">
                No issues match your filters.
              </div>
            ) : (
              items.map((issue) => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  checked={!!selected[issue.id]}
                  onCheck={(v) =>
                    setSelected((s) => ({ ...s, [issue.id]: v }))
                  }
                  onOpen={() =>
                    navigate({ to: "/issues/$id", params: { id: issue.id } })
                  }
                />
              ))
            )}
          </div>
        </main>
      </div>

      <CreateIssueDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultProjectId={projectId}
        onCreated={(id) => navigate({ to: "/issues/$id", params: { id } })}
      />
    </div>
  );
}

function SortHead({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-1 text-left hover:text-foreground">
      {label}
      <span className="text-[10px] opacity-60">⇅</span>
    </button>
  );
}

function FilterSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-1 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        {label}
      </button>
      {open && children ? <div className="pb-1">{children}</div> : null}
    </div>
  );
}

function SidebarItem({
  label,
  count,
  icon,
  active,
  muted,
  onClick,
}: {
  label: string;
  count?: number;
  icon?: React.ReactNode;
  active?: boolean;
  muted?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-6 py-1.5 text-left text-sm hover:bg-accent/60",
        active && "bg-accent text-foreground font-medium",
        muted && "text-muted-foreground italic cursor-default hover:bg-transparent",
      )}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
    </button>
  );
}

const STATE_STYLE: Record<string, string> = {
  Done: "text-emerald-600",
  "In Progress": "text-amber-600",
  Open: "text-blue-600",
  Blocked: "text-red-600",
  Todo: "text-slate-600",
};

const PRIORITY_STYLE: Record<string, string> = {
  Critical: "text-red-600",
  "S1 - Critical": "text-red-600",
  Major: "text-orange-600",
  "S2 - Major": "text-orange-600",
  Normal: "text-sky-600",
  "S3 - Normal": "text-sky-600",
  Low: "text-slate-500",
  "S4 - Low": "text-slate-500",
};

function stateLabel(s: IssueStatus) {
  return s === "InProgress" ? "In Progress" : s;
}

function projectBadge(issue: Issue) {
  const code =
    issue.projectShortCode ??
    (issue.key ? issue.key.split("-")[0] : issue.projectName?.[0] ?? "?");
  const letter = code[0]?.toUpperCase() ?? "?";
  const isS = letter === "S";
  return (
    <span
      className={cn(
        "inline-flex h-4 w-4 items-center justify-center rounded-sm text-[10px] font-bold text-white",
        isS ? "bg-orange-500" : "bg-emerald-600",
      )}
      title={code}
    >
      {letter}
    </span>
  );
}

function IssueRow({
  issue,
  checked,
  onCheck,
  onOpen,
}: {
  issue: Issue;
  checked: boolean;
  onCheck: (v: boolean) => void;
  onOpen: () => void;
}) {
  const state = stateLabel(issue.status);
  const priorityLabel = issue.priorityLabel ?? issue.priority;
  return (
    <div
      onClick={onOpen}
      className={cn(
        "grid grid-cols-[36px_100px_minmax(280px,1fr)_120px_160px_120px_140px_120px] items-center gap-2 border-b px-4 py-2 text-sm cursor-pointer hover:bg-accent/40",
        checked && "bg-accent/30",
      )}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={checked} onCheckedChange={(v) => onCheck(!!v)} />
      </div>
      <div className="flex items-center gap-1.5 font-mono text-xs">
        {issue.starred ? (
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        ) : (
          <span className="w-3.5" />
        )}
        <span className="text-foreground">{issue.key ?? issue.id.slice(0, 8)}</span>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        {projectBadge(issue)}
        <span className="truncate">{issue.title}</span>
      </div>
      <button
        className={cn("text-left hover:underline", STATE_STYLE[state] ?? "text-foreground")}
        onClick={(e) => e.stopPropagation()}
      >
        {state}
      </button>
      <div className="flex items-center gap-2 min-w-0">
        {issue.assigneeName ? (
          <>
            <UserAvatar
              name={issue.assigneeName}
              seed={issue.assigneeName}
              className="h-5 w-5"
            />
            <button
              className="truncate text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {issue.assigneeName}
            </button>
          </>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )}
      </div>
      <button
        className={cn(
          "text-left hover:underline",
          PRIORITY_STYLE[priorityLabel] ?? "text-foreground",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {priorityLabel}
      </button>
      <div
        className={cn(
          "truncate",
          issue.clientState === "In Progress"
            ? "text-amber-600"
            : issue.clientState === "Done"
              ? "text-emerald-600"
              : "text-muted-foreground",
        )}
      >
        {issue.clientState ?? "?"}
      </div>
      <div className="text-muted-foreground">{issue.spentTime ?? "?"}</div>
    </div>
  );
}
