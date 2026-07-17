import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { MoreHorizontal, Pencil, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { TablePaginationToolbar } from "@/components/common/TablePaginationToolbar";
import { UserAvatar } from "@/components/common/UserAvatar";
import { PERMISSIONS, useAuth } from "@/features/auth";
import { useOrganizations } from "@/features/organizations/hooks";
import { useRoles } from "@/features/roles/hooks";
import { formatRoleLabel } from "@/features/roles/utils";
import { formatShortDate } from "@/shared/utils/format";
import { useCreateUser, useUsers } from "../hooks";
import { usersRouteApi } from "../route";
import { createUserSchema, usersSearchSchema, type CreateUserFormValues } from "../schemas";

export function UsersListPage() {
  const navigate = useNavigate({ from: "/users" });
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.usersCreate);
  const { page, pageSize } = usersRouteApi.useSearch();
  const [selection, setSelection] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);

  const query = useUsers({ page, pageSize });

  const items = query.data?.items ?? [];
  const allSelected = items.length > 0 && items.every((u) => selection[u.id]);
  const someSelected = items.some((u) => selection[u.id]);

  const setPage = (nextPage: number) =>
    navigate({
      search: (p: z.infer<typeof usersSearchSchema>) => ({ ...p, page: nextPage }),
    });

  const setPageSize = (nextPageSize: number) =>
    navigate({
      search: (p: z.infer<typeof usersSearchSchema>) => ({
        ...p,
        page: 1,
        pageSize: nextPageSize,
      }),
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm">Manage portal users, roles and access.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreating(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> New user
          </Button>
        )}
      </div>

      <Card className="overflow-x-auto">
        <Table className="min-w-[960px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(c) => {
                    const next: Record<string, boolean> = {};
                    if (c) items.forEach((u) => (next[u.id] = true));
                    setSelection(next);
                  }}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead className="w-40">Role</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-32">Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : query.isError ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <p className="text-destructive text-sm font-medium">Failed to load users</p>
                  <p className="text-muted-foreground mt-1 text-xs">{(query.error as Error)?.message}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => query.refetch()}>
                    Try again
                  </Button>
                </TableCell>
              </TableRow>
            ) : !items.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-12 text-center text-sm">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((user) => (
                <TableRow key={user.id} className="group">
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={!!selection[user.id]} onCheckedChange={(c) => setSelection((s) => ({ ...s, [user.id]: !!c }))} aria-label={`Select ${user.fullName}`} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.fullName} seed={user.id} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link to="/users/$id" params={{ id: user.id }} className="text-primary truncate font-medium hover:underline">
                            {user.fullName || user.email}
                          </Link>
                        </div>
                        {user.email && <p className="text-muted-foreground truncate text-xs">{user.email}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-sm">{user.organizationName ?? "—"}</TableCell>
                  <TableCell className="text-sm">{formatRoleLabel(user.role)}</TableCell>
                  <TableCell className="text-sm">
                    <span className={user.isActive ? "text-emerald-600" : "text-muted-foreground"}>{user.isActive ? "Active" : "Inactive"}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{formatShortDate(user.createdOnUtc)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link to="/users/$id" params={{ id: user.id }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit user profile
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {query.data && (
          <TablePaginationToolbar
            page={page}
            pageSize={pageSize}
            total={query.data.total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[25, 50, 100]}
            summary={someSelected ? <span>{Object.values(selection).filter(Boolean).length} selected ·</span> : undefined}
          />
        )}
      </Card>

      <UserFormDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function UserFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New user</DialogTitle>
          <DialogDescription>Create a portal user and assign an organization and role.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input type="email" placeholder="user@example.com" {...field} />
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
                    <Input type="password" placeholder="••••••••" {...field} />
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
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMut.isPending}>
                {createMut.isPending ? "Creating..." : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
