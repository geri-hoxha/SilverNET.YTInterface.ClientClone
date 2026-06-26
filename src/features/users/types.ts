export type UserType = "Standard" | "Reporter" | "Guest";

export interface MentionableUser {
  id: string;
  fullName: string;
  mentionHandle: string;
}

export interface PortalUser {
  id: string;
  email: string;
  fullName: string;
  organizationId: string;
  organizationName?: string;
  role: string;
  isActive: boolean;
  createdOnUtc?: string;
  createdByUserId?: string | null;
  updatedOnUtc?: string | null;
  updatedByUserId?: string | null;
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
  fullName: string;
  isActive: boolean;
  role: string;
}
