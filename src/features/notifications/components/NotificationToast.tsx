import { formatDistanceToNow } from "date-fns";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  getNotificationTypeAccent,
  getNotificationTypeIcon,
  getNotificationTypeLabel,
} from "../utils";
import type { UserNotification } from "../types";

interface NotificationToastProps {
  notification: UserNotification;
  onView: () => void;
  onDismiss: () => void;
}

export function showNotificationToast(
  notification: UserNotification,
  onView: () => void,
) {
  return toast.custom(
    (id) => (
      <NotificationToast
        notification={notification}
        onView={() => {
          onView();
          toast.dismiss(id);
        }}
        onDismiss={() => toast.dismiss(id)}
      />
    ),
    {
      duration: 10_000,
      unstyled: true,
    },
  );
}

export function NotificationToast({
  notification,
  onView,
  onDismiss,
}: NotificationToastProps) {
  const Icon = getNotificationTypeIcon(notification.type);
  const typeLabel = getNotificationTypeLabel(notification.type);
  const accent = getNotificationTypeAccent(notification.type);

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto relative w-[min(100vw-2rem,22rem)] overflow-hidden rounded-lg border bg-background shadow-lg",
        !notification.isRead && "border-primary/30 ring-1 ring-primary/10",
      )}
    >
      {!notification.isRead && (
        <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden />
      )}

      <div className="flex gap-3 p-3 pl-4">
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            accent,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {typeLabel}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onView}
            className="w-full text-left transition-opacity hover:opacity-90"
          >
            <p className="text-sm font-semibold leading-snug text-foreground">
              {notification.title}
            </p>
            {notification.body ? (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {notification.body}
              </p>
            ) : null}
          </button>

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdOnUtc), {
                addSuffix: true,
              })}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-primary hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
            >
              View issue
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
