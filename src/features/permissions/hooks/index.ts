import { useQuery } from "@tanstack/react-query";
import { useAuth, PERMISSIONS } from "@/features/auth";
import { permissionsApi } from "../api";

export const permissionsKeys = {
  all: ["permissions"] as const,
  list: () => [...permissionsKeys.all, "list"] as const,
};

// Lists all known permission strings. Gated on `roles.read`, since that's what
// the endpoint requires — avoids a guaranteed 403 for users without it.
export function useAllPermissions() {
  const { hasPermission } = useAuth();
  const enabled = hasPermission(PERMISSIONS.rolesRead);
  return useQuery({
    queryKey: permissionsKeys.list(),
    queryFn: () => permissionsApi.list(),
    enabled,
  });
}
