import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import type { NotificationType } from "./types";

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  1: "New issue",
  2: "Status updated",
  3: "New comment",
  4: "Estimation approved",
  5: "Estimation awaiting approval",
};

const NOTIFICATION_TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  1: PlusCircle,
  2: RefreshCw,
  3: MessageSquare,
  4: CheckCircle2,
  5: Clock,
};

const NOTIFICATION_TYPE_ACCENTS: Record<NotificationType, string> = {
  1: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  2: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  3: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  4: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  5: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

export function getNotificationTypeLabel(type: NotificationType): string {
  return NOTIFICATION_TYPE_LABELS[type] ?? "Notification";
}

export function getNotificationTypeIcon(type: NotificationType): LucideIcon {
  return NOTIFICATION_TYPE_ICONS[type] ?? AlertCircle;
}

export function getNotificationTypeAccent(type: NotificationType): string {
  return NOTIFICATION_TYPE_ACCENTS[type] ?? "bg-muted text-muted-foreground";
}
