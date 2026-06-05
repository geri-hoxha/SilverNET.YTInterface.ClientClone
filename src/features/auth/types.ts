export type PortalRole =
  | "SuperAdmin"
  | "OrganizationAdmin"
  | "OrganizationUser";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: PortalRole;
  organizationId?: string;
  organizationName?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user?: AuthUser;
}
