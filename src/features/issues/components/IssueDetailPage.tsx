import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Pencil,
  Paperclip,
  Loader2,
  Star,
  Tag,
  Link as LinkIcon,
  MoreHorizontal,
  Eye,
  ThumbsUp,
  MessageSquare,
  Clock,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import {
  useIssue,
  useIssueComments,
  useIssueAttachments,
  useAddComment,
  useUploadAttachment,
} from "../hooks";
import { formatBytes, formatDate, formatRelative } from "@/shared/utils/format";
import { issueDetailRouteApi } from "../route";
import { issueReadableId } from "../utils";
import type { Issue } from "../types";

export function IssueDetailPage() {
  const { id } = issueDetailRouteApi.useParams();
  const issue = useIssue(id);

  if (issue.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (issue.isError || !issue.data) {
    return (
      <div className="mx-auto max-w-6xl">
        <Alert variant="destructive">
          <AlertDescription>
            {(issue.error as Error)?.message ?? "Issue not found."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const data = issue.data;
  const readable = issueReadableId(data);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Top meta row */}
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            Created by{" "}
            <span className="text-sky-500 hover:underline cursor-pointer">
              {data.assigneeName ?? "Unknown"}
            </span>{" "}
            {formatRelative(data.createdAt)}
          </span>
          <span>·</span>
          <span>
            Updated by{" "}
            <span className="text-sky-500 hover:underline cursor-pointer">
              {data.assigneeName ?? "Unknown"}
            </span>{" "}
            {formatRelative(data.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 hover:text-foreground">
            <Eye className="h-3.5 w-3.5" />
            Visible to issue readers
          </button>
          <div className="flex items-center gap-1">
            <button className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent">
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <span>1</span>
            <button className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent">
              <Star className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main + sidebar */}
      <div className="flex gap-6">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Title */}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <button className="mt-1.5">
                <Star className="h-4 w-4 text-muted-foreground hover:text-amber-400" />
              </button>
              <h1 className="text-xl font-semibold leading-snug">
                {data.title}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
              <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                <Link to="/issues/$id/edit" params={{ id }}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Tag className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <LinkIcon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6 text-sm leading-relaxed">
            {data.description ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: data.description }}
              />
            ) : (
              <p className="italic text-muted-foreground">No description</p>
            )}
          </div>

          {/* Activity */}
          <div className="border-t pt-4">
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <button className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent hover:text-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
                <button className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent hover:text-foreground">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </button>
                <button className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent hover:text-foreground">
                  <Clock className="h-3.5 w-3.5" />
                </button>
              </div>
              <button className="hover:text-foreground">
                Activity settings ▾
              </button>
            </div>

            <CommentsArea id={id} />
            <AttachmentsArea id={id} />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-[200px] shrink-0">
          <div className="rounded-md border bg-card/40 p-3 space-y-3 text-sm">
            <SidebarField label="Project" badge={<ProjectBadge issue={data} />}>
              <span className="text-sky-500 hover:underline cursor-pointer">
                {data.projectName}
              </span>
            </SidebarField>
            {data.spentTime && (
              <SidebarField label="Estimation">
                <span>{data.spentTime}</span>
              </SidebarField>
            )}
            <SidebarField
              label="Client State"
              badge={
                data.clientState ? (
                  <LetterBadge text={data.clientState} color="emerald" />
                ) : null
              }
            >
              <span>{data.clientState ?? "—"}</span>
            </SidebarField>
            <SidebarField
              label="State"
              badge={
                data.status ? <LetterBadge text={data.status} color="emerald" /> : null
              }
            >
              <span>{data.status ?? "—"}</span>
            </SidebarField>
            <SidebarField
              label="Priority"
              badge={
                <LetterBadge
                  text={data.priorityLabel ?? data.priority}
                  color={priorityColor(data.priorityLabel ?? data.priority)}
                />
              }
            >
              <span>{data.priorityLabel ?? data.priority}</span>
            </SidebarField>
            <SidebarField label="Assignee" badge={<AssigneeAvatar name={data.assigneeName} />}>
              <span>{data.assigneeName ?? "Unassigned"}</span>
            </SidebarField>
            <SidebarField label="Created">
              <span>{formatDate(data.createdAt)}</span>
            </SidebarField>
            <SidebarField label="ID">
              <span className="font-mono text-xs">{readable}</span>
            </SidebarField>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SidebarField({
  label,
  badge,
  children,
}: {
  label: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-0.5 text-xs text-muted-foreground">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 truncate text-sm font-medium">{children}</div>
        {badge}
      </div>
    </div>
  );
}

function LetterBadge({
  text,
  color = "slate",
}: {
  text: string;
  color?: "emerald" | "sky" | "amber" | "rose" | "violet" | "orange" | "slate" | "blue";
}) {
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
    <span
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold",
        map[color],
      )}
      title={text}
    >
      {text[0]?.toUpperCase()}
    </span>
  );
}

function priorityColor(
  p: string,
): "rose" | "orange" | "emerald" | "slate" | "violet" {
  if (/critical|show-stopper|s1/i.test(p)) return "rose";
  if (/major|s2/i.test(p)) return "orange";
  if (/normal|s3/i.test(p)) return "emerald";
  if (/low|minor|s4/i.test(p)) return "slate";
  return "violet";
}

function ProjectBadge({ issue }: { issue: Issue }) {
  const code =
    issue.youTrackReadableId?.split("-")[0] ??
    issue.projectShortCode ??
    issue.projectName?.slice(0, 3).toUpperCase() ??
    "?";
  return (
    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-slate-900 px-1 text-[10px] font-bold text-emerald-400">
      {code}
    </span>
  );
}

function AssigneeAvatar({ name }: { name?: string }) {
  return (
    <Avatar className="h-5 w-5">
      <AvatarFallback className="bg-violet-500 text-[10px] text-white">
        {name?.[0]?.toUpperCase() ?? "?"}
      </AvatarFallback>
    </Avatar>
  );
}

function CommentsArea({ id }: { id: string }) {
  const q = useIssueComments(id);
  const add = useAddComment(id);
  const [text, setText] = useState("");

  const submit = async () => {
    if (!text.trim()) return;
    await add.mutateAsync(text);
    setText("");
  };

  return (
    <div className="space-y-4">
      {q.isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : q.data?.length ? (
        <ul className="space-y-6">
          {q.data.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-violet-500 text-xs text-white">
                  {c.authorName?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-sky-500 hover:underline cursor-pointer">
                    {c.authorName}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    Commented {formatRelative(c.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm whitespace-pre-wrap break-words">
                  {c.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-fuchsia-500 text-xs text-white">
            GH
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Write a comment, @mention people"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="resize-none bg-muted/30"
          />
          {text.trim() && (
            <div className="flex justify-end">
              <Button
                onClick={submit}
                disabled={add.isPending}
                size="sm"
              >
                {add.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AttachmentsArea({ id }: { id: string }) {
  const q = useIssueAttachments(id);
  const upload = useUploadAttachment(id);
  const fileInput = useRef<HTMLInputElement>(null);

  if (!q.data?.length && !q.isLoading) return null;

  return (
    <div className="mt-6">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Attachments
      </div>
      {q.isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <ul className="divide-y rounded-md border">
          {q.data!.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 px-3 py-2 text-sm"
            >
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 truncate">{a.fileName}</span>
              <span className="text-xs text-muted-foreground">
                {formatBytes(a.size)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={fileInput}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload.mutate(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
