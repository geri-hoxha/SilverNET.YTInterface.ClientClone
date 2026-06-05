import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { HelpCircle, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  useCreateOrganization,
  useDeleteOrganization,
  useOrganizations,
  useUpdateOrganization,
} from "@/features/organizations/hooks";
import { useProjects } from "@/features/projects/hooks";
import { EntityLogo } from "@/shared/components/EntityLogo";
import type { Organization } from "@/features/organizations/types";

export const Route = createFileRoute("/_authenticated/organizations/")({
  component: OrganizationsListPage,
});

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional(),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof formSchema>;

function OrganizationsListPage() {
  const orgsQ = useOrganizations();
  const projectsQ = useProjects();
  const [editing, setEditing] = useState<Organization | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Organization | null>(null);
  const deleteMut = useDeleteOrganization();

  const projectsByOrg = useMemo(() => {
    const map = new Map<string, string[]>();
    (projectsQ.data ?? []).forEach((p) => {
      const arr = map.get(p.organizationId) ?? [];
      arr.push(p.name);
      map.set(p.organizationId, arr);
    });
    return map;
  }, [projectsQ.data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">
            Organizations
          </h1>
          <HelpCircle className="h-4 w-4 text-primary" />
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> New organization
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_40px] gap-4 border-b px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <div>Name</div>
          <div>Projects</div>
          <div />
        </div>

        {orgsQ.isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : orgsQ.isError ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-destructive">
              Failed to load organizations
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(orgsQ.error as Error)?.message}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => orgsQ.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : !orgsQ.data?.length ? (
          <div className="px-4 py-16 text-center text-sm text-muted-foreground">
            No organizations yet.
          </div>
        ) : (
          <div className="divide-y">
            {orgsQ.data.map((org) => {
              const projectNames = projectsByOrg.get(org.id) ?? [];
              return (
                <div
                  key={org.id}
                  className="group grid grid-cols-[1fr_1fr_40px] items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/40 cursor-pointer"
                  onClick={() => setEditing(org)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <EntityLogo name={org.name} seed={org.id} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold">
                          {org.name}
                        </span>
                        {!org.isActive && (
                          <Badge variant="secondary" className="font-normal">
                            inactive
                          </Badge>
                        )}
                      </div>
                      {org.description && (
                        <p className="truncate text-xs text-muted-foreground">
                          {org.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="truncate text-sm text-muted-foreground">
                    {projectNames.join(", ")}
                  </div>
                  <div
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => setEditing(org)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setConfirmDelete(org)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <OrgFormDialog
        open={creating}
        onOpenChange={setCreating}
        mode="create"
      />
      <OrgFormDialog
        key={editing?.id ?? "edit"}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        mode="edit"
        organization={editing}
      />

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {confirmDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the organization. Projects belonging
              to it must be removed or reassigned first.
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

function OrgFormDialog({
  open,
  onOpenChange,
  mode,
  organization,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  organization?: Organization | null;
}) {
  const createMut = useCreateOrganization();
  const updateMut = useUpdateOrganization(organization?.id ?? "");
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: organization?.name ?? "",
      description: organization?.description ?? "",
      isActive: organization?.isActive ?? true,
    },
  });
  const pending = createMut.isPending || updateMut.isPending;

  const onSubmit = (values: FormValues) => {
    if (mode === "create") {
      createMut.mutate(values, { onSuccess: () => onOpenChange(false) });
    } else if (organization) {
      updateMut.mutate(values, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New organization" : "Edit organization"}
          </DialogTitle>
          <DialogDescription>
            Organizations group related projects and users.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. SIGAL Insurance Group"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Short description"
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
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
                      Inactive organizations are hidden from most views.
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
