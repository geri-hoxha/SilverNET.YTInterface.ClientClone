import { Link } from "@tanstack/react-router";
import { ChevronRight, Dot, Plus, Settings as SettingsIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { EntityLogo } from "@/components/common/EntityLogo";
import { DataTable } from "@/components/common/table/DataTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Organization } from "@/features/organizations/types";

import { cn } from "@/lib/utils";
import type { Project } from "../types";
import { getProjectColumns, type ProjectsTableMeta } from "./table/projects-columns";

export function OrganizationProjectsCard({
  org,
  projects,
  canCreate,
  canUpdate,
  canSync,
  syncingProjectId,
  onAddProject,
  onEdit,
  onDelete,
  onSync,
}: {
  org: Organization;
  projects: Project[];
  canCreate: boolean;
  canUpdate: boolean;
  canSync: boolean;
  syncingProjectId?: string;
  onAddProject: () => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onSync: (projectId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const columns = useMemo(() => getProjectColumns(), []);

  const tableMeta: ProjectsTableMeta = {
    canUpdate,
    canSync,
    onEdit,
    onDelete,
    onSync,
    syncingProjectId,
  };

  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="bg-muted/40 flex flex-col gap-2 border-b px-3 py-2 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCollapsed((c) => !c)}>
            <ChevronRight className={cn("h-4 w-4 transition-transform duration-200 ease-in-out", collapsed ? "rotate-0" : "rotate-90")} />
          </Button>
          <EntityLogo name={org.name} seed={org.id} size="sm" />
          <span className="text-xs font-semibold tracking-wider text-nowrap uppercase">{org.name}</span>
        </div>
        <div className="flex items-center justify-between md:w-full">
          <div className="flex items-center">
            <Dot className="text-muted-foreground size-5" />
            <span className="text-muted-foreground text-xs">
              {projects.length} {projects.length === 1 ? "project" : "projects"}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {canCreate && (
              <Button variant="ghost" size="sm" onClick={onAddProject}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add project
              </Button>
            )}
            <Button variant="ghost" size="icon" className="text-muted-foreground h-7 w-7" title="Organization settings" asChild>
              <Link to="/organizations">
                <SettingsIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {!collapsed && (
        <div className="w-full max-w-full overflow-x-auto">
          {projects.length === 0 ? (
            <div className="text-muted-foreground px-4 py-6 text-center text-xs">No projects in this organization.</div>
          ) : (
            <DataTable columns={columns} data={projects} enableColumnResizing={false} onRowClick={canUpdate ? onEdit : undefined} emptyMessage="No projects in this organization." meta={tableMeta} />
          )}
        </div>
      )}
    </Card>
  );
}
