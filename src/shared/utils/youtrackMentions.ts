/** Hub / YouTrack login used in `@login` mention markup. */
export function getYouTrackLogin(user: {
  email: string;
  youTrackLogin?: string | null;
}): string {
  if (user.youTrackLogin?.trim()) return user.youTrackLogin.trim();
  return user.email.split("@")[0] ?? "";
}

/** YouTrack comment payload format: `@login` (see YouTrack REST API samples). */
export function formatYouTrackMention(login: string): string {
  return `@${login}`;
}

const MENTION_PATTERN = /@([a-zA-Z0-9._-]+)/g;

export type CommentBodyPart =
  | { type: "text"; value: string }
  | { type: "mention"; login: string };

export function parseCommentBodyParts(body: string): CommentBodyPart[] {
  const parts: CommentBodyPart[] = [];
  let lastIndex = 0;

  for (const match of body.matchAll(MENTION_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: "text", value: body.slice(lastIndex, index) });
    }
    parts.push({ type: "mention", login: match[1] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < body.length) {
    parts.push({ type: "text", value: body.slice(lastIndex) });
  }

  return parts;
}

/** Active `@query` at the caret, if any. */
export function getActiveMention(
  text: string,
  cursor: number,
): { query: string; start: number } | null {
  const before = text.slice(0, cursor);
  const match = /(?:^|[\s([{])@([\w.-]*)$/.exec(before);
  if (!match) return null;
  const query = match[1];
  const start = before.length - query.length - 1;
  return { query, start };
}
