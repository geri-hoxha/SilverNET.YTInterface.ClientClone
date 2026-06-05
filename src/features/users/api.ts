import { apiRequest } from "@/shared/api/client";
import type {
  PaginatedResult,
  PortalUser,
  UpdateUserDto,
  UserListParams,
} from "./types";

export const usersApi = {
  list: (params: UserListParams) =>
    apiRequest<PaginatedResult<PortalUser>>({
      method: "GET",
      url: "/users",
      params,
    }),

  get: (id: string) =>
    apiRequest<PortalUser>({ method: "GET", url: `/users/${id}` }),

  update: (id: string, data: UpdateUserDto) =>
    apiRequest<PortalUser>({ method: "PUT", url: `/users/${id}`, data }),

  ban: (id: string) =>
    apiRequest<void>({ method: "POST", url: `/users/${id}/ban` }),

  unban: (id: string) =>
    apiRequest<void>({ method: "POST", url: `/users/${id}/unban` }),

  remove: (id: string) =>
    apiRequest<void>({ method: "DELETE", url: `/users/${id}` }),

  sendTestEmail: (id: string) =>
    apiRequest<void>({ method: "POST", url: `/users/${id}/test-email` }),

  exportPersonalData: (id: string) =>
    apiRequest<Blob>({
      method: "GET",
      url: `/users/${id}/personal-data`,
      responseType: "blob",
    }),
};
