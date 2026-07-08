import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { onSessionExpired } from "@/shared/api/client";
import { tokenStore } from "@/shared/api/tokens";
import { authApi } from "../api";
import { decodeJwtClaims } from "../jwt";
import type { Permission } from "../permissions";
import type { AuthUser, PortalRole } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  permissions: string[];
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: PortalRole) => boolean;
  hasAnyRole: (roles: PortalRole[]) => boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = tokenStore.get();
    const storedUser = tokenStore.getUser<AuthUser>();
    if (stored && storedUser) {
      // Backfill permissions for sessions stored before this field existed.
      const permissions =
        storedUser.permissions ?? decodeJwtClaims(stored.accessToken)?.permissions ?? [];
      setUser({ ...storedUser, permissions });
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    onSessionExpired(() => {
      setUser(null);
      navigate({ to: "/login", replace: true });
    });
  }, [navigate]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    tokenStore.set(res);
    const claims = decodeJwtClaims(res.accessToken);
    const u: AuthUser = {
      id: res.user?.id ?? "me",
      fullName: res.fullName,
      email: res.email,
      role: res.user?.role ?? claims?.role,
      organizationId: res.user?.organizationId ?? claims?.organizationId,
      organizationName: res.user?.organizationName,
      permissions: res.permissions ?? res.user?.permissions ?? claims?.permissions ?? [],
    };
    tokenStore.setUser(u);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    navigate({ to: "/login", replace: true });
  }, [navigate]);

  const value = useMemo<AuthContextValue>(() => {
    const permissions = user?.permissions ?? [];
    return {
      user,
      permissions,
      isAuthenticated: !!user,
      isReady,
      login,
      logout,
      hasRole: (r) => user?.role === r,
      hasAnyRole: (rs) => !!user && rs.includes(user.role),
      hasPermission: (p) => permissions.includes(p),
      hasAnyPermission: (ps) => ps.some((p) => permissions.includes(p)),
      hasAllPermissions: (ps) => ps.every((p) => permissions.includes(p)),
    };
  }, [user, isReady, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
