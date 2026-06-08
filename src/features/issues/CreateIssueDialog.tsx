import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Check,
  ChevronsUpDown,
  ExternalLink,
  Eye,
  FileText,
  Link as LinkIcon,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Tag,
  X,
} from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { useProjects } from "@/features/projects/hooks";
import { useCreateIssue } from "@/features/issues/hooks";
import { EntityLogo } from "@/shared/components/EntityLogo";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
import type { IssuePriority } from "@/features/issues/types";
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS: {
  value: IssuePriority;
  label: string;
  badge: string;
  badgeBg: string;
}[] = [
  { value: "Low", label: "S4 - Low", badge: "S", badgeBg: "bg-emerald-500" },
  { value: "Normal", label: "S3 - Normal", badge: "S", badgeBg: "bg-yellow-500" },
  { value: "Major", label: "S2 - Major", badge: "S", badgeBg: "bg-orange-500" },
  { value: "Critical", label: "S1 - Critical", badge: "S", badgeBg: "bg-red-500" },
];

const schema = z.object({
  projectId: z.string().min(1, "Select a project"),
  title: z.string().min(3, "Summary must be at least 3 characters").max(200),
  description: z.string().max(10_000).optional(),
  priority: z.enum(["Low", "Normal", "Major", "Critical"]),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  onCreated?: (issueId: string) => void;
}

export function CreateIssueDialog({
  open,
  onOpenChange,
  defaultProjectId,
  onCreated,
}: Props) {
  const projectsQ = useProjects();
  const createMut = useCreateIssue();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (files: FileList | File[] | null) => {
    if (!files) return;
    const arr = Array.from(files);
    if (!arr.length) return;
    setAttachments((prev) => [...prev, ...arr]);
  };
  const removeFile = (idx: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectId: defaultProjectId ?? "",
      title: "",
      description: "",
      priority: "Normal",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        projectId: defaultProjectId ?? "",
        title: "",
        description: "",
        priority: "Normal",
      });
      setAttachments([]);
    }
  }, [open, defaultProjectId, form]);

  const projects = projectsQ.data ?? [];
  const selectedProject = projects.find(
    (p) => p.id === form.watch("projectId"),
  );

  const onSubmit = async (values: FormValues) => {
    const issue = await createMut.mutateAsync(values);
    onOpenChange(false);
    onCreated?.(issue.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[1080px] p-0 gap-0 overflow-hidden [&>button.absolute]:hidden"
      >
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-[1fr_320px] max-h-[85vh]"
        >
          {/* LEFT: editor */}
          <div className="flex min-w-0 flex-col overflow-y-auto">
            <div className="flex items-start gap-2 px-5 pt-4 pb-2">
              <Input
                placeholder="Enter a summary"
                className="h-auto border-0 px-0 py-1 text-xl font-semibold shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                autoFocus
                {...form.register("title")}
              />
              <div className="flex items-center gap-1 text-muted-foreground">
                <IconBtn title="Add tag">
                  <Tag className="h-4 w-4" />
                </IconBtn>
                <IconBtn title="Add link">
                  <LinkIcon className="h-4 w-4" />
                </IconBtn>
                <IconBtn title="More">
                  <MoreHorizontal className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  title="Close"
                  onClick={() => onOpenChange(false)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </IconBtn>
              </div>
            </div>
            {form.formState.errors.title && (
              <p className="px-5 pb-1 text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}

            {/* rich text editor */}
            <div className="flex-1">
              <RichTextEditor
                value={form.watch("description") ?? ""}
                onChange={(html) =>
                  form.setValue("description", html, { shouldDirty: true })
                }
                placeholder="Type or paste a description of the issue here"
              />
            </div>

            {/* attachments */}
            <div className="mx-5 mb-3 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  addFiles(e.dataTransfer.files);
                }}
                className={cn(
                  "flex w-full items-center justify-center rounded-md border border-dashed py-4 text-sm text-muted-foreground transition-colors",
                  dragOver
                    ? "border-primary bg-primary/5 text-foreground"
                    : "hover:border-foreground/30 hover:text-foreground",
                )}
              >
                <Paperclip className="mr-2 h-4 w-4" />
                Click to{" "}
                <span className="mx-1 text-primary underline-offset-2 hover:underline">
                  browse
                </span>{" "}
                or drag files here
              </button>

              {attachments.length > 0 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {attachments.map((file, idx) => {
                    const meta = fileTypeMeta(file.name);
                    return (
                      <div
                        key={`${file.name}-${idx}`}
                        className={cn(
                          "group flex items-center gap-3 rounded-md border px-3 py-2",
                          meta.bg,
                          meta.border,
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded text-[10px] font-bold uppercase text-white",
                            meta.badge,
                          )}
                        >
                          {meta.label ? (
                            meta.label
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-foreground">
                            {file.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {meta.typeLabel} · {formatBytes(file.size)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          title="Remove"
                          className="rounded p-1 text-muted-foreground opacity-60 hover:bg-background hover:text-foreground group-hover:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* similar issues collapsible (visual only) */}
            <div className="px-5 pb-3">
              <details className="group" open>
                <summary className="cursor-pointer text-sm font-medium list-none flex items-center gap-2">
                  <span className="text-primary">›</span>
                  Similar Issues and Articles
                </summary>
                <p className="mt-1 text-xs text-muted-foreground">
                  When you enter a summary, items that may address the same
                  topic are shown here
                </p>
              </details>
            </div>

            {/* footer */}
            <div className="flex items-center gap-2 border-t bg-muted/20 px-5 py-3">
              <div className="flex">
                <Button
                  type="submit"
                  disabled={createMut.isPending}
                  className="rounded-r-none"
                >
                  {createMut.isPending && (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  )}
                  Create
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      className="rounded-l-none border-l border-primary-foreground/20 px-2"
                      disabled={createMut.isPending}
                    >
                      ▾
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={form.handleSubmit(onSubmit)}
                    >
                      Create and start another
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={form.handleSubmit(async (v) => {
                        const issue = await createMut.mutateAsync(v);
                        onOpenChange(false);
                        onCreated?.(issue.id);
                      })}
                    >
                      Create and open
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <button
                type="button"
                className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Eye className="h-3.5 w-3.5" />
                Visible to issue readers
                <span>▾</span>
              </button>
              <button
                type="button"
                className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View in full page
              </button>
            </div>
          </div>

          {/* RIGHT: metadata sidebar */}
          <aside className="border-l bg-muted/20 overflow-y-auto">
            <div className="px-4 py-4 space-y-4">
              <Field label="Project">
                <ProjectPicker
                  projects={projects}
                  value={form.watch("projectId")}
                  onChange={(id) =>
                    form.setValue("projectId", id, { shouldValidate: true })
                  }
                />
                {form.formState.errors.projectId && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.projectId.message}
                  </p>
                )}
              </Field>

              <Field
                label="Priority"
                rightSlot={
                  <TileBadge
                    color={
                      PRIORITY_OPTIONS.find(
                        (p) => p.value === form.watch("priority"),
                      )?.badgeBg ?? "bg-slate-500"
                    }
                  >
                    S
                  </TileBadge>
                }
              >
                <PriorityPicker
                  value={form.watch("priority")}
                  onChange={(v) => form.setValue("priority", v)}
                />
              </Field>
            </div>
          </aside>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  rightSlot,
}: {
  label: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-2 text-sm">
        <div className="min-w-0 flex-1 truncate">{children}</div>
        {rightSlot}
      </div>
    </div>
  );
}

function TileBadge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white",
        color,
      )}
    >
      {children}
    </span>
  );
}

function priorityColor(p: IssuePriority) {
  switch (p) {
    case "Critical":
      return "bg-red-500";
    case "Major":
      return "bg-orange-500";
    case "Normal":
      return "bg-emerald-500";
    case "Low":
    default:
      return "bg-slate-500";
  }
}

function IconBtn({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground",
        props.className,
      )}
    >
      {children}
    </button>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

interface FileMeta {
  label: string;
  typeLabel: string;
  bg: string;
  border: string;
  badge: string;
}

function fileTypeMeta(name: string): FileMeta {
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
