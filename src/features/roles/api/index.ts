import { apiRequest } from "@/shared/api/client";
import type { ApiPaginatedResult, Role } from "../types";

export const rolesApi = {
  list: async (): Promise<Role[]> => {
    const result = await apiRequest<ApiPaginatedResult<Role>>({
      method: "GET",
      url: "/roles",
    });
    return result.items;
  },
};
