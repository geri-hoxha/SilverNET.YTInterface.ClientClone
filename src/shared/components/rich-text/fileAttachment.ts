import { Node, mergeAttributes } from "@tiptap/core";

export interface FileAttachmentAttrs {
  /** Data URL (or remote URL) the file can be downloaded from. */
  src: string;
  fileName: string;
  fileSize: number;
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
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function extLabel(fileName: string): string {
  const ext = fileName.split(".").pop()?.toUpperCase() ?? "";
  return ext && ext !== fileName.toUpperCase() ? ext.slice(0, 4) : "FILE";
}

/**
 * A block-level, atomic node that renders an attached (non-image) file as a
 * downloadable card. It serialises to a plain anchor element (with the file
 * embedded as a base64 data URL) so the same markup works when the description
 * HTML is rendered read-only via dangerouslySetInnerHTML.
 */
export const FileAttachment = Node.create({
  name: "fileAttachment",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        rendered: false,
        parseHTML: (el) => el.getAttribute("href"),
      },
      fileName: {
        default: "file",
        rendered: false,
        parseHTML: (el) =>
          el.getAttribute("data-file-name") ||
          el.getAttribute("download") ||
          "file",
      },
      fileSize: {
        default: 0,
        rendered: false,
        parseHTML: (el) => Number(el.getAttribute("data-file-size")) || 0,
      },
    };
  },

  parseHTML() {
    return [{ tag: "a.rte-file", priority: 1000 }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const fileName = String(node.attrs.fileName ?? "file");
    const fileSize = Number(node.attrs.fileSize ?? 0);
    const meta = formatBytes(fileSize);

    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        class: "rte-file",
        href: node.attrs.src,
        download: fileName,
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
