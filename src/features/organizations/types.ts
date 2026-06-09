export interface Organization {
  id: string;
  name: string;
  isActive: boolean;
}

export interface OrganizationListParams {
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

export interface CreateOrganizationDto {
  name: string;
}

export interface UpdateOrganizationDto {
  name: string;
  isActive: boolean;
}
