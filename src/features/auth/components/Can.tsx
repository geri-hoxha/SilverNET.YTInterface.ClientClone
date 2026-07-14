import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import type { Permission } from "../permissions";

interface CanProps {
  /** Required permission. Use `anyOf`/`allOf` for multiple. */
  permission?: Permission;
  /** Render children if the user has ANY of these permissions. */
  anyOf?: Permission[];
  /** Render children if the user has ALL of these permissions. */
  allOf?: Permission[];
  children: ReactNode;
  /** Optional fallback rendered when the check fails. */
  fallback?: ReactNode;
}

// Declarative permission gate for UI visibility. Remember: this only controls
// what is shown — the API's 403 is the real enforcement.
export function Can({ permission, anyOf, allOf, children, fallback = null }: CanProps) {
  const { permissions } = useAuth();

  const ok = (permission ? permissions.includes(permission) : true) && (anyOf ? anyOf.some((p) => permissions.includes(p)) : true) && (allOf ? allOf.every((p) => permissions.includes(p)) : true);

  return <>{ok ? children : fallback}</>;
}
