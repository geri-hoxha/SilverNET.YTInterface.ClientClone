export interface Role {
  name: string;
}

export interface ApiPaginatedResult<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
}
