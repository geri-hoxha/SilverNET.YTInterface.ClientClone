import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { useOrganizations } from "@/features/organizations/hooks";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { useUserFromCache, useDeleteUser } from "../hooks";
import { userDetailRouteApi } from "../route";

const TABS = [
  { value: "general", label: "General" },
  { value: "workspace", label: "Workspace" },
  { value: "ai", label: "AI Features" },
  { value: "tags", label: "Tags and Saved Searches" },
  { value: "notifications", label: "Notifications" },
  { value: "groups", label: "Groups" },
  { value: "security", label: "Account Security" },
];

export function UserDetailPage() {
  const { id } = userDetailRouteApi.useParams();
  const navigate = useNavigate();
  const query = useUserFromCache(id);
  const orgsQ = useOrganizations();
  const delMut = useDeleteUser();
  const [tab, setTab] = useState("general");

  if (query.isError || !query.data) {
    return (
      <Card className="p-8 text-center space-y-3">
        <p className="text-sm font-medium">User not found</p>
        <p className="text-xs text-muted-foreground">
          Open this profile from the users list, or the user may be on another
          page of results.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/users">Back to users</Link>
        </Button>
      </Card>
    );
  }

  const user = query.data;
  const organization = (orgsQ.data ?? []).find(
    (o) => o.id === user.organizationId,
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon">
            <Link to="/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <UserAvatar
            name={user.fullName}
            seed={user.id}
            className="h-10 w-10"
          />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">
              {user.fullName}
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            delMut.mutate(user.id, {
              onSuccess: () => navigate({ to: "/users" }),
            });
          }}
          disabled={delMut.isPending}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete user
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 gap-1">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-3 py-2 -mb-px text-muted-foreground"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="pt-6">
          <div className="space-y-6 max-w-3xl">
            <ReadonlyField label="Full name" value={user.fullName} />
            <ReadonlyField label="Email" value={user.email} />
            <FieldRow label="Avatar">
              <UserAvatar
                name={user.fullName}
                seed={user.id}
                className="h-12 w-12 rounded-md"
              />
            </FieldRow>
            <ReadonlyField
              label="Organization"
              value={organization?.name ?? user.organizationId}
            />
            <ReadonlyField
              label="Status"
              value={user.isActive ? "Active" : "Inactive"}
            />
          </div>
        </TabsContent>

        {TABS.filter((t) => t.value !== "general").map((t) => (
          <TabsContent key={t.value} value={t.value} className="pt-6">
            <Card className="p-12 text-center text-sm text-muted-foreground">
              {t.label} settings coming soon.
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <FieldRow label={label}>
      <p className="text-sm pt-2">{value || "—"}</p>
    </FieldRow>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-6 items-start">
      <Label className="text-sm text-muted-foreground pt-2">{label}</Label>
      <div>{children}</div>
    </div>
  );
}
