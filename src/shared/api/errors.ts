import type { AxiosError } from "axios";

export interface ApiErrorPayload {
  code: string;
  message: string;
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const FRIENDLY: Record<string, string> = {
  "auth.invalid_credentials": "The email or password you entered is incorrect.",
  "auth.invalid_refresh": "Your session has expired. Please sign in again.",
  "project.priorities_not_configured":
    "This project does not have priorities configured in YouTrack yet.",
  "issue.invalid_priority": "The selected priority is not valid for this project.",
  "issue.not_found": "Issue not found.",
  "issue.forbidden": "You do not have permission to perform this action.",
  "file.invalid_size": "The selected file exceeds the allowed size.",
};

export function normalizeError(err: unknown): ApiError {
  const ax = err as AxiosError<ApiErrorPayload>;
  if (ax?.isAxiosError) {
    const status = ax.response?.status ?? 0;
    const payload = ax.response?.data;
    const code = payload?.code ?? `http.${status || "network"}`;
    const friendly =
      FRIENDLY[code] ?? payload?.message ?? ax.message ?? "Something went wrong. Please try again.";
    return new ApiError(code, friendly, status);
  }
  if (err instanceof Error) return new ApiError("unknown", err.message, 0);
  return new ApiError("unknown", "Unexpected error", 0);
}
