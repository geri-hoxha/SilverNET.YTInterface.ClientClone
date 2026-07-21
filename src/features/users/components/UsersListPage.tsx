import { useNavigate } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import type { z } from "zod";

import { TablePaginationToolbar } from "@/components/common/TablePaginationToolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PERMISSIONS, useAuth } from "@/features/auth";

import { PageHeader } from "@/components/common/PageHeader.tsx";
import { DataTable } from "@/components/common/table/DataTable";
import { useUsers } from "../hooks";
import { usersRouteApi } from "../route";
import { usersSearchSchema } from "../schemas";
import { PortalUser } from "../types";
import { CreateUserDialog } from "./dialogs/CreateUserDialog";
import { getUserColumns } from "./table/users-columns";

export function UsersListPage() {
  const navigate = useNavigate({ from: "/users" });
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.usersCreate);
  const { page, pageSize } = usersRouteApi.useSearch();
  const [creating, setCreating] = useState(false);

  const query = useUsers({ page, pageSize });
  const items = query.data?.items ?? [];
  const columns = useMemo(() => getUserColumns(), []);

  const setPage = (nextPage: number) =>
    navigate({
      search: (p: z.infer<typeof usersSearchSchema>) => ({
        ...p,
        page: nextPage,
      }),
    });

  const setPageSize = (nextPageSize: number) =>
    navigate({
      search: (p: z.infer<typeof usersSearchSchema>) => ({
        ...p,
        page: 1,
        pageSize: nextPageSize,
      }),
    });

  const handleRowClick = (user: PortalUser) => {
    navigate({ to: "/users/$id", params: { id: user.id } });
  };

  return (
    <div className="space-y-4 p-3 md:p-6">
      <PageHeader
        title="Users"
        description="Manage portal users, roles and access."
        actions={
          canCreate ? (
            <Button onClick={() => setCreating(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> New user
            </Button>
          ) : undefined
        }
      />

      <Card className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={items}
          isLoading={query.isLoading}
          isError={query.isError}
          isFetching={query.isFetching}
          onRetry={() => query.refetch()}
          onRowClick={handleRowClick}
          emptyMessage="No users found."
          skeletonRows={8}
          enableColumnResizing
        />

        {query.data && <TablePaginationToolbar page={page} pageSize={pageSize} total={query.data.total} onPageChange={setPage} onPageSizeChange={setPageSize} pageSizeOptions={[25, 50, 100]} />}
      </Card>

      <CreateUserDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
