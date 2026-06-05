// Token storage abstraction. localStorage is fine for an internal portal,
// and it works cleanly with the CSR pages we render under _authenticated.
const ACCESS_KEY = "yti.accessToken";
const REFRESH_KEY = "yti.refreshToken";
const EXPIRES_KEY = "yti.expiresAt";
const USER_KEY = "yti.user";

export interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

const safeWindow = () => (typeof window === "undefined" ? null : window);

export const tokenStore = {
  get(): StoredAuth | null {
    const w = safeWindow();
    if (!w) return null;
    const accessToken = w.localStorage.getItem(ACCESS_KEY);
    const refreshToken = w.localStorage.getItem(REFRESH_KEY);
    const expiresAt = w.localStorage.getItem(EXPIRES_KEY);
    if (!accessToken || !refreshToken || !expiresAt) return null;
    return { accessToken, refreshToken, expiresAt };
  },
  set(auth: StoredAuth) {
    const w = safeWindow();
    if (!w) return;
    w.localStorage.setItem(ACCESS_KEY, auth.accessToken);
    w.localStorage.setItem(REFRESH_KEY, auth.refreshToken);
    w.localStorage.setItem(EXPIRES_KEY, auth.expiresAt);
  },
  clear() {
    const w = safeWindow();
    if (!w) return;
    w.localStorage.removeItem(ACCESS_KEY);
    w.localStorage.removeItem(REFRESH_KEY);
    w.localStorage.removeItem(EXPIRES_KEY);
    w.localStorage.removeItem(USER_KEY);
  },
  getAccessToken(): string | null {
    const w = safeWindow();
    return w ? w.localStorage.getItem(ACCESS_KEY) : null;
  },
  getRefreshToken(): string | null {
    const w = safeWindow();
    return w ? w.localStorage.getItem(REFRESH_KEY) : null;
  },
  setUser<T>(user: T) {
    const w = safeWindow();
    if (w) w.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  getUser<T>(): T | null {
    const w = safeWindow();
    if (!w) return null;
    const raw = w.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
};
