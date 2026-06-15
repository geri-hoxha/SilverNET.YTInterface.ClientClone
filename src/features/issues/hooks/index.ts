import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
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
