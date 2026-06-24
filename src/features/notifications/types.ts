export type NotificationType =
  | 1 // IssueCreated
  | 2 // IssueStatusChanged
  | 3 // IssueCommentAdded
  | 4 // EstimationApproved
  | 5; // EstimationAwaitingApproval

export interface UserNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType: string;
  entityId: string;
  isRead: boolean;
  readAtUtc: string | null;
  createdOnUtc: string;
}

export interface NotificationListParams {
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedNotifications {
  items: UserNotification[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  count: number;
}
