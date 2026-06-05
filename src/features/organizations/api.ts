import { apiRequest } from "@/shared/api/client";
import type {
  CreateOrganizationDto,
  Organization,
  UpdateOrganizationDto,
} from "./types";

export const organizationsApi = {
  list: () =>
    apiRequest<Organization[]>({ method: "GET", url: "/organizations" }),
  get: (id: string) =>
    apiRequest<Organization>({ method: "GET", url: `/organizations/${id}` }),
  create: (data: CreateOrganizationDto) =>
    apiRequest<Organization>({ method: "POST", url: "/organizations", data }),
  update: (id: string, data: UpdateOrganizationDto) =>
    apiRequest<Organization>({
      method: "PUT",
      url: `/organizations/${id}`,
      data,
    }),
  remove: (id: string) =>
    apiRequest<void>({ method: "DELETE", url: `/organizations/${id}` }),
};
