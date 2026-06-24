import type { NotificationType } from "./types";

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  1: "New issue",
  2: "Status updated",
  3: "New comment",
  4: "Estimation approved",
  5: "Estimation awaiting approval",
};

export function getNotificationTypeLabel(type: NotificationType): string {
  return NOTIFICATION_TYPE_LABELS[type] ?? "Notification";
}
