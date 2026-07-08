import type { AuthUser, PortalRole } from "./types";
import type { Permission } from "./permissions";

export function hasRole(user: AuthUser | null, role: PortalRole) {
  return user?.role === role;
}

export function hasAnyRole(user: AuthUser | null, roles: PortalRole[]) {
  return !!user && roles.includes(user.role);
}

export function hasPermission(user: AuthUser | null, permission: Permission) {
  return !!user && user.permissions.includes(permission);
}

export function hasAnyPermission(user: AuthUser | null, permissions: Permission[]) {
  return !!user && permissions.some((p) => user.permissions.includes(p));
}

export function hasAllPermissions(user: AuthUser | null, permissions: Permission[]) {
  return !!user && permissions.every((p) => user.permissions.includes(p));
}
