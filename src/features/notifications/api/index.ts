import { apiRequest } from "@/shared/api/client";
import type {
  NotificationListParams,
  PaginatedNotifications,
  UnreadCountResponse,
  UserNotification,
} from "../types";

export const notificationsApi = {
  list: (params: NotificationListParams = {}) =>
    apiRequest<PaginatedNotifications>({
      method: "GET",
      url: "/notifications",
      params: {
        unreadOnly: params.unreadOnly ?? false,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
      },
    }),

  unreadCount: () =>
    apiRequest<UnreadCountResponse>({
      method: "GET",
      url: "/notifications/unread-count",
    }),

  markRead: (id: string) =>
    apiRequest<UserNotification>({
      method: "PATCH",
      url: `/notifications/${id}/read`,
    }),

  markAllRead: () =>
    apiRequest<void>({
      method: "PATCH",
      url: "/notifications/read-all",
    }),
};
