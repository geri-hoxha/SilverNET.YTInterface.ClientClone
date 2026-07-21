import { useMediaQuery } from "usehooks-ts";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

import { useDeleteOrganization } from "../../hooks";
import type { Organization } from "../../types";

export function DeleteOrgAlertDialog({ organization, open, onOpenChange }: { organization: Organization | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const deleteMut = useDeleteOrganization();

  const handleDelete = () => {
    if (organization) deleteMut.mutate(organization.id);
    onOpenChange(false);
  };

  const title = `Delete ${organization?.name}?`;
  const description = "This will permanently delete the organization. Projects belonging to it must be removed or reassigned first.";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="gap-2 pt-2">
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
