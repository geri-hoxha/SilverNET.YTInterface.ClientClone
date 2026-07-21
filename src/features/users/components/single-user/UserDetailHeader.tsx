import { Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";

import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { PortalUser } from "../../types";

type UserDetailHeaderProps = {
  user: PortalUser;
  canUpdate: boolean;
  editing: boolean;
  onEdit: () => void;
};

export function UserDetailHeader({ user, canUpdate, editing, onEdit }: UserDetailHeaderProps) {
  return (
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
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" /> Edit user
        </Button>
      )}
    </div>
  );
}
