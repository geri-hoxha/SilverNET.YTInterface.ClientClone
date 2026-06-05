export type IssueStatus = "Open" | "InProgress" | "Done" | "Blocked";
export type IssuePriority = "Low" | "Normal" | "Major" | "Critical";

export interface Issue {
  id: string;
  key?: string;
  title: string;
  description?: string;
  projectId: string;
  projectName?: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeName?: string;
  createdAt: string;
}

export interface IssueListParams {
  page: number;
  pageSize: number;
  search?: string;
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
