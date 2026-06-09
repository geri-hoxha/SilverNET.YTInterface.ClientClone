import { apiRequest } from "@/shared/api/client";
import type { LoginResponse } from "../types";

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<LoginResponse>({
      method: "POST",
      url: "/auth/login",
      data: { email, password },
    }),
};
