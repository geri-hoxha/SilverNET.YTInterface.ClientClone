import type { Issue, IssueStatus } from "./types";

export function stateLabel(status: IssueStatus) {
  return status === "InProgress" ? "In Progress" : status;
}

export function issueReadableId(issue: Issue) {
  return issue.youTrackReadableId ?? issue.key ?? issue.id.slice(0, 8);
}

export function stripHtmlToText(html?: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Returns a file name that doesn't clash with any in `used`, appending a
 * " (n)" suffix before the extension when needed (e.g. "img (1).png"). Used to
 * keep inline attachment references unique within one issue.
 */
export function uniqueFileName(name: string, used: Set<string>): string {
  if (!used.has(name)) return name;
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let i = 1;
  let candidate = `${base} (${i})${ext}`;
  while (used.has(candidate)) {
    i += 1;
    candidate = `${base} (${i})${ext}`;
  }
  return candidate;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export interface FileMeta {
  label: string;
  typeLabel: string;
  bg: string;
  border: string;
  badge: string;
}

export function fileTypeMeta(name: string): FileMeta {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, FileMeta> = {
    xlsx: { label: "XLS", typeLabel: "Excel spreadsheet", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-900", badge: "bg-green-600" },
    xls:  { label: "XLS", typeLabel: "Excel spreadsheet", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-900", badge: "bg-green-600" },
    csv:  { label: "CSV", typeLabel: "CSV file",           bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-900", badge: "bg-emerald-600" },
    doc:  { label: "DOC", typeLabel: "Word document",      bg: "bg-blue-50 dark:bg-blue-950/30",   border: "border-blue-200 dark:border-blue-900",   badge: "bg-blue-600" },
    docx: { label: "DOC", typeLabel: "Word document",      bg: "bg-blue-50 dark:bg-blue-950/30",   border: "border-blue-200 dark:border-blue-900",   badge: "bg-blue-600" },
    pdf:  { label: "PDF", typeLabel: "PDF document",       bg: "bg-red-50 dark:bg-red-950/30",     border: "border-red-200 dark:border-red-900",     badge: "bg-red-600" },
    ppt:  { label: "PPT", typeLabel: "PowerPoint",         bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-900", badge: "bg-orange-600" },
    pptx: { label: "PPT", typeLabel: "PowerPoint",         bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-900", badge: "bg-orange-600" },
    png:  { label: "IMG", typeLabel: "Image",              bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-900", badge: "bg-purple-600" },
    jpg:  { label: "IMG", typeLabel: "Image",              bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-900", badge: "bg-purple-600" },
    jpeg: { label: "IMG", typeLabel: "Image",              bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-900", badge: "bg-purple-600" },
    gif:  { label: "IMG", typeLabel: "Image",              bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-900", badge: "bg-purple-600" },
    webp: { label: "IMG", typeLabel: "Image",              bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-900", badge: "bg-purple-600" },
    svg:  { label: "SVG", typeLabel: "Vector image",       bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-900", badge: "bg-fuchsia-600" },
    zip:  { label: "ZIP", typeLabel: "Archive",            bg: "bg-amber-50 dark:bg-amber-950/30",   border: "border-amber-200 dark:border-amber-900",   badge: "bg-amber-600" },
    rar:  { label: "RAR", typeLabel: "Archive",            bg: "bg-amber-50 dark:bg-amber-950/30",   border: "border-amber-200 dark:border-amber-900",   badge: "bg-amber-600" },
    txt:  { label: "TXT", typeLabel: "Text file",          bg: "bg-slate-50 dark:bg-slate-900/40",   border: "border-slate-200 dark:border-slate-800",   badge: "bg-slate-600" },
    md:   { label: "MD",  typeLabel: "Markdown",           bg: "bg-slate-50 dark:bg-slate-900/40",   border: "border-slate-200 dark:border-slate-800",   badge: "bg-slate-600" },
  };
  return (
    map[ext] ?? {
      label: ext ? ext.slice(0, 3).toUpperCase() : "",
      typeLabel: ext ? `${ext.toUpperCase()} file` : "File",
      bg: "bg-muted/40",
      border: "border-border",
      badge: "bg-slate-500",
    }
  );
}
