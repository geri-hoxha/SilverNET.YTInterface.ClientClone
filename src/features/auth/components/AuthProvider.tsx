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
import type { AuthUser, PortalRole } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: PortalRole) => boolean;
  hasAnyRole: (roles: PortalRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = tokenStore.get();
    const storedUser = tokenStore.getUser<AuthUser>();
    if (stored && storedUser) setUser(storedUser);
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
    // Backend may or may not return user payload; synthesize a minimum.
    const u: AuthUser =
      res.user ?? {
        id: "me",
        email,
        name: email.split("@")[0],
        role: "OrganizationUser",
      };
    tokenStore.setUser(u);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    navigate({ to: "/login", replace: true });
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isReady,
      login,
      logout,
      hasRole: (r) => user?.role === r,
      hasAnyRole: (rs) => !!user && rs.includes(user.role),
    }),
    [user, isReady, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
