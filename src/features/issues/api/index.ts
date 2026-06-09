import { apiRequest } from "@/shared/api/client";
import type {
  CreateIssueDto,
  Issue,
  IssueAttachment,
  IssueComment,
  IssueListParams,
  PaginatedResult,
  UpdateIssueDto,
} from "../types";

export const issuesApi = {
  list: (params: IssueListParams) =>
    apiRequest<PaginatedResult<Issue>>({
      method: "GET",
      url: "/issues",
      params,
    }),

  get: (id: string) =>
    apiRequest<Issue>({ method: "GET", url: `/issues/${id}` }),

  create: (data: CreateIssueDto) =>
    apiRequest<Issue>({ method: "POST", url: "/issues", data }),

  update: (id: string, data: UpdateIssueDto) =>
    apiRequest<Issue>({ method: "PUT", url: `/issues/${id}`, data }),

  comments: (id: string) =>
    apiRequest<IssueComment[]>({
      method: "GET",
      url: `/issues/${id}/comments`,
    }),

  addComment: (id: string, body: string) =>
    apiRequest<IssueComment>({
      method: "POST",
      url: `/issues/${id}/comments`,
      data: { body },
    }),

  attachments: (id: string) =>
    apiRequest<IssueAttachment[]>({
      method: "GET",
      url: `/issues/${id}/attachments`,
    }),

  uploadAttachment: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiRequest<IssueAttachment>({
      method: "POST",
      url: `/issues/${id}/attachments`,
      data: form,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
