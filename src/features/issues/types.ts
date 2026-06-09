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

export interface IssueListParams {
  page: number;
  pageSize: number;
  status?: IssueStatus;
  projectId?: string;
  sort?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IssueComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface IssueAttachment {
  id: string;
  fileName: string;
  size: number;
  uploadedAt: string;
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
