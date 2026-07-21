import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMediaQuery } from "usehooks-ts";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizations } from "@/features/organizations/hooks";
import { useRoles } from "@/features/roles/hooks";
import { formatRoleLabel } from "@/features/roles/utils";

import { useCreateUser } from "../../hooks";
import {
  createUserSchema,
  type CreateUserFormValues,
} from "../../schemas";

type CreateUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateUserDialog({
  open,
  onOpenChange,
}: CreateUserDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const createMut = useCreateUser();
  const orgsQ = useOrganizations();
  const rolesQ = useRoles();

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      organizationId: "",
      role: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        email: "",
        fullName: "",
        password: "",
        organizationId: "",
        role: "",
      });
    }
  }, [open, form]);

  const onSubmit = (values: CreateUserFormValues) => {
    createMut.mutate(values, { onSuccess: () => onOpenChange(false) });
  };

  const formContent = (
    <Form {...form}>
      <form
        id="create-user-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Jane Smith" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="organizationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(orgsQ.data ?? []).map((o) => (
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
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(rolesQ.data ?? []).map((r) => (
                    <SelectItem key={r.name} value={r.name}>
                      {formatRoleLabel(r.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

  const submitLabel = createMut.isPending ? "Creating..." : "Create user";

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New user</DialogTitle>
            <DialogDescription>
              Create a portal user and assign an organization and role.
            </DialogDescription>
          </DialogHeader>
          {formContent}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-user-form"
              disabled={createMut.isPending}
            >
              {submitLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>New user</DrawerTitle>
          <DrawerDescription>
            Create a portal user and assign an organization and role.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4">{formContent}</div>
        <DrawerFooter className="pt-2">
          <Button
            type="submit"
            form="create-user-form"
            disabled={createMut.isPending}
          >
            {submitLabel}
          </Button>
          <DrawerClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}