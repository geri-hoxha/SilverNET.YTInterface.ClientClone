import { useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { notificationsApi } from "../api";
import {
  notificationsKeys,
  prependNotificationToCache,
  refetchNotificationQueries,
} from "../hooks";
import { showNotificationToast } from "./NotificationToast";
import type { UserNotification } from "../types";

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { isAuthenticated, isReady } = useAuth();
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  const navigateRef = useRef(navigate);
  queryClientRef.current = queryClient;
  navigateRef.current = navigate;

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      return;
    }

    let stopped = false;
    let stopHub: (() => Promise<void>) | null = null;

    const handleNotification = (notification: UserNotification) => {
      prependNotificationToCache(queryClientRef.current, notification);

      showNotificationToast(notification, () => {
        if (!notification.isRead) {
          void notificationsApi.markRead(notification.id).then(() => {
            queryClientRef.current.setQueryData(
              notificationsKeys.unreadCount(),
              (prev: { count: number } | undefined) => ({
                count: Math.max(0, (prev?.count ?? 0) - 1),
              }),
            );
            refetchNotificationQueries(queryClientRef.current);
          });
        }

        void navigateRef.current({
          to: "/issues/$id",
          params: { id: notification.entityId },
        });
      });
    };

    const handleReconnected = () => {
      refetchNotificationQueries(queryClientRef.current);
    };

    void import("@/shared/realtime/notificationsHub")
      .then(({ startNotificationsHub, stopNotificationsHub }) => {
        if (stopped) return;
        stopHub = stopNotificationsHub;
        return startNotificationsHub({
          onNotification: handleNotification,
          onReconnected: handleReconnected,
        });
      })
      .catch(() => {
        // Hub may be unavailable in some environments; REST still works.
      });

    return () => {
      stopped = true;
      void stopHub?.();
    };
  }, [isAuthenticated, isReady]);

  return children;
}
