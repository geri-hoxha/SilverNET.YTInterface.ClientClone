import { Loader2, Paperclip } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSIONS, useAuth } from "@/features/auth";
import type { ApiError } from "@/shared/api/errors";

import { useDownloadAttachment, useIssueAttachments, useLoadAttachmentBlob, useUploadAttachment } from "@/features/issues/hooks";
import { IssueAttachment } from "@/features/issues/types";
import { getAttachmentPreviewKind, openPdfInNewTab } from "@/features/issues/utils/utils";
import { AttachmentPreview } from "./AttachmentPreview";
import { SingleAttachment } from "./SingleAttachment";

export function AttachmentsArea({ id }: { id: string }) {
  const { hasPermission } = useAuth();
  const canAttach = hasPermission(PERMISSIONS.issuesAttachmentsCreate);
  const canDelete = hasPermission(PERMISSIONS.issuesAttachmentsDelete);
  const q = useIssueAttachments(id);
  const upload = useUploadAttachment(id);
  const download = useDownloadAttachment(id);
  const loadBlob = useLoadAttachmentBlob(id);
  const fileInput = useRef<HTMLInputElement>(null);
  const attachments = q.data?.items ?? [];

  const [preview, setPreview] = useState<{
    fileName: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview?.url]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    e.target.value = "";
  };

  const closePreview = (open: boolean) => {
    if (!open) setPreview(null);
  };

  const handleDownload = (attachment: IssueAttachment) => {
    download.mutate({
      attachmentId: attachment.id,
      fileName: attachment.fileName,
    });
  };

  const handleView = async (attachment: IssueAttachment) => {
    const kind = getAttachmentPreviewKind(attachment);
    if (!kind) {
      toast.error("Unable to view this file type. Please download it instead.");
      return;
    }

    try {
      const blob = await loadBlob.mutateAsync(attachment.id);

      if (kind === "pdf") {
        openPdfInNewTab(blob);
        return;
      }

      const url = URL.createObjectURL(blob);
      setPreview((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return { fileName: attachment.fileName, url };
      });
    } catch (e) {
      if (!(e as ApiError)?.message) {
        toast.error("Failed to open file");
      }
    }
  };

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Attachments</div>
        {canAttach && (
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={upload.isPending} onClick={() => fileInput.current?.click()}>
            {upload.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Paperclip className="mr-1.5 h-3.5 w-3.5" />}
            Attach file
          </Button>
        )}
      </div>

      {q.isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : attachments.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {attachments.map((a) => (
            <SingleAttachment
              key={a.id}
              attachment={a}
              canDelete={canDelete}
              isDownloading={download.isPending && download.variables?.attachmentId === a.id}
              isViewing={loadBlob.isPending && loadBlob.variables === a.id}
              onDownload={handleDownload}
              onView={handleView}
            />
          ))}
        </div>
      ) : canAttach ? (
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={upload.isPending}
          className="text-muted-foreground hover:border-foreground/30 hover:text-foreground flex w-full items-center justify-center rounded-md border border-dashed py-6 text-sm transition-colors disabled:opacity-50"
        >
          <Paperclip className="mr-2 h-4 w-4" />
          Click to attach a file
        </button>
      ) : (
        <p className="text-muted-foreground py-4 text-sm italic">No attachments</p>
      )}

      {canAttach && <input ref={fileInput} type="file" className="hidden" onChange={handleFileSelect} />}

      <AttachmentPreview open={preview !== null} onOpenChange={closePreview} fileName={preview?.fileName ?? ""} imageUrl={preview?.url ?? null} />
    </div>
  );
}
