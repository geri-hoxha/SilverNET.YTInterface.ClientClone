import { apiRequest } from "@/shared/api/client";

interface PaginatedPermissions {
  items: string[];
}

// GET /api/permissions lists every permission string the system knows about.
// Requires the `roles.read` permission. Tolerates either a bare string[] or a
// paginated `{ items }` envelope.
export const permissionsApi = {
  list: async (): Promise<string[]> => {
    const result = await apiRequest<string[] | PaginatedPermissions>({
      method: "GET",
      url: "/permissions",
    });
    return Array.isArray(result) ? result : result.items;
  },
};
