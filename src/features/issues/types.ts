export type IssueStatus = "Open" | "InProgress" | "Done" | "Blocked";
export type IssuePriority = "Low" | "Normal" | "Major" | "Critical";

export interface Issue {
  id: string;
  organizationId: string;
  projectId: string;
  projectName: string;
  title: string;
  description?: string;
  clientState?: string;
  youTrackReadableId: string;
  priority: string;
  issueType?: string;
  createdOnUtc: string;
  closedAt?: string;
  createdByUserId?: string;
  createdByUserFullName?: string;
  key?: string;
  projectShortCode?: string;
  status?: IssueStatus;
  priorityLabel?: string;
  assigneeName?: string;
  spentTime?: string;
  estimation?: string;
  starred?: boolean;
}

export type IssueSortField = "YouTrackReadableId" | "Title" | "ProjectName" | "Priority" | "ClientState" | "CreatedOnUtc";

export interface IssueListParams {
  page: number;
  pageSize: number;
  projectId?: string;
  status?: string[];
  priority?: string[];
  from?: string;
  to?: string;
  closedFrom?: string;
  closedTo?: string;
  search?: string;
  sortBy?: IssueSortField;
  sortDescending?: boolean;
}

/** 0 = Excel, 1 = CSV, 2 = PDF */
export type IssueExportFormat = 0 | 1 | 2;

export type IssueExportParams = Omit<IssueListParams, "page" | "pageSize"> & {
  format: IssueExportFormat;
};

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

export interface IssueComment {
  id: string;
  issueId: string;
  body: string;
  createdOnUtc: string;
  createdByUserId: string;
  createdByName: string;
}

export interface IssueAttachment {
  id: string;
  issueId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  createdOnUtc: string;
}

export interface CreateIssueDto {
  projectId: string;
  title: string;
  description?: string;
  priority: string;
}

export interface UpdateIssueDto {
  title: string;
  description?: string;
}

export type SavedSearchFilters = Omit<IssueListParams, "page" | "pageSize">;

export interface SavedSearch {
  id: string;
  name: string;
  isDefault: boolean;
  criteria: SavedSearchFilters;
  createdOnUtc: string;
}

export type CreateSavedSearchType = Omit<SavedSearch, "id" | "createdOnUtc">;
