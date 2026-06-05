import type { PortalRole } from "@/features/auth/types";

export type UserType = "Standard" | "Reporter" | "Guest";

export interface PortalUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  emailVerified?: boolean;
  avatarUrl?: string | null;
  userType: UserType;
  role: PortalRole;
  banned?: boolean;
  organizationId?: string;
  organizationName?: string;
  vcsUsernames?: string[];
  registrationDate: string;
  timeZoneRegion?: string;
  timeZoneCity?: string;
  language?: string;
  dateFormat?: string;
  periodFormat?: string;
  firstDayOfWeek?: "Sunday" | "Monday";
  defaultSorting?: "Relevance" | "Updated";
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: PortalRole;
  organizationId?: string;
  banned?: boolean;
  sort?: "name" | "registrationDate";
  order?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
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
