import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSIONS, useAuth } from "@/features/auth";
import { useMentionableUsers } from "@/features/users/hooks";
import { extractAttachmentRefs } from "@/shared/components/rich-text/attachmentRefs";
import { htmlToMarkdown } from "@/shared/components/rich-text/markdown";
import { RichTextContent } from "@/shared/components/RichTextContent";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { formatRelative } from "@/shared/utils/format";

import { issuesApi } from "../../api";
import { issuesKeys, useAddComment, useIssueAttachments, useIssueAttachmentUrls, useIssueComments } from "../../hooks";
import { uniqueFileName } from "../../utils";

export function CommentsArea({ id }: { id: string }) {
  const { user, hasPermission } = useAuth();
  const canComment = hasPermission(PERMISSIONS.issuesCommentsCreate);
  const q = useIssueComments(id);
  const usersQ = useMentionableUsers();
  const add = useAddComment(id);
  const qc = useQueryClient();

  const [bodyHtml, setBodyHtml] = useState("");
  const { urls: attachmentUrls, ensure } = useIssueAttachmentUrls(id);
  const attachmentsQ = useIssueAttachments(id);
  const existingAttachmentNames = attachmentsQ.data?.items.map((a) => a.fileName) ?? [];

  // Same staging pattern as the description editor: files pasted/dropped into
  // the comment box don't upload until the comment is actually posted.
  const inlineFilesRef = useRef<Map<string, File>>(new Map());

  const comments = q.data?.items ?? [];
  const mentionableUsers = usersQ.data ?? [];

  useEffect(() => {
    ensure(extractAttachmentRefs(bodyHtml));
  }, [bodyHtml, ensure]);

  const stageInlineFile = useCallback(
    (file: File): string => {
      const used = new Set<string>([...inlineFilesRef.current.keys(), ...extractAttachmentRefs(bodyHtml), ...existingAttachmentNames]);
      const fileName = uniqueFileName(file.name, used);
      const staged = fileName === file.name ? file : new File([file], fileName, { type: file.type });
      inlineFilesRef.current.set(fileName, staged);
      return fileName;
    },
    [bodyHtml, existingAttachmentNames],
  );

  const handleBodyChange = useCallback((html: string) => {
    setBodyHtml(html);
    const stillReferenced = new Set(extractAttachmentRefs(html));
    for (const name of [...inlineFilesRef.current.keys()]) {
      if (!stillReferenced.has(name)) {
        inlineFilesRef.current.delete(name);
      }
    }
  }, []);

  const submit = async () => {
    let markdown = htmlToMarkdown(bodyHtml);
    if (!markdown.trim()) return;

    const referenced = new Set(extractAttachmentRefs(bodyHtml));
    const staged = [...inlineFilesRef.current.entries()].filter(([name]) => referenced.has(name));

    if (staged.length > 0) {
      const results = await Promise.allSettled(staged.map(([, file]) => issuesApi.uploadAttachment(id, file)));

      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        toast.error(failed === staged.length ? "Failed to upload attached files" : `${failed} of ${staged.length} attached file(s) failed to upload`);
      }

      staged.forEach(([stagedName], i) => {
        const r = results[i];
        if (r.status === "fulfilled" && r.value.fileName !== stagedName) {
          markdown = markdown.split(`](${stagedName})`).join(`](${r.value.fileName})`);
        }
      });

      await qc.invalidateQueries({ queryKey: issuesKeys.attachments(id) });
    }

    await add.mutateAsync(markdown);
    inlineFilesRef.current = new Map();
    setBodyHtml("");
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
                  <RichTextContent markdown={c.body} attachmentUrls={attachmentUrls} onReferences={ensure} mentionUsers={mentionableUsers} className="mt-1 text-sm" />
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {canComment && (
        <div className="flex gap-3">
          <UserAvatar name={user?.fullName} seed={user?.id} className="h-8 w-8" />
          <div className="min-w-0 flex-1 space-y-2">
            {usersQ.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <RichTextEditor
                value={bodyHtml}
                onChange={handleBodyChange}
                placeholder="Write a comment"
                minHeight={60}
                maxHeight={600}
                onUploadFile={async (file) => stageInlineFile(file)}
                attachmentUrls={attachmentUrls}
                mentionUsers={mentionableUsers}
                editorClassName="border-x border-b rounded-b-md border-border"
                toolbarClassName="border border-input rounded-t-md"
              />
            )}
            {bodyHtml.trim() && (
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
