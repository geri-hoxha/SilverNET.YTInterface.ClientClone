import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { tokenStore } from "./tokens";
import { normalizeError } from "./errors";

// Dev uses the Vite proxy (/api); production sets VITE_API_BASE_URL to the full API origin.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// --- Request interceptor: inject bearer token --------------------------------
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token && !config.headers?.Authorization) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// --- Refresh queue -----------------------------------------------------------
type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;
let onSessionExpiredCb: (() => void) | null = null;

export function onSessionExpired(cb: () => void) {
  onSessionExpiredCb = cb;
}

async function performRefresh(): Promise<string | null> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<{
      accessToken: string;
      refreshToken: string;
      expiresAt: string;
    }>(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    tokenStore.set(data);
    return data.accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/")
    ) {
      original._retry = true;
      refreshPromise = refreshPromise ?? performRefresh();
      const newToken = await refreshPromise;
      refreshPromise = null;

      if (newToken) {
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return api.request(original);
      }
      tokenStore.clear();
      onSessionExpiredCb?.();
    }

    return Promise.reject(normalizeError(error));
  },
);

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await api.request<T>(config);
  return res.data;
}
