import { Download, FileText, Loader2, Paperclip } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSIONS, useAuth } from "@/features/auth";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/shared/api/errors";
import { formatBytes } from "@/shared/utils/format";

import { issuesApi } from "../../api";
import { useIssueAttachments, useUploadAttachment } from "../../hooks";
import type { IssueAttachment } from "../../types";
import { fileTypeMeta } from "../../utils";

export function AttachmentsArea({ id }: { id: string }) {
  const { hasPermission } = useAuth();
  const canAttach = hasPermission(PERMISSIONS.issuesAttachmentsCreate);
  const q = useIssueAttachments(id);
  const upload = useUploadAttachment(id);
  const fileInput = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const attachments = q.data?.items ?? [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    e.target.value = "";
  };

  const handleDownload = async (attachment: IssueAttachment) => {
    setDownloadingId(attachment.id);
    try {
      const blob = await issuesApi.downloadAttachment(id, attachment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error((e as ApiError).message ?? "Failed to download file");
    } finally {
      setDownloadingId(null);
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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0"
                  disabled={downloadingId === a.id}
                  onClick={() => handleDownload(a)}
                  aria-label={`Download ${a.fileName}`}
                >
                  {downloadingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </Button>
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
    </div>
  );
}
