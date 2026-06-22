export type PortalRole =
  | "SuperAdmin"
  | "OrganizationAdmin"
  | "OrganizationUser";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: PortalRole;
  organizationId?: string;
  organizationName?: string;
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  fullName: string;
  email: string;
  permissions?: string[];
  user?: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  permissions?: string[];
}
