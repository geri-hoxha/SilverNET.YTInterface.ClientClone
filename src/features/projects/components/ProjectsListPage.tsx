import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
} from "../hooks";
import {
  projectFormSchema as formSchema,
  type ProjectFormValues as FormValues,
} from "../schemas";
import { groupProjectsByOrganization } from "../utils";
import { EntityLogo } from "@/shared/components/EntityLogo";
import type { Project } from "../types";
import type { Organization } from "@/features/organizations/types";

export function ProjectsListPage() {
  const orgsQ = useOrganizations();
  const projectsQ = useProjects();
  const syncMut = useSyncPriorities();
  const deleteMut = useDeleteProject();

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState<{ organizationId?: string } | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

  const grouped = useMemo(
    () => groupProjectsByOrganization(orgsQ.data ?? [], projectsQ.data ?? []),
    [orgsQ.data, projectsQ.data],
  );

  const loading = orgsQ.isLoading || projectsQ.isLoading;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
        <Button onClick={() => setCreating({})}>
          <Plus className="mr-2 h-4 w-4" /> New project
        </Button>
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
                  <div>
                    {projects.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                        No projects in this organization.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(7rem,auto)_minmax(5.5rem,auto)_minmax(10rem,1fr)_minmax(0,1.2fr)_auto] items-center gap-x-6 gap-y-3 border-b bg-muted/20 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          <span>Project</span>
                          <span>YouTrack ID</span>
                          <span>Status</span>
                          <span>Priorities</span>
                          <span>Workflow states</span>
                          <span className="text-right">Actions</span>
                        </div>
                        <div className="divide-y">
                          {projects.map((project) => (
                            <ProjectRow
                              key={project.id}
                              project={project}
                              onEdit={() => setEditing(project)}
                              onDelete={() => setConfirmDelete(project)}
                              onSync={() => syncMut.mutate(project.id)}
                              syncing={
                                syncMut.isPending &&
                                syncMut.variables === project.id
                              }
                            />
                          ))}
                        </div>
                      </>
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
  onEdit: () => void;
  onDelete: () => void;
  onSync: () => void;
  syncing: boolean;
}) {
  return (
    <div
      className="group grid grid-cols-[minmax(0,1.4fr)_minmax(7rem,auto)_minmax(5.5rem,auto)_minmax(10rem,1fr)_minmax(0,1.2fr)_auto] items-center gap-x-6 gap-y-3 px-4 py-3 transition-colors hover:bg-accent/40 cursor-pointer"
      onClick={onEdit}
    >
      <div className="flex min-w-0 items-center gap-3">
        <EntityLogo
          name={project.name}
          shortCode={project.youTrackProjectId}
          seed={project.id}
          size="md"
        />
        <span className="min-w-0 truncate font-semibold">{project.name}</span>
      </div>

      <Badge variant="outline" className="w-fit font-mono text-[10px]">
        {project.youTrackProjectId}
      </Badge>

      <Badge
        variant={project.isActive ? "default" : "secondary"}
        className="w-fit font-normal"
      >
        {project.isActive ? "Active" : "Inactive"}
      </Badge>

      <ProjectOptionBadges
        items={project.priorityOptions}
        emptyLabel="Not synced"
      />

      <ProjectOptionBadges
        items={project.clientStates}
        emptyLabel="Not synced"
      />

      <div
        className="flex shrink-0 items-center justify-end gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="default"
          size="sm"
          onClick={onSync}
          disabled={syncing}
          title="Sync priorities and workflow states from YouTrack"
          className="bg-green-600 font-medium text-white shadow-sm hover:bg-green-700"
        >
          <RefreshCw
            className={`mr-1.5 h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Syncing…" : "Sync"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
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

function ProjectOptionBadges({
  items,
  emptyLabel,
}: {
  items: string[];
  emptyLabel: string;
}) {
  if (!items.length) {
    return (
      <span className="text-xs text-muted-foreground italic">{emptyLabel}</span>
    );
  }

  return (
    <div className="flex max-h-16 flex-wrap gap-1 overflow-hidden">
      {items.map((item) => (
        <Badge
          key={item}
          variant="secondary"
          className="max-w-full truncate font-normal text-[10px]"
          title={item}
        >
          {item}
        </Badge>
      ))}
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
      createMut.mutate(
        {
          organizationId: values.organizationId,
          name: values.name,
          youTrackProjectId: values.youTrackProjectId,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else if (project) {
      updateMut.mutate(
        {
          name: values.name,
          youTrackProjectId: values.youTrackProjectId,
          isActive: values.isActive,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  };

  const organizationName =
    organizations.find((o) => o.id === project?.organizationId)?.name ?? "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
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
            {mode === "edit" && (
              <>
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

                {project && (
                  <div className="space-y-4 rounded-md border bg-muted/30 p-4">
                    <ProjectDetailReadonly
                      label="Project ID"
                      value={project.id}
                      mono
                    />
                    <ProjectDetailReadonly
                      label="Organization"
                      value={organizationName}
                    />
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Priorities ({project.priorityOptions.length})
                      </p>
                      <ProjectOptionBadges
                        items={project.priorityOptions}
                        emptyLabel="Not synced yet — use Sync on the projects list"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Workflow states ({project.clientStates.length})
                      </p>
                      <ProjectOptionBadges
                        items={project.clientStates}
                        emptyLabel="Not synced yet — use Sync on the projects list"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
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

function ProjectDetailReadonly({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={`text-sm break-all ${mono ? "font-mono text-xs" : ""}`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}
