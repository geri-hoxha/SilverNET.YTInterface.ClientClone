import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Trash } from "lucide-react";
import { useHideNotification } from "../hooks";
import { UserNotification } from "../types";
import { getNotificationTypeLabel } from "../utils";

type NotificationItemProps = {
  notification: UserNotification;
  onOpen: (notification: UserNotification) => void;
};

function NotificationItem({ notification, onOpen }: NotificationItemProps) {
  const hideNotification = useHideNotification();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(notification)}
      className={cn("hover:bg-primary/10 flex w-full cursor-pointer flex-col gap-0.5 rounded-md px-3 py-2 text-left", !notification.isRead && "bg-muted/50")}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm leading-snug font-medium">{notification.title}</span>
        {!notification.isRead && <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />}
      </div>
      <p className="text-muted-foreground text-xs">{notification.body}</p>
      <div className="text-muted-foreground mt-2 flex items-center gap-2 text-[11px]">
        <span>{getNotificationTypeLabel(notification.type)}</span>
        <span>·</span>
        <span>
          {formatDistanceToNow(new Date(notification.createdOnUtc), {
            addSuffix: true,
          })}
        </span>
        <button
          aria-label="Delete notification"
          title="Delete notification"
          className="text-primary hover:text-destructive -mr-0.5 ml-auto cursor-pointer text-xs font-medium"
          onClick={(e) => {
            e.stopPropagation();
            hideNotification.mutate(notification.id);
          }}
        >
          <Trash className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default NotificationItem;
