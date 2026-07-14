import type { Organization } from "@/features/organizations/types";
import type { Project } from "./types";

export interface OrganizationProjects {
  org: Organization;
  projects: Project[];
}

export function groupProjectsByOrganization(organizations: Organization[], projects: Project[]): OrganizationProjects[] {
  return organizations.map((org) => ({
    org,
    projects: projects.filter((p) => p.organizationId === org.id),
  }));
}
