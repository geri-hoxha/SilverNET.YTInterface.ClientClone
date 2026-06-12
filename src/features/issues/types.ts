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
  createdAt: string;
  key?: string;
  projectShortCode?: string;
  status?: IssueStatus;
  priorityLabel?: string;
  assigneeName?: string;
  spentTime?: string;
  starred?: boolean;
}

export type IssueSortField =
  | "YouTrackReadableId"
  | "Title"
  | "ProjectName"
  | "Priority"
  | "ClientState"
  | "CreatedAt";

export interface IssueListParams {
  page: number;
  pageSize: number;
  projectId?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  from?: string;
  to?: string;
  search?: string;
  sortBy?: IssueSortField;
  sortDescending?: boolean;
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

export interface IssueComment {
  id: string;
  issueId: string;
  body: string;
  createdAt: string;
  authorName?: string;
}

export interface IssueAttachment {
  id: string;
  issueId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface CreateIssueDto {
  projectId: string;
  title: string;
  description?: string;
  priority: IssuePriority;
}

export interface UpdateIssueDto {
  title: string;
  description?: string;
}
