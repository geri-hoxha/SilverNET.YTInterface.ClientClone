import { apiRequest } from "@/shared/api/client";
import type {
  CreateProjectDto,
  PaginatedResult,
  Project,
  UpdateProjectDto,
} from "./types";

export const projectsApi = {
  list: (params?: { organizationId?: string; search?: string }) =>
    apiRequest<PaginatedResult<Project>>({
      method: "GET",
      url: "/projects",
      params,
    }),
  get: (id: string) =>
    apiRequest<Project>({ method: "GET", url: `/projects/${id}` }),
  create: (data: CreateProjectDto) =>
    apiRequest<Project>({ method: "POST", url: "/projects", data }),
  update: (id: string, data: UpdateProjectDto) =>
    apiRequest<Project>({ method: "PUT", url: `/projects/${id}`, data }),
  remove: (id: string) =>
    apiRequest<void>({ method: "DELETE", url: `/projects/${id}` }),
  syncPriorities: (id: string) =>
    apiRequest<Project>({
      method: "POST",
      url: `/projects/${id}/sync-priorities`,
    }),
};
