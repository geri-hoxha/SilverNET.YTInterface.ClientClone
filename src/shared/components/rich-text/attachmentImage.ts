import Image from "@tiptap/extension-image";

export interface AttachmentImageAttrs {
  /** Attachment file name the image is stored/referenced by. */
  fileName: string;
  /** Transient blob/object URL used only for live preview (never serialised). */
  previewSrc?: string;
  alt?: string;
  title?: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    attachmentImage: {
      /** Insert an image that references an uploaded attachment by file name. */
      setAttachmentImage: (attrs: AttachmentImageAttrs) => ReturnType;
    };
  }
}

function normalizeWidth(width: string): string {
  return /^\d+$/.test(width) ? `${width}px` : width;
}

/**
 * Image node that persists a *reference* (the attachment file name) instead of
 * embedding the bytes as a base64 data URL. The serialised HTML looks like:
 *
 *   <img src="diagram.png" data-attachment-ref="diagram.png" alt="…">
 *
 * `src` holds the file name so the markup stays YouTrack-compatible, while the
 * real, auth-protected bytes are resolved at render time (see RichTextContent /
 * the preview effect in RichTextEditor) and shown via a transient `previewSrc`.
 *
 * Regular (external `https://…`) images keep working unchanged: they have no
 * `fileName`, so they serialise their `src` as-is.
 */
export const AttachmentImage = Image.extend({
  name: "image",

  addAttributes() {
    return {
      ...this.parent?.(),
      attachmentRef: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-attachment-ref"),
        renderHTML: (attrs) =>
          attrs.attachmentRef
            ? { "data-attachment-ref": attrs.attachmentRef as string }
            : {},
      },
      // CSS width (e.g. "70%" / "300px"), kept so YouTrack's `{width=…}` survives
      // a round-trip through the editor.
      width: {
        default: null,
        parseHTML: (el) => {
          const style = el.getAttribute("style") ?? "";
          const m = /width\s*:\s*([0-9]+(?:%|px)?)/i.exec(style);
          if (m) return m[1];
          return el.getAttribute("width");
        },
        renderHTML: (attrs) =>
          attrs.width ? { style: `width:${normalizeWidth(attrs.width as string)}` } : {},
      },
      // Live-preview source. Not serialised, so getHTML() always emits the
      // reference (`src`) rather than a throwaway blob URL.
      previewSrc: {
        default: null,
        rendered: false,
      },
    };
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("img");

      const apply = (n: typeof node) => {
        const src =
          (n.attrs.previewSrc as string | null) ||
          (n.attrs.src as string | null) ||
          "";
        dom.setAttribute("src", src);
        if (n.attrs.alt) dom.setAttribute("alt", String(n.attrs.alt));
        else dom.removeAttribute("alt");
        if (n.attrs.title) dom.setAttribute("title", String(n.attrs.title));
        else dom.removeAttribute("title");
        if (n.attrs.width)
          dom.style.width = normalizeWidth(String(n.attrs.width));
        else dom.style.removeProperty("width");
      };

      apply(node);

      return {
        dom,
        update: (updated) => {
          if (updated.type.name !== node.type.name) return false;
          apply(updated);
          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setAttachmentImage:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              src: attrs.fileName,
              attachmentRef: attrs.fileName,
              previewSrc: attrs.previewSrc ?? null,
              alt: attrs.alt,
              title: attrs.title,
            },
          }),
    };
  },
});
