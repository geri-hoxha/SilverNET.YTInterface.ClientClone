import type { PortalRole } from "@/features/auth/types";

export type UserType = "Standard" | "Reporter" | "Guest";

export interface PortalUser {
  id: string;
  email: string;
  fullName: string;
  organizationId: string;
  isActive: boolean;
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiPaginatedResult<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

export interface CreateUserDto {
  email: string;
  fullName: string;
  password: string;
  organizationId: string;
  role: string;
}

export interface UpdateUserDto {
  fullName?: string;
  username?: string;
  email?: string;
  userType?: UserType;
  role?: PortalRole;
  vcsUsernames?: string[];
  timeZoneRegion?: string;
  timeZoneCity?: string;
  language?: string;
  dateFormat?: string;
  periodFormat?: string;
  firstDayOfWeek?: "Sunday" | "Monday";
  defaultSorting?: "Relevance" | "Updated";
}
