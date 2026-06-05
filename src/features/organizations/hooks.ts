import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { organizationsApi } from "./api";
import type { CreateOrganizationDto, UpdateOrganizationDto } from "./types";
import type { ApiError } from "@/shared/api/errors";

export const orgsKeys = {
  all: ["organizations"] as const,
  list: () => [...orgsKeys.all, "list"] as const,
  detail: (id: string) => [...orgsKeys.all, "detail", id] as const,
};

export function useOrganizations() {
  return useQuery({
    queryKey: orgsKeys.list(),
    queryFn: () => organizationsApi.list(),
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: orgsKeys.detail(id),
    queryFn: () => organizationsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrganizationDto) => organizationsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgsKeys.all });
      toast.success("Organization created");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useUpdateOrganization(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateOrganizationDto) =>
      organizationsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgsKeys.all });
      toast.success("Organization updated");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useDeleteOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => organizationsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgsKeys.all });
      toast.success("Organization deleted");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}
