import { useState } from "react";
import { HelpCircle, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
} from "../hooks";
import {
  createOrganizationSchema as createFormSchema,
  editOrganizationSchema as editFormSchema,
  type CreateOrganizationFormValues as CreateFormValues,
  type EditOrganizationFormValues as EditFormValues,
} from "../schemas";
import { EntityLogo } from "@/shared/components/EntityLogo";
import type { Organization } from "../types";

export function OrganizationsListPage() {
  const orgsQ = useOrganizations();
  const [editing, setEditing] = useState<Organization | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Organization | null>(null);
  const deleteMut = useDeleteOrganization();

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
        <div className="grid grid-cols-[1fr_40px] gap-4 border-b px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <div>Name</div>
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
            {orgsQ.data.map((org) => (
                <div
                  key={org.id}
                  className="group grid grid-cols-[1fr_40px] items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/40 cursor-pointer"
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
                    </div>
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
            ))}
          </div>
        )}
      </Card>

      <CreateOrgDialog open={creating} onOpenChange={setCreating} />
      <EditOrgDialog
        key={editing?.id ?? "edit"}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
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

function CreateOrgDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createMut = useCreateOrganization();
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: { name: "" },
  });
  const pending = createMut.isPending;

  const onSubmit = (values: CreateFormValues) => {
    createMut.mutate(values, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New organization</DialogTitle>
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
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditOrgDialog({
  open,
  onOpenChange,
  organization,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
}) {
  const updateMut = useUpdateOrganization(organization?.id ?? "");
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: organization?.name ?? "",
      isActive: organization?.isActive ?? true,
    },
  });
  const pending = updateMut.isPending;

  const onSubmit = (values: EditFormValues) => {
    if (!organization) return;
    updateMut.mutate(values, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit organization</DialogTitle>
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
                {pending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
