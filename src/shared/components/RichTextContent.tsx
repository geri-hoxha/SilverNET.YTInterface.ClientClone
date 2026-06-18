import { useEffect, useMemo, useRef } from "react";
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
 * Renders a Markdown description read-only, swapping inline attachment
 * references for resolved object URLs as they become available.
 */
export function RichTextContent({
  markdown,
  attachmentUrls,
  onReferences,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const html = useMemo(() => markdownToHtml(markdown), [markdown]);

  useEffect(() => {
    onReferences?.(extractAttachmentRefs(html));
  }, [html, onReferences]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const nodes = root.querySelectorAll<HTMLElement>("[data-attachment-ref]");
    nodes.forEach((el) => {
      const ref = el.getAttribute("data-attachment-ref");
      if (!ref) return;
      const url = attachmentUrls[ref];
      if (el.tagName === "IMG") {
        el.setAttribute("src", url ?? PLACEHOLDER_SRC);
      } else if (el.tagName === "A" && url) {
        el.setAttribute("href", url);
      }
    });
  }, [html, attachmentUrls]);

  return (
    <div
      ref={containerRef}
      className={cn("rte-content max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
