export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  organizationId?: string;
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

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  youTrackProjectId: string;
  isActive: boolean;
  priorityOptions: string[];
  clientStates: string[];
}

export interface CreateProjectDto {
  organizationId: string;
  name: string;
  youTrackProjectId: string;
}

export interface UpdateProjectDto {
  name: string;
  youTrackProjectId: string;
  isActive: boolean;
}
