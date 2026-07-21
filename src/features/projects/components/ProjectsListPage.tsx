// projects-list-page.tsx
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSIONS, useAuth } from "@/features/auth";
import { useOrganizations } from "@/features/organizations/hooks";

import { PageHeader } from "@/components/common/PageHeader.tsx";
import { useDeleteProject, useProjects, useSyncPriorities } from "../hooks";
import type { Project } from "../types";
import { groupProjectsByOrganization } from "../utils";
import { ProjectDeleteDialog } from "./dialogs/ProjectDeleteDialog";
import { ProjectFormDialog } from "./dialogs/ProjectDialog";
import { OrganizationProjectsCard } from "./OrganizationProjectsCard";

export function ProjectsListPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.projectsCreate);
  const canUpdate = hasPermission(PERMISSIONS.projectsUpdate);
  const canSync = hasPermission(PERMISSIONS.projectsPrioritiesSync);

  const orgsQ = useOrganizations();
  const projectsQ = useProjects();
  const syncMut = useSyncPriorities();
  const deleteMut = useDeleteProject();

  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState<{
    organizationId?: string;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

  const grouped = useMemo(() => groupProjectsByOrganization(orgsQ.data ?? [], projectsQ.data ?? []), [orgsQ.data, projectsQ.data]);

  const loading = orgsQ.isLoading || projectsQ.isLoading;

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden p-3 md:p-6">
      <PageHeader
        title="Projects"
        actions={
          canCreate ? (
            <Button onClick={() => setCreating({})}>
              <Plus className="mr-2 h-4 w-4" /> New project
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <Card className="space-y-3 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      ) : orgsQ.isError || projectsQ.isError ? (
        <Card className="py-12 text-center">
          <p className="text-destructive text-sm font-medium">Failed to load data</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              orgsQ.refetch();
              projectsQ.refetch();
            }}
          >
            Try again
          </Button>
        </Card>
      ) : !grouped.length ? (
        <Card className="text-muted-foreground py-16 text-center text-sm">No organizations found. Create an organization first.</Card>
      ) : (
        <div className="min-w-0 space-y-3">
          {grouped.map(({ org, projects }) => (
            <OrganizationProjectsCard
              key={org.id}
              org={org}
              projects={projects}
              canCreate={canCreate}
              canUpdate={canUpdate}
              canSync={canSync}
              syncingProjectId={syncMut.isPending ? syncMut.variables : undefined}
              onAddProject={() => setCreating({ organizationId: org.id })}
              onEdit={setEditing}
              onDelete={setConfirmDelete}
              onSync={(id) => syncMut.mutate(id)}
            />
          ))}
        </div>
      )}

      <ProjectFormDialog
        key={creating ? `create-${creating.organizationId ?? "none"}` : "create-closed"}
        open={!!creating}
        onOpenChange={(o) => !o && setCreating(null)}
        mode="create"
        defaultOrganizationId={creating?.organizationId}
        organizations={orgsQ.data ?? []}
      />
      <ProjectFormDialog key={editing?.id ?? "edit"} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} mode="edit" project={editing} organizations={orgsQ.data ?? []} />

      <ProjectDeleteDialog
        project={confirmDelete}
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) deleteMut.mutate(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}
