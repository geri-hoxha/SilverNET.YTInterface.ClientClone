import { apiRequest } from "@/shared/api/client";
import type {
  ApiPaginatedResult,
  CreateProjectDto,
  PaginatedResult,
  Project,
  ProjectListParams,
  UpdateProjectDto,
} from "../types";

function toListParams(params?: ProjectListParams) {
  if (!params) return undefined;
  return {
    Page: params.page,
    PageSize: params.pageSize,
    OrganizationId: params.organizationId,
  };
}

export const projectsApi = {
  list: async (params?: ProjectListParams): Promise<PaginatedResult<Project>> => {
    const result = await apiRequest<ApiPaginatedResult<Project>>({
      method: "GET",
      url: "/projects",
      params: toListParams(params),
    });
    return {
      items: result.items,
      page: result.page,
      pageSize: result.pageSize,
      total: result.totalCount,
    };
  },
  get: (id: string) => apiRequest<Project>({ method: "GET", url: `/projects/${id}` }),
  create: (data: CreateProjectDto) =>
    apiRequest<Project>({ method: "POST", url: "/projects", data }),
  update: (id: string, data: UpdateProjectDto) =>
    apiRequest<Project>({ method: "PUT", url: `/projects/${id}`, data }),
  remove: (id: string) => apiRequest<void>({ method: "DELETE", url: `/projects/${id}` }),
  syncPriorities: (id: string) =>
    apiRequest<Project>({
      method: "POST",
      url: `/projects/${id}/priorities/sync`,
    }),
  clientStates: () => apiRequest<string[]>({ method: "GET", url: "/projects/client-states" }),
  priorities: () => apiRequest<string[]>({ method: "GET", url: "/projects/priorities" }),
};
