import { useEffect, useRef, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import {
  prependNotificationToCache,
  refetchNotificationQueries,
} from "../hooks";
import {
  startNotificationsHub,
  stopNotificationsHub,
} from "@/shared/realtime/notificationsHub";
import type { UserNotification } from "../types";

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      void stopNotificationsHub();
      return;
    }

    const handleNotification = (notification: UserNotification) => {
      prependNotificationToCache(queryClientRef.current, notification);
      toast(notification.title, { description: notification.body });
    };

    const handleReconnected = () => {
      refetchNotificationQueries(queryClientRef.current);
    };

    void startNotificationsHub({
      onNotification: handleNotification,
      onReconnected: handleReconnected,
    }).catch(() => {
      // Hub may be unavailable in some environments; REST still works.
    });

    return () => {
      void stopNotificationsHub();
    };
  }, [isAuthenticated, isReady]);

  return children;
}
