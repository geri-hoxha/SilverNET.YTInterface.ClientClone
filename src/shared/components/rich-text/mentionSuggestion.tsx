import { MentionableUser } from "@/features/users";
import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import { MentionList, MentionListRef } from "./mentionList";

export const MENTION_LIST_ATTR = "data-mention-list";

export function createMentionSuggestion(users: MentionableUser[]): Omit<SuggestionOptions<MentionableUser>, "editor"> {
  return {
    items: ({ query }) => {
      const q = query.toLowerCase();
      return users.filter((u) => u.fullName.toLowerCase().includes(q) || u.mentionHandle.toLowerCase().includes(q)).slice(0, 8);
    },

    render: () => {
      let component: ReactRenderer<MentionListRef>;
      let container: HTMLDivElement;

      const position = (clientRect: (() => DOMRect | null) | null | undefined) => {
        const rect = clientRect?.();
        if (!rect || !container) return;
        container.style.position = "fixed";
        container.style.top = `${rect.bottom + 4}px`;
        container.style.left = `${rect.left}px`;
        container.style.zIndex = "9999";
      };

      return {
        onStart: (props) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });
          container = document.createElement("div");
          container.setAttribute(MENTION_LIST_ATTR, "");
          container.style.pointerEvents = "auto";
          container.appendChild(component.element as HTMLElement);
          document.body.appendChild(container);
          position(props.clientRect);
        },
        onUpdate: (props) => {
          component.updateProps(props);
          position(props.clientRect);
        },
        onKeyDown: (props) => {
          if (props.event.key === "Escape") {
            component.destroy();
            container.remove();
            return true;
          }
          return component.ref?.onKeyDown(props) ?? false;
        },
        onExit: () => {
          component.destroy();
          container.remove();
        },
      };
    },
  };
}
