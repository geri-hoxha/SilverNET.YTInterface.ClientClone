import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { Organization } from "../types";
import { OrganizationListItem } from "./OrganizationsListItem";

export function OrganizationsListCard({
  organizations,
  isLoading,
  isError,
  errorMessage,
  canUpdate,
  onRetry,
  onEdit,
  onDelete,
}: {
  organizations?: Organization[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  canUpdate: boolean;
  onRetry: () => void;
  onEdit: (org: Organization) => void;
  onDelete: (org: Organization) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="text-muted-foreground grid grid-cols-[1fr_40px] gap-4 border-b px-4 py-2 text-xs font-medium tracking-wide uppercase">
        <div>Name</div>
        <div />
      </div>

      {isLoading ? (
        <div className="divide-y">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-4 py-3">
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="px-4 py-12 text-center">
          <p className="text-destructive text-sm font-medium">Failed to load organizations</p>
          <p className="text-muted-foreground mt-1 text-xs">{errorMessage}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : !organizations?.length ? (
        <div className="text-muted-foreground px-4 py-16 text-center text-sm">No organizations yet.</div>
      ) : (
        <div className="divide-y">
          {organizations.map((org) => (
            <OrganizationListItem key={org.id} org={org} canUpdate={canUpdate} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </Card>
  );
}
