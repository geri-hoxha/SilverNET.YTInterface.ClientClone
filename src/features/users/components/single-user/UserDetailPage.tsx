import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PERMISSIONS, useAuth } from "@/features/auth";

import { useUser } from "../../hooks";
import { userDetailRouteApi } from "../../route";
import { UserDetailHeader } from "./UserDetailHeader";
import { UserGeneralSection } from "./UserGeneralSelection";

export function UserDetailPage() {
  const { id } = userDetailRouteApi.useParams();
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission(PERMISSIONS.usersUpdate);
  const query = useUser(id);
  const [editing, setEditing] = useState(false);

  if (query.isLoading) {
    return <UserDetailSkeleton />;
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

  return (
    <div className="max-w-5xl space-y-6 p-3 md:p-6">
      <UserDetailHeader user={user} canUpdate={canUpdate} editing={editing} onEdit={() => setEditing(true)} />

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
          <UserGeneralSection user={user} editing={editing} onEditingChange={setEditing} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="max-w-5xl space-y-6 p-3 md:p-6">
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
