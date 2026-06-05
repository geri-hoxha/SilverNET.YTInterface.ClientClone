import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Paperclip,
  MessageSquare,
  Info,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  useIssue,
  useIssueComments,
  useIssueAttachments,
  useAddComment,
  useUploadAttachment,
} from "@/features/issues/hooks";
import { StatusBadge, PriorityBadge } from "@/shared/components/StatusBadge";
import { formatBytes, formatDate, formatRelative } from "@/shared/utils/format";

export const Route = createFileRoute("/_authenticated/issues/$id")({
  component: IssueDetailPage,
});

function IssueDetailPage() {
  const { id } = Route.useParams();
  const issue = useIssue(id);

  if (issue.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (issue.isError || !issue.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {(issue.error as Error)?.message ?? "Issue not found."}
        </AlertDescription>
      </Alert>
    );
  }

  const data = issue.data;

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/issues">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to issues
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/issues/$id/edit" params={{ id }}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                {data.key ?? data.id} · {data.projectName ?? data.projectId}
              </div>
              <CardTitle className="text-xl">{data.title}</CardTitle>
            </div>
            <div className="flex gap-2 shrink-0">
              <StatusBadge status={data.status} />
              <PriorityBadge priority={data.priority} />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">
            <Info className="mr-2 h-4 w-4" /> Details
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="mr-2 h-4 w-4" /> Comments
          </TabsTrigger>
          <TabsTrigger value="attachments">
            <Paperclip className="mr-2 h-4 w-4" /> Attachments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Field label="Description">
                <div className="text-sm whitespace-pre-wrap">
                  {data.description || (
                    <span className="text-muted-foreground italic">No description</span>
                  )}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Assignee">
                  <span className="text-sm">{data.assigneeName ?? "Unassigned"}</span>
                </Field>
                <Field label="Created">
                  <span className="text-sm">{formatDate(data.createdAt)}</span>
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments">
          <CommentsTab id={id} />
        </TabsContent>

        <TabsContent value="attachments">
          <AttachmentsTab id={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}

function CommentsTab({ id }: { id: string }) {
  const q = useIssueComments(id);
  const add = useAddComment(id);
  const [text, setText] = useState("");

  const submit = async () => {
    if (!text.trim()) return;
    await add.mutateAsync(text);
    setText("");
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {q.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : q.isError ? (
          <p className="text-sm text-destructive">{(q.error as Error).message}</p>
        ) : !q.data?.length ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <ul className="space-y-4">
            {q.data.map((c) => (
              <li key={c.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {c.authorName?.[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{c.authorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t pt-4 space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              onClick={submit}
              disabled={add.isPending || !text.trim()}
              size="sm"
            >
              {add.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post comment
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AttachmentsTab({ id }: { id: string }) {
  const q = useIssueAttachments(id);
  const upload = useUploadAttachment(id);
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Attachment download is not available yet.
          </AlertDescription>
        </Alert>

        {q.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : q.isError ? (
          <p className="text-sm text-destructive">{(q.error as Error).message}</p>
        ) : !q.data?.length ? (
          <p className="text-sm text-muted-foreground">No attachments.</p>
        ) : (
          <ul className="divide-y border rounded-md">
            {q.data.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 px-3 py-2 text-sm"
              >
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate">{a.fileName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatBytes(a.size)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatRelative(a.uploadedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
            disabled={upload.isPending}
          >
            {upload.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="mr-2 h-4 w-4" />
            )}
            Upload file
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
