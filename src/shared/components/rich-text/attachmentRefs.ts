const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
};

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|#39|#x27);/g, (match) => ENTITY_MAP[match] ?? match);
}

/**
 * Extracts the unique attachment file names referenced inside a description's
 * HTML (the `data-attachment-ref="…"` markers emitted by the rich-text editor's
 * image and file nodes).
 */
export function extractAttachmentRefs(html: string | null | undefined): string[] {
  if (!html) return [];
  const refs = new Set<string>();
  const re = /data-attachment-ref="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const name = decodeHtmlEntities(match[1]).trim();
    if (name) refs.add(name);
  }
  return [...refs];
}
