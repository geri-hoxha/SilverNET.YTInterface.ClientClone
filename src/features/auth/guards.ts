import { redirect, type ParsedLocation } from "@tanstack/react-router";
import { tokenStore } from "@/shared/api/tokens";
import { hasAllPermissions, hasAnyPermission, hasAnyRole, hasPermission, hasRole } from "./utils";
import { decodeJwtClaims } from "./jwt";
import type { Permission } from "./permissions";
import type { AuthUser, PortalRole } from "./types";

export function isAuthenticated(): boolean {
  return tokenStore.get() !== null;
}

export function getStoredUser(): AuthUser | null {
  const user = tokenStore.getUser<AuthUser>();
  if (!user) return null;
  if (user.permissions) return user;
  // Backfill permissions from the access token for older stored sessions.
  const permissions = decodeJwtClaims(tokenStore.get()?.accessToken)?.permissions ?? [];
  return { ...user, permissions };
}

export function safeRedirectPath(path: string | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/issues";
  }
  return path;
}

export function requireAuth({ location }: { location: ParsedLocation }) {
  if (!isAuthenticated()) {
    throw redirect({
      to: "/login",
      search: {
        redirect: location.pathname + location.searchStr + location.hash,
      },
    });
  }
}

export function requireGuest() {
  if (isAuthenticated()) {
    throw redirect({ to: "/issues" });
  }
}

export function requireRole(role: PortalRole) {
  const user = getStoredUser();
  if (!hasRole(user, role)) {
    throw redirect({ to: "/issues" });
  }
}

export function requireAnyRole(roles: PortalRole[]) {
  const user = getStoredUser();
  if (!hasAnyRole(user, roles)) {
    throw redirect({ to: "/issues" });
  }
}

export function requirePermission(permission: Permission) {
  const user = getStoredUser();
  if (!hasPermission(user, permission)) {
    throw redirect({ to: "/issues" });
  }
}

export function requireAnyPermission(permissions: Permission[]) {
  const user = getStoredUser();
  if (!hasAnyPermission(user, permissions)) {
    throw redirect({ to: "/issues" });
  }
}

export function requireAllPermissions(permissions: Permission[]) {
  const user = getStoredUser();
  if (!hasAllPermissions(user, permissions)) {
    throw redirect({ to: "/issues" });
  }
}
