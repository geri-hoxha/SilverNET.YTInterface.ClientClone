import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import {
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { useUsers, useBanUser, useDeleteUser } from "@/features/users/hooks";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { formatShortDate } from "@/shared/utils/format";
import type { PortalRole } from "@/features/auth/types";

const searchSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  q: z.string().optional(),
  role: z.enum(["SuperAdmin", "OrganizationAdmin", "OrganizationUser"]).optional(),
  banned: z.boolean().optional(),
  sort: z.enum(["name", "registrationDate"]).default("registrationDate"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const Route = createFileRoute("/_authenticated/users/")({
  validateSearch: zodValidator(searchSchema),
  component: UsersListPage,
});

function UsersListPage() {
  const navigate = useNavigate({ from: "/users" });
  const { page, pageSize, q, role, banned, sort, order } = Route.useSearch();
  const [searchText, setSearchText] = useState(q ?? "");
  const [selection, setSelection] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const query = useUsers({ page, pageSize, search: q, role, banned, sort, order });
  const banMut = useBanUser();
  const delMut = useDeleteUser();

  const updateSearch = (patch: Partial<z.infer<typeof searchSchema>>) =>
    navigate({
      search: (prev: z.infer<typeof searchSchema>) => ({
        ...prev,
        ...patch,
        page: 1,
      }),
    });

  const toggleSort = (col: "name" | "registrationDate") => {
    if (sort === col) {
      navigate({
        search: (p: z.infer<typeof searchSchema>) => ({
          ...p,
          order: order === "asc" ? "desc" : "asc",
        }),
      });
    } else {
      updateSearch({ sort: col, order: "asc" });
    }
  };

  const items = query.data?.items ?? [];
  const allSelected = items.length > 0 && items.every((u) => selection[u.id]);
  const someSelected = items.some((u) => selection[u.id]);

  const totalPages = query.data
    ? Math.max(1, Math.ceil(query.data.total / pageSize))
    : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage portal users, roles and access.
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" /> New user
        </Button>
      </div>

      <Card className="p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateSearch({ q: searchText || undefined });
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              className="pl-8"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <Select
            value={role ?? "all"}
            onValueChange={(v) =>
              updateSearch({ role: v === "all" ? undefined : (v as PortalRole) })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="SuperAdmin">Super Admin</SelectItem>
              <SelectItem value="OrganizationAdmin">Organization Admin</SelectItem>
              <SelectItem value="OrganizationUser">Organization User</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={banned === undefined ? "all" : banned ? "banned" : "active"}
            onValueChange={(v) =>
              updateSearch({
                banned: v === "all" ? undefined : v === "banned",
              })
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </form>
      </Card>

      <Card>
        <Table>
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
              <TableHead>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-medium text-foreground"
                  onClick={() => toggleSort("name")}
                >
                  Name
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </TableHead>
              <TableHead className="w-48">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-medium text-foreground"
                  onClick={() => toggleSort("registrationDate")}
                >
                  Registration Date
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : query.isError ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <p className="text-sm font-medium text-destructive">
                    Failed to load users
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(query.error as Error)?.message}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => query.refetch()}
                  >
                    Try again
                  </Button>
                </TableCell>
              </TableRow>
            ) : !items.length ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-12 text-sm text-muted-foreground"
                >
                  No users match your filters.
                </TableCell>
              </TableRow>
            ) : (
              items.map((user) => (
                <TableRow key={user.id} className="group">
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={!!selection[user.id]}
                      onCheckedChange={(c) =>
                        setSelection((s) => ({ ...s, [user.id]: !!c }))
                      }
                      aria-label={`Select ${user.fullName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={user.fullName}
                        src={user.avatarUrl ?? undefined}
                        seed={user.id}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            to="/users/$id"
                            params={{ id: user.id }}
                            className="font-medium text-primary hover:underline truncate"
                          >
                            {user.fullName || user.username}
                          </Link>
                          {user.banned && (
                            <Badge variant="secondary" className="font-normal">
                              banned
                            </Badge>
                          )}
                        </div>
                        {user.email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatShortDate(user.registrationDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 text-muted-foreground"
                        >
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
                        <DropdownMenuItem
                          onClick={() =>
                            banMut.mutate({
                              id: user.id,
                              banned: !!user.banned,
                            })
                          }
                        >
                          {user.banned ? (
                            <>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Unban user
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              Ban user
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setConfirmDelete(user.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {query.data && query.data.total > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {someSelected
                ? `${Object.values(selection).filter(Boolean).length} selected · `
                : ""}
              Page {page} of {totalPages} · {query.data.total} total
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() =>
                  navigate({
                    search: (p: z.infer<typeof searchSchema>) => ({
                      ...p,
                      page: page - 1,
                    }),
                  })
                }
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() =>
                  navigate({
                    search: (p: z.infer<typeof searchSchema>) => ({
                      ...p,
                      page: page + 1,
                    }),
                  })
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the user from the portal. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete) delMut.mutate(confirmDelete);
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
