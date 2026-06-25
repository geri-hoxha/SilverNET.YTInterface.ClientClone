import { apiRequest } from "@/shared/api/client";
import type {
  ApiPaginatedResult,
  CreateIssueDto,
  Issue,
  IssueAttachment,
  IssueComment,
  IssueListParams,
  PaginatedResult,
  UpdateIssueDto,
} from "../types";

function toPaginatedResult<T>(result: ApiPaginatedResult<T>): PaginatedResult<T> {
  return {
    items: result.items,
    page: result.page,
    pageSize: result.pageSize,
    total: result.totalCount,
  };
}

function toListParams(params: IssueListParams) {
  const query: Record<string, string | number | boolean | string[]> = {
    Page: params.page,
    PageSize: params.pageSize,
  };
  if (params.projectId) query.ProjectId = params.projectId;
  if (params.status?.length) query.Status = params.status;
  if (params.priority?.length) query.Priority = params.priority;
  if (params.from) query.From = params.from;
  if (params.to) query.To = params.to;
  if (params.search) query.Search = params.search;
  if (params.sortBy) query.SortBy = params.sortBy;
  if (params.sortDescending !== undefined) {
    query.SortDescending = params.sortDescending;
  }
  return query;
}

export const issuesApi = {
  list: async (params: IssueListParams): Promise<PaginatedResult<Issue>> => {
    const result = await apiRequest<ApiPaginatedResult<Issue>>({
      method: "GET",
      url: "/issues",
      params: toListParams(params),
      // Serialize array params as repeated keys without brackets
      // (e.g. Status=Done&Status=In Progress) for backend list binding.
      paramsSerializer: { indexes: null },
    });
    return toPaginatedResult(result);
  },

  get: (id: string) =>
    apiRequest<Issue>({ method: "GET", url: `/issues/${id}` }),

  create: (data: CreateIssueDto) =>
    apiRequest<Issue>({ method: "POST", url: "/issues", data }),

  update: (id: string, data: UpdateIssueDto) =>
    apiRequest<Issue>({ method: "PUT", url: `/issues/${id}`, data }),

  comments: async (id: string): Promise<PaginatedResult<IssueComment>> => {
    const result = await apiRequest<ApiPaginatedResult<IssueComment>>({
      method: "GET",
      url: `/issues/${id}/comments?page=1&pageSize=100`,
    });
    return toPaginatedResult(result);
  },

  addComment: (id: string, body: string) =>
    apiRequest<IssueComment>({
      method: "POST",
      url: `/issues/${id}/comments`,
      data: { body },
    }),

  attachments: async (id: string): Promise<PaginatedResult<IssueAttachment>> => {
    const result = await apiRequest<ApiPaginatedResult<IssueAttachment>>({
      method: "GET",
      url: `/issues/${id}/attachments`,
    });
    return toPaginatedResult(result);
  },

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

  downloadAttachment: (issueId: string, attachmentId: string) =>
    apiRequest<Blob>({
      method: "GET",
      url: `/issues/${issueId}/attachments/${attachmentId}/download`,
      responseType: "blob",
    }),

  approveEstimation: (id: string) =>
    apiRequest<Issue>({
      method: "POST",
      url: `/issues/${id}/estimation/approve`,
    }),
};
