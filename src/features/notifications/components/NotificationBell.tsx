import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useHideAllNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useUnreadNotificationCount } from "../hooks";
import type { UserNotification } from "../types";
import DeleteAllNotificationsModal from "./DeleteAllNotificationsModal";
import NotificationItem from "./NotificationItem";

export function NotificationBell() {
  const navigate = useNavigate();
  const { data: unread } = useUnreadNotificationCount();
  const { data: list, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const hideAll = useHideAllNotifications();
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const unreadCount: number = typeof unread === "number" ? unread : (unread?.count ?? 0);

  const items = list?.items ?? [];

  const handleOpen = (notification: UserNotification) => {
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }
    navigate({
      to: "/issues/$id",
      params: { id: notification.entityId },
    });
  };

  const handleDeleteAll = () => {
    hideAll.mutate(undefined, {
      onSuccess: () => setDeleteAllOpen(false),
    });
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="text-muted-foreground relative h-8 w-8" aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}>
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="text-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-700 px-1 text-[10px] font-medium">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="ml-4 flex max-h-[min(24rem,70vh)] w-90 flex-col overflow-hidden p-0 md:ml-0">
          <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {(unreadCount > 0 || items.length > 0) && (
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </Button>
                )}
                {items.length > 0 && (
                  <Button variant="ghost" size="sm" className="group hover:text-destructive h-7 gap-1 px-2 text-xs" onClick={() => setDeleteAllOpen(true)} disabled={hideAll.isPending}>
                    <Trash2 className="group-hover:text-destructive h-3.5 w-3.5" />
                    Clear All
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {isLoading ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">Loading…</p>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">No notifications yet</p>
            ) : (
              <div className="flex flex-col gap-0.5 p-1">
                {items.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} onOpen={handleOpen} />
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <DeleteAllNotificationsModal open={deleteAllOpen} onOpenChange={setDeleteAllOpen} onConfirm={handleDeleteAll} isPending={hideAll.isPending} />
    </>
  );
}
