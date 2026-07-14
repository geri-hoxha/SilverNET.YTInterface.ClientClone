import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { useOrganizations } from "@/features/organizations/hooks";
import { useRoles } from "@/features/roles/hooks";
import { formatRoleLabel } from "@/features/roles/utils";
import { PERMISSIONS, useAuth } from "@/features/auth";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { useUser, useUpdateUser } from "../hooks";
import { userDetailRouteApi } from "../route";

export function UserDetailPage() {
  const { id } = userDetailRouteApi.useParams();
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission(PERMISSIONS.usersUpdate);
  const query = useUser(id);
  const orgsQ = useOrganizations();
  const rolesQ = useRoles();
  const updateMut = useUpdateUser(id);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [role, setRole] = useState("");

  useEffect(() => {
    if (query.data && !editing) {
      setFullName(query.data.fullName);
      setIsActive(query.data.isActive);
      setRole(query.data.role ?? "");
    }
  }, [query.data, editing]);

  if (query.isLoading) {
    return (
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full max-w-3xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Card className="space-y-3 p-8 text-center">
        <p className="text-sm font-medium">User not found</p>
        <p className="text-muted-foreground text-xs">{(query.error as Error)?.message ?? "This user may have been removed or you may not have access."}</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/users">Back to users</Link>
        </Button>
      </Card>
    );
  }

  const user = query.data;
  const organization = (orgsQ.data ?? []).find((o) => o.id === user.organizationId);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <UserAvatar name={user.fullName} seed={user.id} className="h-10 w-10" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">{user.fullName}</h1>
            <p className="text-muted-foreground truncate text-xs">{user.email}</p>
          </div>
        </div>
        {!editing && canUpdate && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit user
          </Button>
        )}
      </div>

      <Tabs value="general">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="general"
            className="data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground -mb-px rounded-none px-3 py-2 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="pt-6">
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFullName(user.fullName);
                    setIsActive(user.isActive);
                    setRole(user.role ?? "");
                    setEditing(false);
                  }}
                  disabled={updateMut.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={updateMut.isPending || !fullName.trim() || !role}
                  onClick={() => {
                    updateMut.mutate(
                      {
                        fullName: fullName.trim(),
                        isActive,
                        role,
                      },
                      { onSuccess: () => setEditing(false) },
                    );
                  }}
                >
                  {updateMut.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <FieldRow label={label}>
      <p className="pt-2 text-sm">{value || "—"}</p>
    </FieldRow>
  );
}

function FieldRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-[180px_1fr] md:gap-6">
      <Label className="text-muted-foreground pt-2 text-sm">{label}</Label>
      <div>{children}</div>
    </div>
  );
}
