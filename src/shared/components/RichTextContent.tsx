import type { MentionableUser } from "@/features/users/types";
import { cn } from "@/lib/utils";
import { useEffect, useMemo } from "react";
import { extractAttachmentRefs } from "./rich-text/attachmentRefs";
import { markdownToHtml } from "./rich-text/markdown";

// 1x1 transparent GIF, shown while an inline attachment is still resolving so we
// never flash a broken-image icon for the (non-loadable) file-name reference.
const PLACEHOLDER_SRC = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

interface Props {
  /** Description or comment body as YouTrack-flavoured Markdown. */
  markdown: string;
  /** Resolved attachment file name -> object URL map. */
  attachmentUrls: Record<string, string>;
  /** Called with the attachment file names referenced by the content. */
  onReferences?: (fileNames: string[]) => void;
  /**
   * When provided, plain "@mentionHandle" occurrences are rendered as styled
   * mention spans (matching CommentBody's previous behavior), resolved to the
   * user's full name.
   */
  mentionUsers?: MentionableUser[];
  className?: string;
}

/**
 * Rewrites the resolved attachment URLs directly into the markup so the rendered
 * `src`/`href` are part of React's declarative output.
 *
 * Doing this here (rather than imperatively patching the DOM after render) keeps
 * the resolved URLs from being wiped whenever React re-applies the HTML — e.g.
 * after an edit+save re-fetches the description and recreates the nodes.
 */
function resolveAttachments(doc: Document, attachmentUrls: Record<string, string>): void {
  doc.querySelectorAll<HTMLElement>("[data-attachment-ref]").forEach((el) => {
    const ref = el.getAttribute("data-attachment-ref");
    if (!ref) return;
    const url = attachmentUrls[ref];
    if (el.tagName === "IMG") {
      el.setAttribute("src", url ?? PLACEHOLDER_SRC);
    } else if (el.tagName === "A" && url) {
      el.setAttribute("href", url);
    }
  });
}

// Matches "@handle" where handle can contain letters, digits, dots, hyphens,
// underscores — adjust if your mentionHandle format allows other characters.
const MENTION_PATTERN = /@([\w.-]+)/g;

/**
 * Walks text nodes (skipping ones already inside elements like <code>, <a>, or
 * existing markup) and replaces "@handle" occurrences that match a known
 * mentionable user with a styled span, resolved to the user's full name.
 */
function resolveMentions(doc: Document, users: MentionableUser[]): void {
  if (!users.length) return;
  const handleToName = new Map(users.map((u) => [u.mentionHandle.toLowerCase(), u.fullName]));

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    // Skip text inside code/pre blocks — mentions shouldn't be rewritten there.
    if (node.parentElement?.closest("code, pre")) continue;
    textNodes.push(node as Text);
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? "";
    if (!text.includes("@")) continue;

    MENTION_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    const fragment = doc.createDocumentFragment();
    let matched = false;

    while ((match = MENTION_PATTERN.exec(text))) {
      const handle = match[1];
      const fullName = handleToName.get(handle.toLowerCase());
      if (!fullName) continue; // not a known user — leave as plain "@handle" text

      matched = true;
      if (match.index > lastIndex) {
        fragment.appendChild(doc.createTextNode(text.slice(lastIndex, match.index)));
      }
      const span = doc.createElement("span");
      span.className = "font-medium text-blue-600 dark:text-blue-400";
      span.title = `@${handle}`;
      span.textContent = fullName;
      fragment.appendChild(span);
      lastIndex = match.index + match[0].length;
    }

    if (!matched) continue;
    if (lastIndex < text.length) {
      fragment.appendChild(doc.createTextNode(text.slice(lastIndex)));
    }
    textNode.replaceWith(fragment);
  }
}

/**
 * Renders Markdown (issue description or comment body) read-only, swapping
 * inline attachment references for resolved object URLs and, when a user list
 * is supplied, rendering @mentions the same way CommentBody did.
 */
export function RichTextContent({ markdown, attachmentUrls, onReferences, mentionUsers, className }: Props) {
  const baseHtml = useMemo(() => markdownToHtml(markdown), [markdown]);

  useEffect(() => {
    onReferences?.(extractAttachmentRefs(baseHtml));
  }, [baseHtml, onReferences]);

  const html = useMemo(() => {
    if (typeof window === "undefined") return baseHtml;
    const doc = new DOMParser().parseFromString(baseHtml, "text/html");
    resolveAttachments(doc, attachmentUrls);
    if (mentionUsers) resolveMentions(doc, mentionUsers);
    return doc.body.innerHTML;
  }, [baseHtml, attachmentUrls, mentionUsers]);

  return <div className={cn("rte-content max-w-none", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
