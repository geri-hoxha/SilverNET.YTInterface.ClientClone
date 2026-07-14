import { useMemo } from "react";

import type { MentionableUser } from "@/features/users/types";
import { parseCommentBodyParts } from "@/shared/utils/youtrackMentions";

type CommentBodyProps = {
  body: string;
  users: MentionableUser[];
  className?: string;
};

export function CommentBody({ body, users, className }: CommentBodyProps) {
  const handleToName = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of users) {
      map.set(user.mentionHandle.toLowerCase(), user.fullName);
    }
    return map;
  }, [users]);

  const parts = useMemo(
    () =>
      parseCommentBodyParts(
        body,
        users.map((u) => u.mentionHandle),
      ),
    [body, users],
  );

  return (
    <p className={className}>
      {parts.map((part, index) =>
        part.type === "mention" ? (
          <span key={index} className="font-medium text-blue-600 dark:text-blue-400" title={`@${part.handle}`}>
            {handleToName.get(part.handle.toLowerCase()) ?? part.handle}
          </span>
        ) : (
          <span key={index} className="break-words whitespace-pre-wrap">
            {part.value}
          </span>
        ),
      )}
    </p>
  );
}
