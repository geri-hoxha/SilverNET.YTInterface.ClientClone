import type { AuthUser, PortalRole } from "./types";

export function hasRole(user: AuthUser | null, role: PortalRole) {
  return user?.role === role;
}

export function hasAnyRole(user: AuthUser | null, roles: PortalRole[]) {
  return !!user && roles.includes(user.role);
}
