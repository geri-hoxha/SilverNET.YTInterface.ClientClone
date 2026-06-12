import { redirect, type ParsedLocation } from "@tanstack/react-router";
import { tokenStore } from "@/shared/api/tokens";
import { hasAnyRole, hasRole } from "./utils";
import type { AuthUser, PortalRole } from "./types";

export function isAuthenticated(): boolean {
  return tokenStore.get() !== null;
}

export function getStoredUser(): AuthUser | null {
  return tokenStore.getUser<AuthUser>();
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
