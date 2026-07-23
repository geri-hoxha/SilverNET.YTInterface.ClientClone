import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { useDeleteAttachment } from "../../../hooks";
import { IssueAttachment } from "../../../types";

type DeleteAttachmentDialogProps = {
  attachment: IssueAttachment;
};

function DeleteAttachmentsDialog({ attachment }: DeleteAttachmentDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(false);

  const deleteAttachmentMutation = useDeleteAttachment(attachment.issueId);

  const handleDelete = () => {
    deleteAttachmentMutation.mutate(
      { attachmentId: attachment.id, attachmentName: attachment.fileName },
      {
        onSuccess: () => setOpen(false),
      },
    );
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10! h-8 w-8 shrink-0"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${attachment.fileName}`}
      >
        <X className="h-4 w-4" />
      </Button>

      {isDesktop ? (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>&ldquo;{attachment.fileName}&rdquo;</strong> will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteAttachmentMutation.isPending}>Cancel</AlertDialogCancel>

              <AlertDialogAction className="bg-destructive! text-destructive-foreground! hover:bg-destructive/90!" disabled={deleteAttachmentMutation.isPending} onClick={handleDelete}>
                {deleteAttachmentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Delete attachment?</DrawerTitle>
              <DrawerDescription>
                <strong>&ldquo;{attachment.fileName}&rdquo;</strong> will be permanently deleted.
              </DrawerDescription>
            </DrawerHeader>

            <DrawerFooter>
              <Button type="button" variant="destructive" disabled={deleteAttachmentMutation.isPending} onClick={handleDelete}>
                Delete
              </Button>

              <Button type="button" variant="outline" disabled={deleteAttachmentMutation.isPending} onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}

export default DeleteAttachmentsDialog;
