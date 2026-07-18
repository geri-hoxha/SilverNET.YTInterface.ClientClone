import { MentionableUser } from "@/features/users";
import { cn } from "@/lib/utils";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface MentionListProps {
  items: MentionableUser[];
  command: (item: { id: string; label: string }) => void;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(({ items, command }, ref) => {
  const [selected, setSelected] = useState(0);

  useEffect(() => setSelected(0), [items]);

  const select = (i: number) => {
    const item = items[i];
    // label is what gets inserted/serialized ("@mentionHandle"); fullName is
    // only for the dropdown display below.
    if (item) command({ id: item.id, label: item.mentionHandle });
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelected((s) => (s + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelected((s) => (s + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        select(selected);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) return null;

  return (
    <div className="bg-popover w-fit rounded-md border p-1 shadow-md">
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          // onMouseDown (not onClick) so this fires before the editor's blur
          // handling steals focus and closes the suggestion popup first.
          onMouseDown={(e) => {
            e.preventDefault();
            select(i);
          }}
          className={cn("hover:bg-primary/10 flex w-full cursor-pointer items-baseline justify-between gap-20 rounded px-2 py-1.5 text-left text-sm", i === selected && "bg-accent")}
        >
          <span className="truncate">{item.fullName}</span>
          <span className="text-muted-foreground shrink-0 text-xs">@{item.mentionHandle}</span>
        </button>
      ))}
    </div>
  );
});
MentionList.displayName = "MentionList";
