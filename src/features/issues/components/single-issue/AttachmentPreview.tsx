import { useMediaQuery } from "usehooks-ts";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

type AttachmentPreviewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  imageUrl: string | null;
};

export function AttachmentPreview({ open, onOpenChange, fileName, imageUrl }: AttachmentPreviewProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const body = imageUrl ? (
    <div className="flex max-h-[70vh] items-center justify-center overflow-auto">
      <img src={imageUrl} alt={fileName} className="max-h-[70vh] max-w-full object-contain" />
    </div>
  ) : (
    <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">Loading preview…</div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{fileName}</DialogTitle>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent >
        <DrawerHeader className="text-left">
          <DrawerTitle className="truncate">{fileName}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">{body}</div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
