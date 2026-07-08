import { Node, mergeAttributes } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export interface FileAttachmentAttrs {
  /** Attachment file name the file is stored/referenced by. */
  fileName: string;
  fileSize: number;
  /** Transient blob/object URL for in-editor download (never serialised). */
  previewSrc?: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fileAttachment: {
      /** Insert a non-image file as a downloadable card. */
      setFileAttachment: (attrs: FileAttachmentAttrs) => ReturnType;
    };
  }
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function extLabel(fileName: string): string {
  const ext = fileName.split(".").pop()?.toUpperCase() ?? "";
  return ext && ext !== fileName.toUpperCase() ? ext.slice(0, 4) : "FILE";
}

/**
 * A block-level, atomic node that renders an attached (non-image) file as a
 * downloadable card. It persists a *reference* (the attachment file name) in the
 * `href`/`data-attachment-ref` attributes rather than embedding the bytes as a
 * base64 data URL, so the description HTML stays small. The real, auth-protected
 * bytes are resolved at render time (see RichTextContent / the preview effect in
 * RichTextEditor) and exposed via a transient `previewSrc`.
 */
export const FileAttachment = Node.create({
  name: "fileAttachment",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      fileName: {
        default: "file",
        rendered: false,
        parseHTML: (el) =>
          el.getAttribute("data-attachment-ref") ||
          el.getAttribute("data-file-name") ||
          el.getAttribute("href") ||
          el.getAttribute("download") ||
          "file",
      },
      fileSize: {
        default: 0,
        rendered: false,
        parseHTML: (el) => Number(el.getAttribute("data-file-size")) || 0,
      },
      // Live-preview download source. Not serialised.
      previewSrc: {
        default: null,
        rendered: false,
      },
    };
  },

  parseHTML() {
    return [{ tag: "a.rte-file", priority: 1000 }];
  },

  // Serialised markup (getHTML / read-only view). Always references the file by
  // name; never emits the transient preview URL.
  renderHTML({ node }) {
    return buildCard(node, String(node.attrs.fileName ?? "file"));
  },

  // In-editor rendering: identical card, but the href uses the transient
  // preview URL when available so the just-attached file is downloadable.
  addNodeView() {
    const hrefFor = (n: ProseMirrorNode) =>
      String(n.attrs.previewSrc || n.attrs.fileName || "file");

    return ({ node }) => {
      // The card's file name/size are fixed for a given node; only the preview
      // href changes once the file resolves, so we keep the element identity
      // (required by ProseMirror) and update the href in place.
      const dom = renderSpecToDom(buildCard(node, hrefFor(node)));

      return {
        dom,
        update: (updated) => {
          if (updated.type.name !== node.type.name) return false;
          dom.setAttribute("href", hrefFor(updated));
          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      setFileAttachment:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});

type DomSpec = [string, Record<string, string>, ...unknown[]];

function buildCard(node: ProseMirrorNode, href: string): DomSpec {
  const fileName = String(node.attrs.fileName ?? "file");
  const fileSize = Number(node.attrs.fileSize ?? 0);
  const meta = formatBytes(fileSize);

  return [
    "a",
    mergeAttributes({
      class: "rte-file",
      href,
      download: fileName,
      "data-attachment-ref": fileName,
      "data-file-name": fileName,
      "data-file-size": String(fileSize),
      contenteditable: "false",
    }),
    ["span", { class: "rte-file-icon" }, extLabel(fileName)],
    [
      "span",
      { class: "rte-file-info" },
      ["span", { class: "rte-file-name" }, fileName],
      ["span", { class: "rte-file-meta" }, meta || "File"],
    ],
    ["span", { class: "rte-file-download" }, "Download"],
  ];
}

// Minimal renderer for the small, static DOM spec used by the node view.
function renderSpecToDom(spec: unknown): HTMLElement {
  const [tag, attrs, ...children] = spec as [string, Record<string, string>, ...unknown[]];
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  for (const child of children) {
    if (typeof child === "string") {
      el.appendChild(document.createTextNode(child));
    } else if (Array.isArray(child)) {
      el.appendChild(renderSpecToDom(child));
    }
  }
  return el;
}
