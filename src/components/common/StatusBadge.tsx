import { Badge } from "@/components/ui/badge";
import type { IssuePriority, IssueStatus } from "@/features/issues/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<IssueStatus, string> = {
  Open: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  InProgress: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  Done: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  Blocked: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

// Color families mirror the create-issue priority picker (priorityBadgeBg):
// critical -> red, major -> orange, normal -> yellow, low/minor -> emerald.
const PRIORITY_STYLE_BY_TIER = {
  critical: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  major: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  normal: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
  low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
} as const;

const DEFAULT_PRIORITY_STYLE = "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25";

function priorityStyle(priority: string): string {
  const n = priority.toLowerCase();
  if (/(critical|show-?stopper|blocker|s1)/.test(n)) return PRIORITY_STYLE_BY_TIER.critical;
  if (/(major|high|s2)/.test(n)) return PRIORITY_STYLE_BY_TIER.major;
  if (/(normal|medium|s3)/.test(n)) return PRIORITY_STYLE_BY_TIER.normal;
  if (/(minor|low|s4)/.test(n)) return PRIORITY_STYLE_BY_TIER.low;
  return DEFAULT_PRIORITY_STYLE;
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[status])}>
      {status === "InProgress" ? "In Progress" : status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: IssuePriority | string }) {
  return (
    <Badge variant="outline" className={cn("font-medium text-nowrap", priorityStyle(priority))}>
      {priority}
    </Badge>
  );
}

const ISSUE_TYPE_STYLE_BY_KIND = {
  bug: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  task: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  feature: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  epic: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30",
  story: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
} as const;

const DEFAULT_ISSUE_TYPE_STYLE = "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25";

function issueTypeStyle(issueType: string): string {
  const n = issueType.toLowerCase();
  if (/(bug|defect|incident)/.test(n)) return ISSUE_TYPE_STYLE_BY_KIND.bug;
  if (/(task|chore|sub-?task)/.test(n)) return ISSUE_TYPE_STYLE_BY_KIND.task;
  if (/(feature|enhancement|improvement)/.test(n)) return ISSUE_TYPE_STYLE_BY_KIND.feature;
  if (/(epic)/.test(n)) return ISSUE_TYPE_STYLE_BY_KIND.epic;
  if (/(story|user story)/.test(n)) return ISSUE_TYPE_STYLE_BY_KIND.story;
  return DEFAULT_ISSUE_TYPE_STYLE;
}

export function IssueTypeBadge({ issueType }: { issueType: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", issueTypeStyle(issueType))}>
      {issueType}
    </Badge>
  );
}

// Client/workflow states are free-form YouTrack values, so map them by meaning
// to a consistent set of text colors.
const CLIENT_STATE_TEXT_BY_TIER = {
  positive: "text-emerald-600 dark:text-emerald-400",
  inProgress: "text-amber-600 dark:text-amber-400",
  info: "text-sky-600 dark:text-sky-400",
  attention: "text-orange-600 dark:text-orange-400",
  negative: "text-red-600 dark:text-red-400",
  neutral: "text-foreground",
} as const;

export function clientStateTextColor(state: string): string {
  const n = state.toLowerCase();
  if (/(refus|reject|declin|block|cancel|won'?t fix|wontfix|fail)/.test(n)) return CLIENT_STATE_TEXT_BY_TIER.negative;
  if (/(done|approv|resolv|fixed|complete|verified|closed)/.test(n)) return CLIENT_STATE_TEXT_BY_TIER.positive;
  if (/(progress|pending|awaiting|review|estimat)/.test(n)) return CLIENT_STATE_TEXT_BY_TIER.inProgress;
  if (/(needs|on hold|hold|waiting)/.test(n)) return CLIENT_STATE_TEXT_BY_TIER.attention;
  if (/(provided|open|new|to do|todo|reopen)/.test(n)) return CLIENT_STATE_TEXT_BY_TIER.info;
  return CLIENT_STATE_TEXT_BY_TIER.neutral;
}
