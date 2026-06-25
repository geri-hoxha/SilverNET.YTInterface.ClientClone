import { useCallback, useMemo, useRef, useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { PortalUser } from "@/features/users/types";
import { UserAvatar } from "@/shared/components/UserAvatar";
import {
  formatYouTrackMention,
  getActiveMention,
  getYouTrackLogin,
} from "@/shared/utils/youtrackMentions";

type MentionTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  users: PortalUser[];
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

export function MentionTextarea({
  value,
  onChange,
  users,
  placeholder,
  rows = 2,
  className,
  disabled,
  onKeyDown,
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursor, setCursor] = useState(value.length);

  const syncCursor = () => {
    const pos = textareaRef.current?.selectionStart;
    if (pos != null) setCursor(pos);
  };

  const activeMention = getActiveMention(value, cursor);

  const filteredUsers = useMemo(() => {
    if (!activeMention) return [];
    const q = activeMention.query.toLowerCase();
    return users
      .filter((user) => {
        const login = getYouTrackLogin(user).toLowerCase();
        const name = user.fullName.toLowerCase();
        const email = user.email.toLowerCase();
        if (!q) return true;
        return login.includes(q) || name.includes(q) || email.includes(q);
      })
      .slice(0, 8);
  }, [activeMention, users]);

  const mentionOpen = !!activeMention && filteredUsers.length > 0;

  const selectUser = useCallback(
    (user: PortalUser) => {
      const el = textareaRef.current;
      if (!activeMention || !el) return;
      const end = el.selectionStart;
      const login = getYouTrackLogin(user);
      const mention = formatYouTrackMention(login);
      const before = value.slice(0, activeMention.start);
      const after = value.slice(end);
      const next = `${before}${mention} ${after}`;
      const nextCursor = before.length + mention.length + 1;
      onChange(next);
      setCursor(nextCursor);
      setSelectedIndex(0);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(nextCursor, nextCursor);
      });
    },
    [activeMention, onChange, value],
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursor(e.target.selectionStart);
    setSelectedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filteredUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectUser(filteredUsers[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSelectedIndex(0);
        return;
      }
    }
    onKeyDown?.(e);
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={syncCursor}
        onKeyUp={syncCursor}
        onSelect={syncCursor}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={cn("resize-none bg-muted/30", className)}
      />
      {mentionOpen && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
          role="listbox"
          aria-label="Mention a user"
        >
          <ul className="max-h-48 overflow-y-auto p-1">
            {filteredUsers.map((user, index) => {
              const login = getYouTrackLogin(user);
              return (
                <li key={user.id} role="option" aria-selected={index === selectedIndex}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none",
                      index === selectedIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50",
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectUser(user);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <UserAvatar name={user.fullName} seed={user.id} className="h-6 w-6 text-[10px]" />
                    <span className="min-w-0 flex-1 truncate font-medium">{user.fullName}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">@{login}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
