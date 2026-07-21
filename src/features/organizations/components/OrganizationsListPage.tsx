import { useState } from "react";

import { PERMISSIONS, useAuth } from "@/features/auth";

import { useOrganizations } from "../hooks";
import type { Organization } from "../types";

import { PageHeader } from "@/components/common/PageHeader.tsx";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OrganizationsListCard } from "./OrganizationsListCard";
import { CreateOrgDialog } from "./dialogs/CreateOrgDialog";
import { DeleteOrgAlertDialog } from "./dialogs/DeleteOrgDialog";
import { EditOrgDialog } from "./dialogs/EditOrgDialog";

export function OrganizationsListPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.organizationsCreate);
  const canUpdate = hasPermission(PERMISSIONS.organizationsUpdate);

  const orgsQ = useOrganizations();

  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState<Organization | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<Organization | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <div className="space-y-4 p-3 md:p-6">
      <PageHeader
        title="Organizations"
        actions={
          canCreate ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" /> New organization
            </Button>
          ) : undefined
        }
      />

      <OrganizationsListCard
        organizations={orgsQ.data}
        isLoading={orgsQ.isLoading}
        isError={orgsQ.isError}
        errorMessage={(orgsQ.error as Error)?.message}
        canUpdate={canUpdate}
        onRetry={() => orgsQ.refetch()}
        onEdit={(org) => {
          setEditing(org);
          setEditDialogOpen(true);
        }}
        onDelete={(org) => {
          setConfirmDelete(org);
          setDeleteDialogOpen(true);
        }}
      />

      <CreateOrgDialog open={creating} onOpenChange={setCreating} />

      <EditOrgDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} organization={editing} />

      <DeleteOrgAlertDialog organization={confirmDelete} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />
    </div>
  );
}
