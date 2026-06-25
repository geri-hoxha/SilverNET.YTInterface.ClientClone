import { useMemo } from "react";

import type { PortalUser } from "@/features/users/types";
import {
  getYouTrackLogin,
  parseCommentBodyParts,
} from "@/shared/utils/youtrackMentions";

type CommentBodyProps = {
  body: string;
  users: PortalUser[];
  className?: string;
};

export function CommentBody({ body, users, className }: CommentBodyProps) {
  const loginToName = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of users) {
      map.set(getYouTrackLogin(user).toLowerCase(), user.fullName);
    }
    return map;
  }, [users]);

  const parts = useMemo(() => parseCommentBodyParts(body), [body]);
  console.log(parts)
  return (
    <p className={className}>
      {parts.map((part, index) =>
        part.type === "mention" ? (
          <span
            key={index}
            className="font-medium text-sky-500 dark:text-blue-400"
            title={`@${part.login}`}
          >
            @{loginToName.get(part.login.toLowerCase()) ?? part.login}
          </span>
        ) : (
          <span key={index} className="whitespace-pre-wrap break-words">
            {part.value}
          </span>
        ),
      )}
    </p>
  );
}
