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
  const query: Record<string, string | number | boolean> = {
    Page: params.page,
    PageSize: params.pageSize,
  };
  if (params.projectId) query.ProjectId = params.projectId;
  if (params.status) query.Status = params.status;
  if (params.priority) query.Priority = params.priority;
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
  list: (params: IssueListParams) =>
    apiRequest<PaginatedResult<Issue>>({
      method: "GET",
      url: "/issues",
      params: toListParams(params),
    }),

  get: (id: string) =>
    apiRequest<Issue>({ method: "GET", url: `/issues/${id}` }),

  create: (data: CreateIssueDto) =>
    apiRequest<Issue>({ method: "POST", url: "/issues", data }),

  update: (id: string, data: UpdateIssueDto) =>
    apiRequest<Issue>({ method: "PUT", url: `/issues/${id}`, data }),

  comments: async (id: string): Promise<PaginatedResult<IssueComment>> => {
    const result = await apiRequest<ApiPaginatedResult<IssueComment>>({
      method: "GET",
      url: `/issues/${id}/comments`,
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
};
