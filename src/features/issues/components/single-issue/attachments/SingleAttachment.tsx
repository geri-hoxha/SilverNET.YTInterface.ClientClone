import { Download, Eye, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/shared/utils/format";

import { IssueAttachment } from "@/features/issues/types";
import { fileTypeMeta } from "@/features/issues/utils";
import { getAttachmentPreviewKind } from "@/features/issues/utils/utils";
import DeleteAttachmentsDialog from "./DeleteAttachmentsDialog";

type SingleAttachmentProps = {
  attachment: IssueAttachment;
  canDelete: boolean;
  isDownloading: boolean;
  isViewing: boolean;
  onDownload: (attachment: IssueAttachment) => void;
  onView: (attachment: IssueAttachment) => void;
};

export function SingleAttachment({ attachment, canDelete, isDownloading, isViewing, onDownload, onView }: SingleAttachmentProps) {
  const meta = fileTypeMeta(attachment.fileName);
  const previewKind = getAttachmentPreviewKind(attachment);

  return (
    <div className={cn("flex items-center gap-3 rounded-md border px-3 py-2", meta.bg, meta.border)}>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white uppercase", meta.badge)}>
        {meta.label ? meta.label : <FileText className="h-4 w-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-foreground truncate text-sm font-medium">{attachment.fileName}</div>
        <div className="text-muted-foreground text-xs">
          {meta.typeLabel} · {formatBytes(attachment.fileSize)}
        </div>
      </div>

      <div className="flex items-center">
        {previewKind && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0"
            disabled={isViewing}
            onClick={() => onView(attachment)}
            aria-label={`View ${attachment.fileName}`}
          >
            {isViewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0"
          disabled={isDownloading}
          onClick={() => onDownload(attachment)}
          aria-label={`Download ${attachment.fileName}`}
        >
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        </Button>

        {canDelete && <DeleteAttachmentsDialog attachment={attachment} />}
      </div>
    </div>
  );
}
