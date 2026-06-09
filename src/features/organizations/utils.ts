import type { Organization } from "./types";

export function organizationStatusLabel(org: Pick<Organization, "isActive">) {
  return org.isActive ? "Active" : "Inactive";
}
