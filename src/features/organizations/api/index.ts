import { apiRequest } from "@/shared/api/client";
import type { ApiPaginatedResult, CreateOrganizationDto, Organization, OrganizationListParams, PaginatedResult, UpdateOrganizationDto } from "../types";

function toListParams(params?: OrganizationListParams) {
  if (!params) return undefined;
  return {
    Page: params.page,
    PageSize: params.pageSize,
  };
}

export const organizationsApi = {
  list: async (params?: OrganizationListParams): Promise<PaginatedResult<Organization>> => {
    const result = await apiRequest<ApiPaginatedResult<Organization>>({
      method: "GET",
      url: "/organizations",
      params: toListParams(params),
    });
    return {
      items: result.items,
      page: result.page,
      pageSize: result.pageSize,
      total: result.totalCount,
    };
  },
  get: (id: string) => apiRequest<Organization>({ method: "GET", url: `/organizations/${id}` }),
  create: (data: CreateOrganizationDto) => apiRequest<Organization>({ method: "POST", url: "/organizations", data }),
  update: (id: string, data: UpdateOrganizationDto) =>
    apiRequest<Organization>({
      method: "PUT",
      url: `/organizations/${id}`,
      data,
    }),
  remove: (id: string) => apiRequest<void>({ method: "DELETE", url: `/organizations/${id}` }),
};
