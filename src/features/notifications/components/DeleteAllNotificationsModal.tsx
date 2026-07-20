import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useMediaQuery } from "usehooks-ts";

type DeleteAllNotificationsModalProps = { open: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void; isPending: boolean };

function DeleteAllNotificationsModal({ open, onOpenChange, onConfirm, isPending }: DeleteAllNotificationsModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!isDesktop) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Delete All Notifications</DrawerTitle>
            <DrawerDescription>Are you sure you want to delete all notifications? This action cannot be undone.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="flex flex-row items-center gap-3 pt-2">
            <DrawerClose asChild className="flex-1">
              <Button variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DrawerClose>
            <Button variant="destructive" onClick={onConfirm} disabled={isPending} className="flex-1">
              {isPending ? "Deleting…" : "Yes, Delete"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete All Notifications</AlertDialogTitle>
          <AlertDialogDescription>Are you sure you want to delete all notifications? This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Deleting…" : "Yes, Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteAllNotificationsModal;
