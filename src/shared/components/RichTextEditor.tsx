import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { toast } from "sonner";
import {
  Bold,
  Code2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Paperclip,
  Quote,
  Strikethrough,
  Type as TypeIcon,
} from "lucide-react";

import { FileAttachment } from "./rich-text/fileAttachment";
import { AttachmentImage } from "./rich-text/attachmentImage";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  /**
   * Uploads (or stages) a file dropped/selected inside the editor and resolves
   * to the attachment file name to reference. When provided, inline files are
   * stored as lightweight references instead of base64 data URLs.
   */
  onUploadFile?: (file: File) => Promise<string>;
  /**
   * Map of attachment file name -> object URL used to preview already-referenced
   * files (e.g. when editing an existing description).
   */
  attachmentUrls?: Record<string, string>;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Type or paste a description here",
  className,
  minHeight = 280,
  onUploadFile,
  attachmentUrls,
}: Props) {
  // Object URLs created for live previews of just-inserted files; revoked on
  // unmount so we don't leak blobs.
  const previewUrlsRef = useRef<string[]>([]);
  // True while we programmatically apply preview URLs, so the resulting
  // transaction doesn't bubble up as a user edit.
  const applyingPreviewsRef = useRef(false);
  // Holds the latest file-insertion handler so the (statically configured)
  // paste/drop handlers can route files through the upload flow.
  const insertFilesRef = useRef<
    ((files: File[], at?: number) => void) | null
  >(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
      AttachmentImage.configure({ inline: false, allowBase64: true }),
      FileAttachment,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: cn(
          "rte-content max-w-none focus:outline-none",
          "min-h-[var(--rte-min-h)] py-2",
        ),
        style: `--rte-min-h: ${minHeight}px`,
      },
      // Pasting/dropping files (e.g. a pasted screenshot) goes through the same
      // upload path as the toolbar so we store a reference instead of inlining
      // base64 bytes into the description.
      handlePaste: (_view, event) => {
        const files = filesFromTransfer(event.clipboardData);
        if (!files.length || !insertFilesRef.current) return false;
        event.preventDefault();
        insertFilesRef.current(files);
        return true;
      },
      handleDrop: (view, event) => {
        const files = filesFromTransfer(event.dataTransfer);
        if (!files.length || !insertFilesRef.current) return false;
        event.preventDefault();
        const at = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })?.pos;
        insertFilesRef.current(files, at);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      if (applyingPreviewsRef.current) return;
      onChange(editor.getHTML());
    },
  });

  const insertFiles = useCallback(
    async (files: File[], at?: number) => {
      if (!editor) return;
      let position = at;
      for (const file of files) {
        if (onUploadFile) {
          await insertViaUpload(
            editor,
            file,
            onUploadFile,
            previewUrlsRef,
            position,
          );
        } else {
          await insertViaBase64(editor, file, position);
        }
        // Subsequent files follow the cursor left by the previous insertion.
        position = undefined;
      }
    },
    [editor, onUploadFile],
  );

  useEffect(() => {
    insertFilesRef.current = insertFiles;
  }, [insertFiles]);

  // Keep editor in sync if parent resets value (e.g. dialog reopen).
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "") !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  // Resolve references to preview URLs (for existing descriptions being edited).
  useEffect(() => {
    if (!editor || !attachmentUrls) return;
    const { state } = editor;
    const tr = state.tr;
    let changed = false;
    state.doc.descendants((node, pos) => {
      const ref =
        node.type.name === "image"
          ? (node.attrs.attachmentRef as string | null)
          : node.type.name === "fileAttachment"
            ? (node.attrs.fileName as string | null)
            : null;
      if (!ref) return;
      const url = attachmentUrls[ref];
      if (url && node.attrs.previewSrc !== url) {
        tr.setNodeAttribute(pos, "previewSrc", url);
        changed = true;
      }
    });
    if (changed) {
      applyingPreviewsRef.current = true;
      tr.setMeta("addToHistory", false);
      editor.view.dispatch(tr);
      applyingPreviewsRef.current = false;
    }
  }, [editor, attachmentUrls, value]);

  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  return (
    <div className={cn("flex flex-col", className)}>
      <Toolbar editor={editor} insertFiles={insertFiles} />
      <div className="px-5 py-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// Fallback size limit for the legacy base64 path (used only when no upload
// handler is supplied). Uploaded references have no such limit.
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Collects File objects from a paste/drop DataTransfer, falling back to its
// items list for sources that don't populate `.files` (some browsers/apps).
function filesFromTransfer(dt: DataTransfer | null): File[] {
  if (!dt) return [];
  if (dt.files?.length) return Array.from(dt.files);
  if (!dt.items?.length) return [];
  return Array.from(dt.items)
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}

// Uploads a file and inserts a reference node (image or file card) pointing at
// the stored attachment, with a transient object URL for live preview.
async function insertViaUpload(
  editor: Editor,
  file: File,
  onUploadFile: (file: File) => Promise<string>,
  previewUrlsRef: React.RefObject<string[]>,
  at?: number,
) {
  const isImage = file.type.startsWith("image/");
  const previewSrc = URL.createObjectURL(file);
  previewUrlsRef.current.push(previewSrc);
  try {
    const fileName = await onUploadFile(file);
    if (isImage) {
      editor
        .chain()
        .focus(at)
        .setAttachmentImage({ fileName, previewSrc, alt: file.name })
        .run();
    } else {
      editor
        .chain()
        .focus(at)
        .setFileAttachment({ fileName, fileSize: file.size, previewSrc })
        .run();
    }
  } catch {
    URL.revokeObjectURL(previewSrc);
    previewUrlsRef.current = previewUrlsRef.current.filter(
      (u) => u !== previewSrc,
    );
    toast.error(`Could not upload "${file.name}".`);
  }
}

// Legacy fallback used only when no upload handler is supplied: inlines an
// image as a base64 data URL.
async function insertViaBase64(editor: Editor, file: File, at?: number) {
  if (file.size > MAX_FILE_BYTES) {
    toast.error(
      `"${file.name}" is too large to embed (max ${MAX_FILE_BYTES / (1024 * 1024)} MB).`,
    );
    return;
  }
  if (!file.type.startsWith("image/")) {
    toast.error(`"${file.name}" can only be attached to a saved issue.`);
    return;
  }
  try {
    const src = await readAsDataUrl(file);
    editor.chain().focus(at).setImage({ src, alt: file.name }).run();
  } catch {
    toast.error(`Could not read "${file.name}".`);
  }
}

function Toolbar({
  editor,
  insertFiles,
}: {
  editor: Editor | null;
  insertFiles: (files: File[], at?: number) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const blockValue = !editor
    ? "p"
    : editor.isActive("heading", { level: 1 })
      ? "h1"
      : editor.isActive("heading", { level: 2 })
        ? "h2"
        : editor.isActive("heading", { level: 3 })
          ? "h3"
          : "p";

  const setBlock = (v: string) => {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (v === "p") chain.setParagraph().run();
    else chain.toggleHeading({ level: Number(v.slice(1)) as 1 | 2 | 3 }).run();
  };

  const promptLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-y bg-muted/40 px-3 py-1.5 text-muted-foreground">
      <Select value={blockValue} onValueChange={setBlock}>
        <SelectTrigger className="h-7 w-[120px] border-0 bg-transparent text-xs shadow-none focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="p">Normal text</SelectItem>
          <SelectItem value="h1">Heading 1</SelectItem>
          <SelectItem value="h2">Heading 2</SelectItem>
          <SelectItem value="h3">Heading 3</SelectItem>
        </SelectContent>
      </Select>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <TBtn
        label="Bold"
        active={editor?.isActive("bold")}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      >
        <Bold className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        label="Italic"
        active={editor?.isActive("italic")}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        label="Strikethrough"
        active={editor?.isActive("strike")}
        onClick={() => editor?.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        label="Inline code"
        active={editor?.isActive("code")}
        onClick={() => editor?.chain().focus().toggleCode().run()}
      >
        <TypeIcon className="h-3.5 w-3.5" />
      </TBtn>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <TBtn
        label="Quote"
        active={editor?.isActive("blockquote")}
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        label="Code block"
        active={editor?.isActive("codeBlock")}
        onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
      >
        <Code2 className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        label="Link"
        active={editor?.isActive("link")}
        onClick={promptLink}
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        label="Bullet list"
        active={editor?.isActive("bulletList")}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      >
        <List className="h-3.5 w-3.5" />
      </TBtn>
      <TBtn
        label="Numbered list"
        active={editor?.isActive("orderedList")}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </TBtn>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <TBtn
        label="Attach file or image"
        onClick={() => fileInputRef.current?.click()}
      >
        <Paperclip className="h-3.5 w-3.5" />
      </TBtn>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) insertFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
    </div>
  );
}

function TBtn({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}
