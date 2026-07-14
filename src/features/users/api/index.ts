import { apiRequest } from "@/shared/api/client";
import type { ApiPaginatedResult, CreateUserDto, MentionableUser, PaginatedResult, PortalUser, UpdateUserDto, UserListParams } from "../types";

function toListParams(params: UserListParams) {
  return {
    Page: params.page,
    PageSize: params.pageSize,
  };
}

export const usersApi = {
  list: async (params: UserListParams): Promise<PaginatedResult<PortalUser>> => {
    const result = await apiRequest<ApiPaginatedResult<PortalUser>>({
      method: "GET",
      url: "/users",
      params: toListParams(params),
    });
    return {
      items: result.items,
      page: result.page,
      pageSize: result.pageSize,
      total: result.totalCount,
    };
  },

  get: (id: string) => apiRequest<PortalUser>({ method: "GET", url: `/users/${id}` }),

  mentionable: () => apiRequest<MentionableUser[]>({ method: "GET", url: "/users/mentionable" }),

  create: (data: CreateUserDto) => apiRequest<PortalUser>({ method: "POST", url: "/users", data }),

  update: (id: string, data: UpdateUserDto) => apiRequest<PortalUser>({ method: "PUT", url: `/users/${id}`, data }),

  remove: (id: string) => apiRequest<void>({ method: "DELETE", url: `/users/${id}` }),

  sendTestEmail: (id: string) => apiRequest<void>({ method: "POST", url: `/users/${id}/test-email` }),

  exportPersonalData: (id: string) =>
    apiRequest<Blob>({
      method: "GET",
      url: `/users/${id}/personal-data`,
      responseType: "blob",
    }),
};
