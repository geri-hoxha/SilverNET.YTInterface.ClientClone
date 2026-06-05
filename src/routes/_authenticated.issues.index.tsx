import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIssues } from "@/features/issues/hooks";
import { CreateIssueDialog } from "@/features/issues/CreateIssueDialog";
import { StatusBadge, PriorityBadge } from "@/shared/components/StatusBadge";
import { formatRelative } from "@/shared/utils/format";
import type { IssueStatus } from "@/features/issues/types";

const searchSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  status: z.enum(["Open", "InProgress", "Done", "Blocked"]).optional(),
  projectId: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/issues/")({
  validateSearch: zodValidator(searchSchema),
  component: IssuesListPage,
});

function IssuesListPage() {
  const navigate = useNavigate({ from: "/issues" });
  const { page, pageSize, q, status, projectId } = Route.useSearch();
  const [searchText, setSearchText] = useState(q ?? "");
  const [createOpen, setCreateOpen] = useState(false);

  const query = useIssues({
    page,
    pageSize,
    search: q,
    status,
    projectId,
  });

  const updateSearch = (patch: Partial<z.infer<typeof searchSchema>>) =>
    navigate({
      search: (prev: z.infer<typeof searchSchema>) => ({
        ...prev,
        ...patch,
        page: 1,
      }),
    });

  const totalPages = query.data
    ? Math.max(1, Math.ceil(query.data.total / pageSize))
    : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Issues</h1>
          <p className="text-sm text-muted-foreground">
            Browse, filter and manage all issues across projects.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New issue
        </Button>
      </div>

      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateSearch({ q: searchText || undefined });
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issues..."
              className="pl-8"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <Select
            value={status ?? "all"}
            onValueChange={(v) =>
              updateSearch({
                status: v === "all" ? undefined : (v as IssueStatus),
              })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="InProgress">In Progress</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
              <SelectItem value="Blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Project ID"
            className="w-[180px]"
            defaultValue={projectId ?? ""}
            onBlur={(e) =>
              updateSearch({ projectId: e.target.value || undefined })
            }
          />
          <Button type="submit" variant="secondary">
            Apply
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </form>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-40">Project</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-28">Priority</TableHead>
              <TableHead className="w-32 text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : query.isError ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <p className="text-sm font-medium text-destructive">
                    Failed to load issues
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(query.error as Error)?.message}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => query.refetch()}
                  >
                    Try again
                  </Button>
                </TableCell>
              </TableRow>
            ) : !query.data?.items.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                  No issues match your filters.
                </TableCell>
              </TableRow>
            ) : (
              query.data.items.map((issue) => (
                <TableRow
                  key={issue.id}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate({ to: "/issues/$id", params: { id: issue.id } })
                  }
                >
                  <TableCell className="font-mono text-xs">
                    {issue.key ?? issue.id}
                  </TableCell>
                  <TableCell className="font-medium">{issue.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {issue.projectName ?? issue.projectId}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={issue.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={issue.priority} />
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatRelative(issue.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {query.data && query.data.total > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages} · {query.data.total} total
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() =>
                  navigate({
                    search: (p: z.infer<typeof searchSchema>) => ({
                      ...p,
                      page: page - 1,
                    }),
                  })
                }
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() =>
                  navigate({
                    search: (p: z.infer<typeof searchSchema>) => ({
                      ...p,
                      page: page + 1,
                    }),
                  })
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
