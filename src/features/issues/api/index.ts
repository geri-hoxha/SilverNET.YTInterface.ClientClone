import { api, apiRequest } from "@/shared/api/client";

import type {
  ApiPaginatedResult,
  CreateIssueDto,
  CreateSavedSearchType,
  Issue,
  IssueAttachment,
  IssueComment,
  IssueExportFormat,
  IssueExportParams,
  IssueListParams,
  PaginatedResult,
  SavedSearch,
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

const EXPORT_DEFAULT_FILENAMES: Record<IssueExportFormat, string> = {
  0: "issues.xlsx",
  1: "issues.csv",
  2: "issues.pdf",
};

function parseContentDispositionFilename(disposition?: string) {
  if (!disposition) return undefined;
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition);
  if (!match?.[1]) return undefined;
  try {
    return decodeURIComponent(match[1].replace(/"/g, ""));
  } catch {
    return match[1].replace(/"/g, "");
  }
}

function toFilterParams(params: Omit<IssueListParams, "page" | "pageSize"> & { format?: IssueExportFormat }) {
  const query: Record<string, string | number | boolean | string[]> = {};
  if (params.format !== undefined) query.Format = params.format;
  if (params.projectId) query.ProjectId = params.projectId;
  if (params.status?.length) query.Status = params.status;
  if (params.priority?.length) query.Priority = params.priority;
  if (params.from) query.From = params.from;
  if (params.to) query.To = params.to;
  if (params.closedFrom) query.ClosedFrom = params.closedFrom;
  if (params.closedTo) query.ClosedTo = params.closedTo;
  if (params.search) query.Search = params.search;
  if (params.sortBy) query.SortBy = params.sortBy;
  if (params.sortDescending !== undefined) {
    query.SortDescending = params.sortDescending;
  }
  return query;
}

function toListParams(params: IssueListParams) {
  return {
    Page: params.page,
    PageSize: params.pageSize,
    ...toFilterParams(params),
  };
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

  get: (id: string) => apiRequest<Issue>({ method: "GET", url: `/issues/${id}` }),

  create: (data: CreateIssueDto) => apiRequest<Issue>({ method: "POST", url: "/issues", data }),

  update: (id: string, data: UpdateIssueDto) => apiRequest<Issue>({ method: "PUT", url: `/issues/${id}`, data }),

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

  downloadAttachment: (issueId: string, attachmentId: string) =>
    apiRequest<Blob>({
      method: "GET",
      url: `/issues/${issueId}/attachments/${attachmentId}/download`,
      responseType: "blob",
    }),

  deleteAttachment: (issueId: string, attachmentId: string) =>
    apiRequest<void>({
      method: "DELETE",
      url: `/issues/${issueId}/attachments/${attachmentId}`,
    }),

  approveEstimation: (id: string) =>
    apiRequest<Issue>({
      method: "POST",
      url: `/issues/${id}/estimation/approve`,
    }),

  export: async (params: IssueExportParams) => {
    const response = await api.request<Blob>({
      method: "GET",
      url: "/issues/export",
      params: toFilterParams(params),
      paramsSerializer: { indexes: null },
      responseType: "blob",
    });
    const disposition = response.headers["content-disposition"];
    return {
      blob: response.data,
      filename: parseContentDispositionFilename(typeof disposition === "string" ? disposition : undefined) ?? EXPORT_DEFAULT_FILENAMES[params.format],
    };
  },
};

export const savedSearchesApi = {
  list: () => apiRequest<SavedSearch[]>({ method: "GET", url: "/issues/saved-searches" }),

  create: (data: CreateSavedSearchType) => apiRequest<SavedSearch>({ method: "POST", url: "/issues/saved-searches", data }),

  update: (id: string, data: CreateSavedSearchType) => apiRequest<SavedSearch>({ method: "PUT", url: `/issues/saved-searches/${id}`, data }),

  delete: (id: string) => apiRequest<void>({ method: "DELETE", url: `/issues/saved-searches/${id}` }),
};
