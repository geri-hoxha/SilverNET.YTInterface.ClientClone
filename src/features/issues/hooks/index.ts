import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { issuesApi } from "../api";
import type {
  CreateIssueDto,
  IssueListParams,
  UpdateIssueDto,
} from "../types";
import type { ApiError } from "@/shared/api/errors";

export const issuesKeys = {
  all: ["issues"] as const,
  list: (p: IssueListParams) => [...issuesKeys.all, "list", p] as const,
  detail: (id: string) => [...issuesKeys.all, "detail", id] as const,
  comments: (id: string) => [...issuesKeys.all, "comments", id] as const,
  attachments: (id: string) => [...issuesKeys.all, "attachments", id] as const,
};

export function useIssues(params: IssueListParams) {
  return useQuery({
    queryKey: issuesKeys.list(params),
    queryFn: () => issuesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useIssue(id: string) {
  return useQuery({
    queryKey: issuesKeys.detail(id),
    queryFn: () => issuesApi.get(id),
    enabled: !!id,
  });
}

export function useIssueComments(id: string) {
  return useQuery({
    queryKey: issuesKeys.comments(id),
    queryFn: () => issuesApi.comments(id),
    enabled: !!id,
  });
}

export function useIssueAttachments(id: string) {
  return useQuery({
    queryKey: issuesKeys.attachments(id),
    queryFn: () => issuesApi.attachments(id),
    enabled: !!id,
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIssueDto) => issuesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issuesKeys.all });
      toast.success("Issue created");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useUpdateIssue(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateIssueDto) => issuesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issuesKeys.all });
      qc.invalidateQueries({ queryKey: issuesKeys.detail(id) });
      toast.success("Issue updated");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useAddComment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => issuesApi.addComment(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issuesKeys.comments(id) });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useUploadAttachment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => issuesApi.uploadAttachment(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issuesKeys.attachments(id) });
      toast.success("File uploaded");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

// Normalises an attachment reference/file name so a description's inline marker
// resolves to its attachment even when they differ by case, surrounding
// whitespace, URL-encoding, or a leading path segment (e.g. YouTrack may emit
// `![](My Image.png)` while the backend stores `my image.png`).
function normalizeAttachmentName(name: string): string {
  let value = name.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    /* keep the raw value if it isn't valid percent-encoding */
  }
  // Drop any path so `path/to/image.png` matches a stored `image.png`.
  const lastSlash = Math.max(value.lastIndexOf("/"), value.lastIndexOf("\\"));
  if (lastSlash >= 0) value = value.slice(lastSlash + 1);
  return value.toLowerCase();
}

/**
 * Resolves inline attachment references (the file names stored in a description's
 * `data-attachment-ref` markup) to short-lived object URLs.
 *
 * Attachments are served from an auth-protected blob endpoint, so they can't be
 * used directly as `<img src>`/`<a href>`. This hook downloads referenced files
 * once, caches the object URLs by attachment id, and revokes them on unmount.
 *
 * Call `ensure(fileNames)` with the references you need resolved; resolved URLs
 * appear in the returned `urls` map keyed by file name.
 */
export function useIssueAttachmentUrls(issueId: string) {
  const attachmentsQ = useIssueAttachments(issueId);
  const [urls, setUrls] = useState<Record<string, string>>({});
  // Object URLs keyed by attachment id so we never download the same file twice.
  const objectUrlsRef = useRef<Record<string, string>>({});
  const inFlightRef = useRef<Set<string>>(new Set());

  // Resolve references both by their exact name and a normalised form so minor
  // differences (case/whitespace/encoding/path) still match an attachment.
  const nameToId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of attachmentsQ.data?.items ?? []) {
      map[a.fileName] = a.id;
      const normalized = normalizeAttachmentName(a.fileName);
      if (!(normalized in map)) map[normalized] = a.id;
    }
    return map;
  }, [attachmentsQ.data]);

  const ensure = useCallback(
    (fileNames: string[]) => {
      for (const name of fileNames) {
        const attachmentId = nameToId[name] ?? nameToId[normalizeAttachmentName(name)];
        if (!attachmentId) continue;
        if (objectUrlsRef.current[attachmentId]) {
          // Already downloaded under a different (but equivalent) reference;
          // make sure this exact reference is mapped so the <img> resolves.
          const existing = objectUrlsRef.current[attachmentId];
          setUrls((prev) =>
            prev[name] === existing ? prev : { ...prev, [name]: existing },
          );
          continue;
        }
        if (inFlightRef.current.has(attachmentId)) continue;
        inFlightRef.current.add(attachmentId);
        issuesApi
          .downloadAttachment(issueId, attachmentId)
          .then((blob) => {
            const url = URL.createObjectURL(blob);
            objectUrlsRef.current[attachmentId] = url;
            setUrls((prev) => ({ ...prev, [name]: url }));
          })
          .catch(() => {
            /* leave the reference unresolved; the card/alt text still renders */
          })
          .finally(() => inFlightRef.current.delete(attachmentId));
      }
    },
    [issueId, nameToId],
  );

  useEffect(() => {
    const cache = objectUrlsRef.current;
    return () => {
      for (const url of Object.values(cache)) URL.revokeObjectURL(url);
    };
  }, []);

  return { urls, ensure, ready: attachmentsQ.isSuccess };
}

export function useApproveEstimation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => issuesApi.approveEstimation(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: issuesKeys.all });
      qc.invalidateQueries({ queryKey: issuesKeys.detail(id) });
      toast.success("Estimation approved");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}
