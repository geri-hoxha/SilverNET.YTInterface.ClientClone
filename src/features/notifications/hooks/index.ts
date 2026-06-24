import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationsApi } from "../api";
import type {
  NotificationListParams,
  PaginatedNotifications,
  UserNotification,
} from "../types";
import type { ApiError } from "@/shared/api/errors";

export const notificationsKeys = {
  all: ["notifications"] as const,
  list: (params: NotificationListParams) =>
    [...notificationsKeys.all, "list", params] as const,
  unreadCount: () => [...notificationsKeys.all, "unread-count"] as const,
};

const DEFAULT_LIST_PARAMS: NotificationListParams = {
  unreadOnly: false,
  page: 1,
  pageSize: 20,
};

export function useNotifications(params: NotificationListParams = DEFAULT_LIST_PARAMS) {
  return useQuery({
    queryKey: notificationsKeys.list(params),
    queryFn: () => notificationsApi.list(params),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationsKeys.unreadCount(),
    queryFn: () => notificationsApi.unreadCount(),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: (updated) => {
      if (updated.isRead) {
        qc.setQueryData(
          notificationsKeys.unreadCount(),
          (prev: { count: number } | undefined) => ({
            count: Math.max(0, (prev?.count ?? 0) - 1),
          }),
        );
      }
      qc.invalidateQueries({ queryKey: notificationsKeys.all });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.setQueryData(notificationsKeys.unreadCount(), { count: 0 });
      qc.invalidateQueries({ queryKey: notificationsKeys.all });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function prependNotificationToCache(
  qc: ReturnType<typeof useQueryClient>,
  notification: UserNotification,
) {
  qc.setQueryData(
    notificationsKeys.list(DEFAULT_LIST_PARAMS),
    (prev: PaginatedNotifications | undefined) => {
      if (!prev) return prev;
      if (prev.items.some((n) => n.id === notification.id)) return prev;
      return {
        ...prev,
        items: [notification, ...prev.items].slice(0, prev.pageSize),
        totalCount: prev.totalCount + 1,
      };
    },
  );

  if (!notification.isRead) {
    qc.setQueryData(
      notificationsKeys.unreadCount(),
      (prev: { count: number } | undefined) => ({
        count: (prev?.count ?? 0) + 1,
      }),
    );
  }
}

export function refetchNotificationQueries(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: notificationsKeys.unreadCount() });
  void qc.invalidateQueries({ queryKey: notificationsKeys.all });
}
