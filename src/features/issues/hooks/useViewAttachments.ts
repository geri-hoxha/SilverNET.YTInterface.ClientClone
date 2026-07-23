// hooks — useViewAttachment.ts (or in your issues hooks file)
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ApiError } from "@/shared/api/errors";

import { issuesApi } from "../api";
import { getAttachmentPreviewKind } from "../utils/utils";

function openBlobInNewTab(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    URL.revokeObjectURL(url);
    toast.error("Pop-up blocked. Allow pop-ups to view this file.");
    return;
  }
  // Keep the tab alive long enough to load; then free memory.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function useViewAttachment(issueId: string) {
  return useMutation({
    mutationFn: async (input: { attachmentId: string; fileName: string; contentType: string }) => {
      const kind = getAttachmentPreviewKind(input);
      if (!kind) {
        throw new Error("This file type can’t be previewed. Please download it instead.");
      }

      const blob = await issuesApi.downloadAttachment(issueId, input.attachmentId);
      return { blob, kind, fileName: input.fileName };
    },
    onSuccess: ({ blob, kind }) => {
      if (kind === "pdf") {
        // Ensure the browser treats it as PDF when possible
        const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
        openBlobInNewTab(pdfBlob);
      }
      // images: caller handles opening dialog/drawer with the blob
    },
    onError: (e: ApiError | Error) => {
      toast.error(e.message ?? "Failed to open file");
    },
  });
}
