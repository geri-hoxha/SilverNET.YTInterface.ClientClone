import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectsApi } from "../api";
import type { CreateProjectDto, UpdateProjectDto } from "../types";
import type { ApiError } from "@/shared/api/errors";

export const projectsKeys = {
  all: ["projects"] as const,
  list: (p?: { organizationId?: string; page?: number; pageSize?: number }) => [...projectsKeys.all, "list", p ?? {}] as const,
  detail: (id: string) => [...projectsKeys.all, "detail", id] as const,
  clientStates: () => [...projectsKeys.all, "client-states"] as const,
  priorities: () => [...projectsKeys.all, "priorities"] as const,
};

export function useProjects(params?: { organizationId?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: projectsKeys.list(params),
    queryFn: async () => {
      const result = await projectsApi.list(params);
      return result.items;
    },
  });
}

export function useClientStates() {
  return useQuery({
    queryKey: projectsKeys.clientStates(),
    queryFn: () => projectsApi.clientStates(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePriorities() {
  return useQuery({
    queryKey: projectsKeys.priorities(),
    queryFn: () => projectsApi.priorities(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectsKeys.detail(id),
    queryFn: () => projectsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectDto) => projectsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectsKeys.all });
      toast.success("Project created");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProjectDto) => projectsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectsKeys.all });
      toast.success("Project updated");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectsKeys.all });
      toast.success("Project deleted");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useSyncPriorities() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.syncPriorities(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectsKeys.all });
      toast.success("Priorities synced from YouTrack");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}
