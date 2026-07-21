import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMediaQuery } from "usehooks-ts";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Organization } from "@/features/organizations/types";

import { useCreateProject, useUpdateProject } from "../../hooks";
import { projectFormSchema as formSchema, type ProjectFormValues as FormValues } from "../../schemas";
import type { Project } from "../../types";
import { ProjectDetailReadonly } from "../ProjectDetailReadOnly";
import { ProjectOptionBadges } from "../ProjectOptionBadges";

export function ProjectFormDialog({
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
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const createMut = useCreateProject();
  const updateMut = useUpdateProject(project?.id ?? "");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationId: project?.organizationId ?? defaultOrganizationId ?? "",
      name: project?.name ?? "",
      youTrackProjectId: project?.youTrackProjectId ?? "",
      isActive: project?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        organizationId: project?.organizationId ?? defaultOrganizationId ?? "",
        name: project?.name ?? "",
        youTrackProjectId: project?.youTrackProjectId ?? "",
        isActive: project?.isActive ?? true,
      });
    }
  }, [open, project, defaultOrganizationId, form]);

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

  const organizationName = organizations.find((o) => o.id === project?.organizationId)?.name ?? "—";

  const title = mode === "create" ? "New project" : "Edit project";
  const description = "Projects are linked to a YouTrack project by short ID.";

  const formFields = (
    <>
      <FormField
        control={form.control}
        name="organizationId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Organization</FormLabel>
            <Select value={field.value || undefined} onValueChange={field.onChange} disabled={mode === "edit"}>
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
              <Input placeholder="e.g. SLD" className="font-mono uppercase" {...field} />
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
                  <p className="text-muted-foreground text-xs">Inactive projects are hidden from issue creation.</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {project && (
            <div className="bg-muted/30 space-y-4 rounded-md border p-4">
              <ProjectDetailReadonly label="Project ID" value={project.id} mono />
              <ProjectDetailReadonly label="Organization" value={organizationName} />
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-muted-foreground mb-2 text-xs font-medium">Priorities ({project.priorityOptions.length})</p>
                <ProjectOptionBadges mode="modal" items={project.priorityOptions} emptyLabel="Not synced yet — use Sync on the projects list" />
              </div>
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium">Workflow states ({project.clientStates.length})</p>
                <ProjectOptionBadges mode="modal" items={project.clientStates} emptyLabel="Not synced yet — use Sync on the projects list" />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  const submitLabel = pending ? "Saving..." : mode === "create" ? "Create" : "Save";

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {formFields}
        {isDesktop ? (
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {submitLabel}
            </Button>
          </DialogFooter>
        ) : (
          <DrawerFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {submitLabel}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DrawerFooter>
        )}
      </form>
    </Form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent hasHandle className="max-h-[90dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-4">{formContent}</div>
      </DrawerContent>
    </Drawer>
  );
}
