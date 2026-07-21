import { useEffect, useState } from "react";

import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganizations } from "@/features/organizations/hooks";
import { useRoles } from "@/features/roles/hooks";
import { formatRoleLabel } from "@/features/roles/utils";
import { useUpdateUser } from "../../hooks";
import { PortalUser } from "../../types";
import { FieldRow, ReadonlyField } from "./details-fields";

type UserGeneralSectionProps = {
  user: PortalUser;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
};

export function UserGeneralSection({ user, editing, onEditingChange }: UserGeneralSectionProps) {
  const orgsQ = useOrganizations();
  const rolesQ = useRoles();
  const updateMut = useUpdateUser(user.id);

  const [fullName, setFullName] = useState(user.fullName);
  const [isActive, setIsActive] = useState(user.isActive);
  const [role, setRole] = useState(user.role ?? "");

  useEffect(() => {
    if (!editing) {
      setFullName(user.fullName);
      setIsActive(user.isActive);
      setRole(user.role ?? "");
    }
  }, [user, editing]);

  const organization = (orgsQ.data ?? []).find((o) => o.id === user.organizationId);

  const handleCancel = () => {
    setFullName(user.fullName);
    setIsActive(user.isActive);
    setRole(user.role ?? "");
    onEditingChange(false);
  };

  const handleSave = () => {
    updateMut.mutate(
      {
        fullName: fullName.trim(),
        isActive,
        role,
      },
      { onSuccess: () => onEditingChange(false) },
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      {editing ? (
        <>
          <FieldRow label="Full name">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
          </FieldRow>
          <ReadonlyField label="Email" value={user.email} />
          <FieldRow label="Role">
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {(rolesQ.data ?? []).map((r) => (
                  <SelectItem key={r.name} value={r.name}>
                    {formatRoleLabel(r.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Status">
            <Select value={isActive ? "active" : "inactive"} onValueChange={(v) => setIsActive(v === "active")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
        </>
      ) : (
        <>
          <ReadonlyField label="Full name" value={user.fullName} />
          <ReadonlyField label="Email" value={user.email} />
          <ReadonlyField label="Role" value={user.role ? formatRoleLabel(user.role) : "—"} />
        </>
      )}

      <FieldRow label="Avatar">
        <UserAvatar name={user.fullName} seed={user.id} className="h-12 w-12 rounded-md" />
      </FieldRow>

      <ReadonlyField label="Organization" value={user.organizationName ?? organization?.name ?? user.organizationId} />

      {!editing && <ReadonlyField label="Status" value={user.isActive ? "Active" : "Inactive"} />}

      {editing && (
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={handleCancel} disabled={updateMut.isPending}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={updateMut.isPending || !fullName.trim() || !role} onClick={handleSave}>
            {updateMut.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}
