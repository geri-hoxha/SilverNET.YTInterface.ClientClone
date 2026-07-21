import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, RefreshCw, Trash2 } from "lucide-react";

import { EntityLogo } from "@/components/common/EntityLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import type { Project } from "../../types";
import { ProjectOptionBadges } from "../ProjectOptionBadges";

export type ProjectsTableMeta = {
  canUpdate: boolean;
  canSync: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onSync: (projectId: string) => void;
  syncingProjectId?: string;
};

export function getProjectColumns(): ColumnDef<Project>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      enableSorting: false,
      enableResizing: false,
      size: 220,
      minSize: 140,
      maxSize: 400,
      header: "Project",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="flex min-w-0 items-center gap-2">
            <EntityLogo name={project.name} shortCode={project.youTrackProjectId} seed={project.id} size="sm" />
            <span className="min-w-0 truncate text-sm font-semibold">{project.name}</span>
          </div>
        );
      },
    },
    {
      id: "youTrackProjectId",
      accessorKey: "youTrackProjectId",
      enableSorting: false,
      enableResizing: false,
      size: 80,
      header: "YouTrack ID",
      cell: ({ row }) => (
        <Badge variant="outline" className="w-fit shrink-0 font-mono text-[10px]">
          {row.original.youTrackProjectId}
        </Badge>
      ),
    },
    {
      id: "isActive",
      accessorKey: "isActive",
      enableSorting: false,
      enableResizing: true,
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"} className="w-fit shrink-0 font-normal">
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "priorityOptions",
      accessorKey: "priorityOptions",
      enableSorting: false,
      enableResizing: false,
      header: "Priorities",
      minSize: 300,
      cell: ({ row }) => <ProjectOptionBadges mode="table" items={row.original.priorityOptions} emptyLabel="Not synced" />,
    },
    {
      id: "clientStates",
      accessorKey: "clientStates",
      enableSorting: false,
      enableResizing: false,
      header: "Workflow states",
      minSize: 500,
      cell: ({ row }) => <ProjectOptionBadges mode="table" items={row.original.clientStates} emptyLabel="Not synced" />,
    },
    {
      id: "actions",
      enableSorting: false,
      enableResizing: false,
      size: 88,
      minSize: 88,
      maxSize: 88,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row, table }) => {
        const meta = table.options.meta as ProjectsTableMeta | undefined;
        if (!meta) return null;

        const project = row.original;
        const syncing = meta.syncingProjectId === project.id;
        const showMenu = meta.canUpdate;

        return (
          <div className="flex shrink-0 items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
            {meta.canSync && (
              <Button
                variant="default"
                size="icon"
                onClick={() => meta.onSync(project.id)}
                disabled={syncing}
                title="Sync priorities and workflow states from YouTrack"
                aria-label={syncing ? "Syncing from YouTrack" : "Sync from YouTrack"}
                className="h-7 w-7 bg-green-600 text-white shadow-sm hover:bg-green-700"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              </Button>
            )}
            {showMenu && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="text-muted-foreground size-7 shadow-none">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => meta.onEdit(project)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>

                  <DropdownMenuItem variant="destructive" onClick={() => meta.onDelete(project)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      },
    },
  ];
}
