import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatRoleLabel } from "@/features/roles/utils";
import { formatShortDate } from "@/shared/utils/format";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil } from "lucide-react";
import { PortalUser } from "../../types";

export function getUserColumns(): ColumnDef<PortalUser>[] {
  return [
    {
      id: "name",
      accessorFn: (row) => row.fullName || row.email,
      enableSorting: false,
      enableResizing: false,
      size: 260,
      minSize: 160,
      maxSize: 480,
      header: "Name",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar name={user.fullName} seed={user.id} />
            <div className="min-w-0">
              <Link to="/users/$id" params={{ id: user.id }} className="text-primary truncate font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                {user.fullName || user.email}
              </Link>
              {user.email && <p className="text-muted-foreground truncate text-xs">{user.email}</p>}
            </div>
          </div>
        );
      },
    },
    {
      id: "organization",
      accessorKey: "organizationName",
      enableSorting: false,
      enableResizing: false,
      size: 200,
      header: "Organization",
      cell: ({ row }) => (
        <div className="truncate text-sm" title={row.original.organizationName ?? undefined}>
          {row.original.organizationName ?? "—"}
        </div>
      ),
    },
    {
      id: "role",
      accessorKey: "role",
      enableResizing: false,
      enableSorting: false,
      size: 140,
      header: "Role",
      cell: ({ row }) => <span className="text-sm">{formatRoleLabel(row.original.role)}</span>,
    },
    {
      id: "status",
      accessorKey: "isActive",
      enableSorting: false,
      enableResizing: false,
      size: 100,
      header: "Status",
      cell: ({ row }) => <span className={row.original.isActive ? "text-sm text-emerald-600" : "text-muted-foreground text-sm"}>{row.original.isActive ? "Active" : "Inactive"}</span>,
    },
    {
      id: "created",
      accessorKey: "createdOnUtc",
      enableResizing: false,
      enableSorting: false,
      size: 120,
      header: "Created",
      cell: ({ row }) => <span className="text-muted-foreground text-sm whitespace-nowrap">{formatShortDate(row.original.createdOnUtc)}</span>,
    },
    {
      id: "actions",
      enableSorting: false,
      enableResizing: false,
      size: 48,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/users/$id" params={{ id: row.original.id }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit user profile
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}
