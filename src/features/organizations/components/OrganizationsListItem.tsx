import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { EntityLogo } from "@/components/common/EntityLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import type { Organization } from "../types";

export function OrganizationListItem({ org, canUpdate, onEdit, onDelete }: { org: Organization; canUpdate: boolean; onEdit: (org: Organization) => void; onDelete: (org: Organization) => void }) {
  return (
    <div
      className={cn("group grid grid-cols-[1fr_40px] items-center gap-4 px-4 py-3 transition-colors", canUpdate ? "hover:bg-accent/40 cursor-pointer" : "cursor-default")}
      onClick={canUpdate ? () => onEdit(org) : undefined}
    >
      <div className="flex min-w-0 items-center gap-3">
        <EntityLogo name={org.name} seed={org.id} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">{org.name}</span>
            {!org.isActive && (
              <Badge variant="secondary" className="font-normal">
                inactive
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="text-right" onClick={(e) => e.stopPropagation()}>
        {canUpdate && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(org)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(org)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
