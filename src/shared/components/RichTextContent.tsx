import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { extractAttachmentRefs } from "./rich-text/attachmentRefs";
import { markdownToHtml } from "./rich-text/markdown";

// 1x1 transparent GIF, shown while an inline attachment is still resolving so we
// never flash a broken-image icon for the (non-loadable) file-name reference.
const PLACEHOLDER_SRC =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

interface Props {
  /** Description as YouTrack-flavoured Markdown. */
  markdown: string;
  /** Resolved attachment file name -> object URL map. */
  attachmentUrls: Record<string, string>;
  /** Called with the attachment file names referenced by the description. */
  onReferences?: (fileNames: string[]) => void;
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
function resolveAttachments(html: string, attachmentUrls: Record<string, string>): string {
  if (!html || typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
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
  return doc.body.innerHTML;
}

/**
 * Renders a Markdown description read-only, swapping inline attachment
 * references for resolved object URLs as they become available.
 */
export function RichTextContent({ markdown, attachmentUrls, onReferences, className }: Props) {
  const baseHtml = useMemo(() => markdownToHtml(markdown), [markdown]);

  useEffect(() => {
    onReferences?.(extractAttachmentRefs(baseHtml));
  }, [baseHtml, onReferences]);

  const html = useMemo(
    () => resolveAttachments(baseHtml, attachmentUrls),
    [baseHtml, attachmentUrls],
  );

  return (
    <div
      className={cn("rte-content max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}