import { useQuery } from "@tanstack/react-query";
import { rolesApi } from "../api";

export const rolesKeys = {
  all: ["roles"] as const,
  list: () => [...rolesKeys.all, "list"] as const,
};

export function useRoles() {
  return useQuery({
    queryKey: rolesKeys.list(),
    queryFn: () => rolesApi.list(),
  });
}
