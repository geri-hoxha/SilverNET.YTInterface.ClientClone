import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { RichTextContent } from "@/components/common/RichTextContent";
import { RichTextEditor } from "@/components/common/rich-text/RichTextEditor";
import { extractAttachmentRefs } from "@/components/common/rich-text/attachmentRefs";
import { htmlToMarkdown, markdownToHtml } from "@/components/common/rich-text/markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PERMISSIONS, useAuth } from "@/features/auth";
import { useMentionableUsers } from "@/features/users/hooks";

import { issuesApi } from "../../api";
import { issuesKeys, useApproveEstimation, useIssueAttachments, useIssueAttachmentUrls, useUpdateIssue } from "../../hooks";
import type { Issue } from "../../types";
import { uniqueFileName } from "../../utils";
import { ApproveEstimationButton } from "../ApproveEstimationButton";
import { AttachmentsArea } from "./AttachmentsArea";
import { CommentsArea } from "./CommentsArea";

export function IssueMainContent({ id, issue }: { id: string; issue: Issue }) {
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
  const usersQ = useMentionableUsers();
  const mentionableUsers = usersQ.data ?? [];

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
              mentionUsers={mentionableUsers}
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
          <RichTextContent markdown={issue.description} attachmentUrls={attachmentUrls} onReferences={ensure} mentionUsers={mentionableUsers} />
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
