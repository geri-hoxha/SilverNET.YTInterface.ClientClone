import { createFileRoute, Link } from "@tanstack/react-router";
import { ListChecks, FolderKanban, Building2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIssues } from "@/features/issues/hooks";
import { StatusBadge, PriorityBadge } from "@/shared/components/StatusBadge";
import { formatRelative } from "@/shared/utils/format";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

interface Stat {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}

function DashboardPage() {
  const recent = useIssues({ page: 1, pageSize: 5 });

  const total = recent.data?.total ?? 0;
  const stats: Stat[] = [
    { label: "Total Issues", value: total ? String(total) : "—", icon: ListChecks },
    { label: "Open Issues", value: "—", icon: AlertCircle, hint: "Needs endpoint" },
    { label: "Projects", value: "—", icon: FolderKanban, hint: "Needs endpoint" },
    { label: "Organizations", value: "—", icon: Building2, hint: "Needs endpoint" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of activity across the workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{s.value}</div>
              {s.hint && (
                <p className="text-xs text-muted-foreground mt-1">{s.hint}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent issues</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to="/issues">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recent.isError ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Unable to load issues. The backend may be unreachable.
            </div>
          ) : !recent.data?.items.length ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No issues yet.
            </div>
          ) : (
            <div className="divide-y">
              {recent.data.items.map((i) => (
                <Link
                  key={i.id}
                  to="/issues/$id"
                  params={{ id: i.id }}
                  className="flex items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded transition-colors"
                >
                  <span className="font-mono text-xs text-muted-foreground w-20">
                    {i.key ?? i.id}
                  </span>
                  <span className="flex-1 truncate text-sm">{i.title}</span>
                  <PriorityBadge priority={i.priority} />
                  <StatusBadge status={i.status} />
                  <span className="text-xs text-muted-foreground w-32 text-right">
                    {formatRelative(i.createdAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
