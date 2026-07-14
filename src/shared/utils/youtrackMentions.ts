/** YouTrack comment mention format: `@mentionHandle`. */
export function formatMention(handle: string): string {
  return `@${handle}`;
}

const MENTION_PATTERN = /@([a-zA-Z0-9._-]+)/g;

export type CommentBodyPart = { type: "text"; value: string } | { type: "mention"; handle: string };

export function parseCommentBodyParts(body: string, handles: string[]): CommentBodyPart[] {
  if (!body) return [];
  if (!handles.length) {
    const parts: CommentBodyPart[] = [];
    let lastIndex = 0;
    for (const match of body.matchAll(MENTION_PATTERN)) {
      const index = match.index ?? 0;
      if (index > lastIndex) {
        parts.push({ type: "text", value: body.slice(lastIndex, index) });
      }
      parts.push({ type: "mention", handle: match[1] });
      lastIndex = index + match[0].length;
    }
    if (lastIndex < body.length) {
      parts.push({ type: "text", value: body.slice(lastIndex) });
    }
    return parts.length ? parts : [{ type: "text", value: body }];
  }

  const sorted = [...handles].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`@(${escaped.join("|")})`, "g");

  const parts: CommentBodyPart[] = [];
  let lastIndex = 0;

  for (const match of body.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: "text", value: body.slice(lastIndex, index) });
    }
    parts.push({ type: "mention", handle: match[1] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < body.length) {
    parts.push({ type: "text", value: body.slice(lastIndex) });
  }

  return parts.length ? parts : [{ type: "text", value: body }];
}

/** Active `@query` at the caret, if any. */
export function getActiveMention(text: string, cursor: number): { query: string; start: number } | null {
  const before = text.slice(0, cursor);
  const match = /(?:^|[\s([{])@([\w.-]*)$/.exec(before);
  if (!match) return null;
  const query = match[1];
  const start = before.length - query.length - 1;
  return { query, start };
}
