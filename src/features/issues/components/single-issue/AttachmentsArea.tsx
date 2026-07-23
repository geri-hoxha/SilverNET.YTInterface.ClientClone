import { Download, Eye, FileText, Loader2, Paperclip } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSIONS, useAuth } from "@/features/auth";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/shared/api/errors";
import { formatBytes } from "@/shared/utils/format";

import { useDownloadAttachment, useIssueAttachments, useLoadAttachmentBlob, useUploadAttachment } from "../../hooks";
import type { IssueAttachment } from "../../types";
import { fileTypeMeta } from "../../utils";
import { getAttachmentPreviewKind } from "../../utils/utils";
import { AttachmentPreview } from "./AttachmentPreview";
import DeleteAttachmentsDialog from "./DeleteAttachmentsDialog";

function openPdfInNewTab(blob: Blob) {
  const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
  const url = URL.createObjectURL(pdfBlob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    URL.revokeObjectURL(url);
    toast.error("Pop-up blocked. Allow pop-ups to view this file.");
    return;
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

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

  // Revoke image object URL when preview closes / changes / unmounts
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

  const handleView = async (a: IssueAttachment) => {
    const kind = getAttachmentPreviewKind(a);
    if (!kind) {
      toast.error("Unable to view this file type. Please download it instead.");
      return;
    }

    try {
      const blob = await loadBlob.mutateAsync(a.id);

      if (kind === "pdf") {
        openPdfInNewTab(blob);
        return;
      }

      // image → modal / drawer
      const url = URL.createObjectURL(blob);
      setPreview((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return { fileName: a.fileName, url };
      });
    } catch (e) {
      // onError toast already fired from the mutation; keep guard for mutateAsync
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
          {attachments.map((a) => {
            const meta = fileTypeMeta(a.fileName);
            const previewKind = getAttachmentPreviewKind(a);
            const isDownloading = download.isPending && download.variables?.attachmentId === a.id;
            const isViewing = loadBlob.isPending && loadBlob.variables === a.id;

            return (
              <div key={a.id} className={cn("flex items-center gap-3 rounded-md border px-3 py-2", meta.bg, meta.border)}>
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white uppercase", meta.badge)}>
                  {meta.label ? meta.label : <FileText className="h-4 w-4" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-foreground truncate text-sm font-medium">{a.fileName}</div>
                  <div className="text-muted-foreground text-xs">
                    {meta.typeLabel} · {formatBytes(a.fileSize)}
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
                      onClick={() => handleView(a)}
                      aria-label={`View ${a.fileName}`}
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
                    onClick={() =>
                      download.mutate({
                        attachmentId: a.id,
                        fileName: a.fileName,
                      })
                    }
                    aria-label={`Download ${a.fileName}`}
                  >
                    {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  </Button>

                  {canDelete && <DeleteAttachmentsDialog attachment={a} />}
                </div>
              </div>
            );
          })}
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
