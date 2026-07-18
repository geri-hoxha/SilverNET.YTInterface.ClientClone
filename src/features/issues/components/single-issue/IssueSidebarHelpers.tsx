import { cn } from "@/lib/utils";
import { Issue } from "../../types";

function SidebarField({ label, badge, children }: { label: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-muted-foreground mb-0.5 text-xs">{label}</div>
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0 text-sm font-medium text-nowrap">{children}</div>
        {badge}
      </div>
    </div>
  );
}

function LetterBadge({ text, color = "slate" }: { text: string; color?: "emerald" | "sky" | "amber" | "rose" | "violet" | "orange" | "slate" | "blue" }) {
  const map: Record<string, string> = {
    emerald: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    sky: "bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30",
    blue: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
    amber: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
    rose: "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
    violet: "bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30",
    orange: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30",
    slate: "bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30",
  };

  return (
    <span className={cn("inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold", map[color])} title={text}>
      {text[0]?.toUpperCase()}
    </span>
  );
}

function priorityColor(p: string): "rose" | "orange" | "emerald" | "slate" | "violet" {
  if (/critical|show-stopper|s1/i.test(p)) return "rose";
  if (/major|s2/i.test(p)) return "orange";
  if (/normal|s3/i.test(p)) return "emerald";
  if (/low|minor|s4/i.test(p)) return "slate";
  return "violet";
}

function ProjectBadge({ issue }: { issue: Issue }) {
  const code = issue.youTrackReadableId?.split("-")[0] ?? issue.projectShortCode ?? issue.projectName?.slice(0, 3).toUpperCase() ?? "?";

  return <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-slate-900 px-1 text-[10px] font-bold text-emerald-400">{code}</span>;
}

export { LetterBadge, priorityColor, ProjectBadge, SidebarField };
