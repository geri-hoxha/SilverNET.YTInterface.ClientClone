import { Download, FileText, Loader2, Paperclip } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { RichTextContent } from "@/shared/components/RichTextContent";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
import { extractAttachmentRefs } from "@/shared/components/rich-text/attachmentRefs";
import { htmlToMarkdown, markdownToHtml } from "@/shared/components/rich-text/markdown";

import { PERMISSIONS, useAuth } from "@/features/auth";
import { useMentionableUsers } from "@/features/users/hooks";
import type { ApiError } from "@/shared/api/errors";
import { IssueTypeBadge } from "@/shared/components/StatusBadge";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { formatBytes, formatDate, formatRelative } from "@/shared/utils/format";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { issuesApi } from "../api";
import { issuesKeys, useAddComment, useApproveEstimation, useIssue, useIssueAttachments, useIssueAttachmentUrls, useIssueComments, useUpdateIssue, useUploadAttachment } from "../hooks";
import { issueDetailRouteApi } from "../route";
import type { Issue, IssueAttachment } from "../types";
import { fileTypeMeta, issueReadableId, uniqueFileName } from "../utils";
import { ApproveEstimationButton } from "./ApproveEstimationButton";
import { CommentBody } from "./CommentBody";
import { MentionTextarea } from "./MentionTextarea";

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
          <AlertDescription>{(issue.error as Error)?.message ?? "Issue not found."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const data = issue.data;
  const readable = issueReadableId(data);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Main + sidebar */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main content */}
        <IssueMainContent id={id} issue={data} />

        {/* Sidebar */}
        <aside className="order-first w-full shrink-0 lg:order-last lg:w-50">
          <div className="bg-card/40 space-y-3 rounded-md border p-3 text-sm">
            <SidebarField label="Project" badge={<ProjectBadge issue={data} />}>
              <span className="cursor-pointer text-sky-500 hover:underline">{data.projectName}</span>
            </SidebarField>
            <SidebarField label="Estimation">
              <span>{data.estimation ?? "—"}</span>
            </SidebarField>

            <SidebarField label="State" badge={data.status ? <LetterBadge text={data.status} color="emerald" /> : null}>
              <span>{data.clientState ?? "—"}</span>
            </SidebarField>
            <SidebarField label="Priority" badge={<LetterBadge text={data.priorityLabel ?? data.priority} color={priorityColor(data.priorityLabel ?? data.priority)} />}>
              <span>{data.priorityLabel ?? data.priority}</span>
            </SidebarField>
            <SidebarField label="Type">
              <span>
                {" "}
                <IssueTypeBadge issueType={data.issueType || ""} />
              </span>
            </SidebarField>
            <SidebarField label="Created">
              <span>{formatDate(data.createdOnUtc)}</span>
            </SidebarField>
            <SidebarField label="Created by">{data.createdByUserFullName ? <div className=" ">{data.createdByUserFullName}</div> : <span>—</span>}</SidebarField>
            <SidebarField label="ID">
              <span className="font-mono text-xs">{readable}</span>
            </SidebarField>
          </div>
        </aside>
      </div>
    </div>
  );
}

function IssueMainContent({ id, issue }: { id: string; issue: Issue }) {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission(PERMISSIONS.issuesUpdate);
  const canApproveEstimation = hasPermission(PERMISSIONS.issuesEstimationApprove);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(issue.title);
  // Editor works in HTML; the issue stores Markdown, so convert at the boundary.
  const [description, setDescription] = useState(() => markdownToHtml(issue.description));
  const update = useUpdateIssue(id);
  const approveEstimation = useApproveEstimation();
  const { urls: attachmentUrls, ensure } = useIssueAttachmentUrls(id);
  // Used so staged inline names never collide with already-uploaded files.
  const attachmentsQ = useIssueAttachments(id);
  const existingAttachmentNames = attachmentsQ.data?.items.map((a) => a.fileName) ?? [];

  // Files pasted/dropped/attached into the description while editing are
  // staged here (like CreateIssueDialog) instead of being uploaded immediately.
  // Nothing hits the network until Save is pressed, so Cancel never leaves an
  // orphaned attachment behind.
  const inlineFilesRef = useRef<Map<string, File>>(new Map());

  useEffect(() => {
    if (!editing) {
      setTitle(issue.title);
      setDescription(markdownToHtml(issue.description));
    }
  }, [issue.title, issue.description, editing]);

  // Resolve inline references in whatever description is currently shown so both
  // the read view and the editor preview can display them. This only resolves
  // *already-uploaded* attachments (existing refs); newly staged files preview
  // via their own local blob URL inside RichTextEditor and don't need this.
  useEffect(() => {
    ensure(extractAttachmentRefs(description));
  }, [description, ensure]);

  // Stage a pasted/dropped/attached file locally and return the reference name
  // to embed in the description. No network call happens here.
  //
  // Names are unique against staged files, refs already in the description, and
  // existing uploaded attachments. Without that, a deleted Lightshot-style
  // "image.png" paste can still match an older ![…](image.png) ref on Save and
  // get uploaded as a duplicate.
  const stageInlineFile = useCallback(
    (file: File): string => {
      const used = new Set<string>([...inlineFilesRef.current.keys(), ...extractAttachmentRefs(description), ...existingAttachmentNames]);
      const fileName = uniqueFileName(file.name, used);
      const staged = fileName === file.name ? file : new File([file], fileName, { type: file.type });
      inlineFilesRef.current.set(fileName, staged);
      return fileName;
    },
    [description, existingAttachmentNames],
  );

  // Keep description state in sync and immediately drop staged files the user
  // has removed, so a paste+delete never reaches the upload step.
  const handleDescriptionChange = useCallback((html: string) => {
    setDescription(html);
    const stillReferenced = new Set(extractAttachmentRefs(html));
    for (const name of [...inlineFilesRef.current.keys()]) {
      if (!stillReferenced.has(name)) {
        inlineFilesRef.current.delete(name);
      }
    }
  }, []);

  const startEdit = () => {
    setTitle(issue.title);
    setDescription(markdownToHtml(issue.description));
    inlineFilesRef.current = new Map();
    setEditing(true);
  };

  const cancelEdit = () => {
    // Nothing was ever uploaded, so cancelling is just discarding local state.
    inlineFilesRef.current = new Map();
    setTitle(issue.title);
    setDescription(markdownToHtml(issue.description));
    setEditing(false);
  };

  const save = async () => {
    if (title.trim().length < 3) return;

    let markdown = htmlToMarkdown(description);

    // A staged file may have been pasted and then removed from the description
    // before saving (e.g. deleted, or undone). Only upload files whose
    // reference is still present in the current description — otherwise a
    // deleted image would still silently end up as a permanent attachment.
    const referenced = new Set(extractAttachmentRefs(description));
    const staged = [...inlineFilesRef.current.entries()].filter(([name]) => referenced.has(name));

    if (staged.length > 0) {
      const results = await Promise.allSettled(staged.map(([, file]) => issuesApi.uploadAttachment(id, file)));

      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        toast.error(failed === staged.length ? "Failed to upload attached files" : `${failed} of ${staged.length} attached file(s) failed to upload`);
      }

      // If the backend stored a staged file under a different name, rewrite the
      // markdown reference so it still resolves.
      staged.forEach(([stagedName], i) => {
        const r = results[i];
        if (r.status === "fulfilled" && r.value.fileName !== stagedName) {
          markdown = markdown.split(`](${stagedName})`).join(`](${r.value.fileName})`);
        }
      });

      await qc.invalidateQueries({ queryKey: issuesKeys.attachments(id) });
    }

    await update.mutateAsync({
      title: title.trim(),
      description: markdown,
    });

    inlineFilesRef.current = new Map();
    setEditing(false);
  };

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-4 flex items-start justify-between gap-4">
        {editing ? (
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="min-w-0 flex-1 text-xl font-semibold" autoFocus />
        ) : (
          <h1 className="min-w-0 flex-1 text-xl leading-snug font-semibold">{issue.title}</h1>
        )}
        {!editing && (
          <div className="flex shrink-0 items-center gap-2">
            {canApproveEstimation && (
              <ApproveEstimationButton
                variant="text"
                clientState={issue.clientState}
                issueTitle={issue.title}
                confirmBeforeApprove
                onApprove={() => approveEstimation.mutate(id)}
                isPending={approveEstimation.isPending}
              />
            )}
            {canUpdate && (
              <Button
                type="button"
                size="sm"
                className="h-8 border border-blue-200/70 bg-blue-50 text-blue-600 shadow-sm hover:border-blue-300 hover:bg-blue-100 hover:text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-950/70 dark:hover:text-blue-300"
                onClick={startEdit}
              >
                Edit Issue
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="mb-6 text-sm leading-relaxed">
        {editing ? (
          <div className="space-y-4">
            <RichTextEditor
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Type or paste a description of the issue here"
              minHeight={200}
              onUploadFile={async (file) => stageInlineFile(file)}
              attachmentUrls={attachmentUrls}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={cancelEdit} disabled={update.isPending}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={save} disabled={update.isPending || title.trim().length < 3}>
                {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        ) : issue.description ? (
          <RichTextContent markdown={issue.description} attachmentUrls={attachmentUrls} onReferences={ensure} />
        ) : (
          <p className="text-muted-foreground italic">No description</p>
        )}
      </div>

      <div className="border-t pt-4">
        <CommentsArea id={id} />
        <AttachmentsArea id={id} />
      </div>
    </div>
  );
}

function SidebarField({ label, badge, children }: { label: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-muted-foreground mb-0.5 text-xs">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 truncate text-sm font-medium">{children}</div>
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

function AssigneeAvatar({ name }: { name?: string }) {
  return <UserAvatar name={name} className="h-5 w-5 text-[10px]" />;
}

function CommentsArea({ id }: { id: string }) {
  const { user, hasPermission } = useAuth();
  const canComment = hasPermission(PERMISSIONS.issuesCommentsCreate);
  const q = useIssueComments(id);
  const usersQ = useMentionableUsers();
  const add = useAddComment(id);
  const [text, setText] = useState("");
  const comments = q.data?.items ?? [];
  const mentionableUsers = usersQ.data ?? [];

  const submit = async () => {
    if (!text.trim()) return;
    await add.mutateAsync(text.trim());
    setText("");
  };

  return (
    <div className="space-y-4">
      {q.isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : comments.length ? (
        <ul className="space-y-6">
          {comments.map((c) => {
            const author = c.createdByName || "User";
            return (
              <li key={c.id} className="flex gap-3">
                <UserAvatar name={author} className="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="cursor-pointer font-semibold text-sky-500 hover:underline">{author}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">Commented {formatRelative(c.createdOnUtc)}</span>
                  </div>
                  <CommentBody body={c.body} users={mentionableUsers} className="mt-1 text-sm" />
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {canComment && (
        <div className="flex gap-3">
          <UserAvatar name={user?.fullName} seed={user?.id} className="h-8 w-8" />
          <div className="flex-1 space-y-2">
            <MentionTextarea placeholder="Write a comment" value={text} onChange={setText} users={mentionableUsers} rows={2} />
            {text.trim() && (
              <div className="flex justify-end">
                <Button onClick={submit} disabled={add.isPending} size="sm">
                  {add.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Post
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AttachmentsArea({ id }: { id: string }) {
  const { hasPermission } = useAuth();
  const canAttach = hasPermission(PERMISSIONS.issuesAttachmentsCreate);
  const q = useIssueAttachments(id);
  const upload = useUploadAttachment(id);
  const fileInput = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const attachments = q.data?.items ?? [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    e.target.value = "";
  };

  const handleDownload = async (attachment: IssueAttachment) => {
    setDownloadingId(attachment.id);
    try {
      const blob = await issuesApi.downloadAttachment(id, attachment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error((e as ApiError).message ?? "Failed to download file");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Attachments</div>
        {canAttach && (
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={upload.isPending} onClick={() => fileInput.current?.click()}>
            {upload.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Paperclip className="mr-1.5 h-3.5 w-3.5" />}
            Attach file
          </Button>
        )}
      </div>

      {q.isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : attachments.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {attachments.map((a) => {
            const meta = fileTypeMeta(a.fileName);
            return (
              <div key={a.id} className={cn("flex items-center gap-3 rounded-md border px-3 py-2", meta.bg, meta.border)}>
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white uppercase", meta.badge)}>
                  {meta.label ? meta.label : <FileText className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-foreground truncate text-sm font-medium">{a.fileName}</div>
                  <div className="text-muted-foreground text-xs">
                    {meta.typeLabel} · {formatBytes(a.fileSize)}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0"
                  disabled={downloadingId === a.id}
                  onClick={() => handleDownload(a)}
                  aria-label={`Download ${a.fileName}`}
                >
                  {downloadingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </Button>
              </div>
            );
          })}
        </div>
      ) : canAttach ? (
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={upload.isPending}
          className="text-muted-foreground hover:border-foreground/30 hover:text-foreground flex w-full items-center justify-center rounded-md border border-dashed py-6 text-sm transition-colors disabled:opacity-50"
        >
          <Paperclip className="mr-2 h-4 w-4" />
          Click to attach a file
        </button>
      ) : (
        <p className="text-muted-foreground py-4 text-sm italic">No attachments</p>
      )}

      {canAttach && <input ref={fileInput} type="file" className="hidden" onChange={handleFileSelect} />}
    </div>
  );
}

{
  /* <div className="mb-4 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>
            Created by{" "}
            <span className="text-sky-500 hover:underline cursor-pointer">
              {data.assigneeName ?? "Unknown"}
            </span>{" "}
            {formatRelative(data.createdOnUtc)}
          </span>
          <span className="hidden sm:inline">·</span>
          <span>
            Updated by{" "}
            <span className="text-sky-500 hover:underline cursor-pointer">
              {data.assigneeName ?? "Unknown"}
            </span>{" "}
            {formatRelative(data.createdOnUtc)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 hover:text-foreground">
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Visible to issue readers</span>
            <span className="sm:hidden">Visible</span>
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
      </div> */
}
