import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useOrganizations } from "@/features/organizations/hooks";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useSyncPriorities,
  useUpdateProject,
} from "@/features/projects/hooks";
import { EntityLogo } from "@/shared/components/EntityLogo";
import type { Project } from "@/features/projects/types";
import type { Organization } from "@/features/organizations/types";

export const Route = createFileRoute("/_authenticated/projects/")({
  component: ProjectsListPage,
});

const formSchema = z.object({
  organizationId: z.string().uuid("Select an organization"),
  name: z.string().min(1, "Name is required").max(120),
  youTrackProjectId: z.string().min(1, "YouTrack short name required").max(20),
  isActive: z.boolean().default(true),
});
type FormValues = z.infer<typeof formSchema>;

function ProjectsListPage() {
  const orgsQ = useOrganizations();
  const projectsQ = useProjects();
  const syncMut = useSyncPriorities();
  const deleteMut = useDeleteProject();

  const [filter, setFilter] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState<{ organizationId?: string } | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

  const grouped = useMemo(() => {
    const orgs = orgsQ.data ?? [];
    const projects = projectsQ.data ?? [];
    const f = filter.trim().toLowerCase();
    return orgs.map((org) => ({
      org,
      projects: projects
        .filter((p) => p.organizationId === org.id)
        .filter(
          (p) =>
            !f ||
            p.name.toLowerCase().includes(f) ||
            p.youTrackProjectId.toLowerCase().includes(f),
        ),
    }));
  }, [orgsQ.data, projectsQ.data, filter]);

  const loading = orgsQ.isLoading || projectsQ.isLoading;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter projects by name or ID"
              className="w-[280px] pl-8"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Button onClick={() => setCreating({})}>
            <Plus className="mr-2 h-4 w-4" /> New project
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="p-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      ) : orgsQ.isError || projectsQ.isError ? (
        <Card className="py-12 text-center">
          <p className="text-sm font-medium text-destructive">
            Failed to load data
          </p>
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
        <Card className="py-16 text-center text-sm text-muted-foreground">
          No organizations found. Create an organization first.
        </Card>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ org, projects }) => {
            const isCollapsed = collapsed[org.id];
            return (
              <Card key={org.id} className="overflow-hidden">
                <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      setCollapsed((c) => ({ ...c, [org.id]: !c[org.id] }))
                    }
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  <EntityLogo name={org.name} seed={org.id} size="sm" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {org.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {projects.length}{" "}
                    {projects.length === 1 ? "project" : "projects"}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCreating({ organizationId: org.id })}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add project
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      title="Organization settings"
                      asChild
                    >
                      <Link to="/organizations">
                        <SettingsIcon className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="divide-y">
                    {projects.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                        No projects in this organization.
                      </div>
                    ) : (
                      projects.map((project) => (
                        <ProjectRow
                          key={project.id}
                          project={project}
                          org={org}
                          onEdit={() => setEditing(project)}
                          onDelete={() => setConfirmDelete(project)}
                          onSync={() => syncMut.mutate(project.id)}
                          syncing={
                            syncMut.isPending &&
                            syncMut.variables === project.id
                          }
                        />
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ProjectFormDialog
        open={!!creating}
        onOpenChange={(o) => !o && setCreating(null)}
        mode="create"
        defaultOrganizationId={creating?.organizationId}
        organizations={orgsQ.data ?? []}
      />
      <ProjectFormDialog
        key={editing?.id ?? "edit"}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        mode="edit"
        project={editing}
        organizations={orgsQ.data ?? []}
      />

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete project {confirmDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Existing issues will become
              unlinked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete) deleteMut.mutate(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProjectRow({
  project,
  onEdit,
  onDelete,
  onSync,
  syncing,
}: {
  project: Project;
  org: Organization;
  onEdit: () => void;
  onDelete: () => void;
  onSync: () => void;
  syncing: boolean;
}) {
  return (
    <div
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40 cursor-pointer"
      onClick={onEdit}
    >
      <EntityLogo
        name={project.name}
        shortCode={project.youTrackProjectId}
        seed={project.id}
        size="md"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold truncate">{project.name}</span>
          <Badge variant="outline" className="font-mono text-[10px]">
            {project.youTrackProjectId}
          </Badge>
          {!project.isActive && (
            <Badge variant="secondary" className="font-normal">
              inactive
            </Badge>
          )}
        </div>
        {project.priorityOptions.length > 0 && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Priorities: {project.priorityOptions.join(", ")}
          </p>
        )}
      </div>
      <div
        className="flex items-center gap-1 opacity-0 group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onSync}
          disabled={syncing}
          title="Sync priorities from YouTrack"
        >
          <RefreshCw
            className={`mr-1 h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`}
          />
          Sync
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function ProjectFormDialog({
  open,
  onOpenChange,
  mode,
  project,
  defaultOrganizationId,
  organizations,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  project?: Project | null;
  defaultOrganizationId?: string;
  organizations: Organization[];
}) {
  const createMut = useCreateProject();
  const updateMut = useUpdateProject(project?.id ?? "");
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationId:
        project?.organizationId ?? defaultOrganizationId ?? "",
      name: project?.name ?? "",
      youTrackProjectId: project?.youTrackProjectId ?? "",
      isActive: project?.isActive ?? true,
    },
  });
  const pending = createMut.isPending || updateMut.isPending;

  const onSubmit = (values: FormValues) => {
    if (mode === "create") {
      createMut.mutate(values, { onSuccess: () => onOpenChange(false) });
    } else if (project) {
      const { organizationId: _omit, ...rest } = values;
      void _omit;
      updateMut.mutate(rest, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New project" : "Edit project"}
          </DialogTitle>
          <DialogDescription>
            Projects are linked to a YouTrack project by short ID.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={mode === "edit"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {organizations.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Sigal Life Development" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="youTrackProjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTrack project ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. SLD"
                      className="font-mono uppercase"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <FormLabel className="text-sm">Active</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Inactive projects are hidden from issue creation.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : mode === "create" ? "Create" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
