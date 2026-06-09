import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ChevronsUpDown,
  
  Eye,
  FileText,
  Loader2,
  Paperclip,
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

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useProjects } from "@/features/projects/hooks";
import { issuesApi } from "../api";
import { issuesKeys, useCreateIssue } from "../hooks";
import { EntityLogo } from "@/shared/components/EntityLogo";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
import type { IssuePriority } from "../types";
import { createIssueSchema, type CreateIssueFormValues } from "../schemas";
import { fileTypeMeta, formatBytes } from "../utils";
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

type FormValues = CreateIssueFormValues;

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
  const qc = useQueryClient();
  const projectsQ = useProjects();
  const createMut = useCreateIssue();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isBusy = createMut.isPending || uploading;

  const addFiles = (files: FileList | File[] | null) => {
    if (!files) return;
    const arr = Array.from(files);
    if (!arr.length) return;
    setAttachments((prev) => [...prev, ...arr]);
  };
  const removeFile = (idx: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  

  const form = useForm<FormValues>({
    resolver: zodResolver(createIssueSchema),
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

  const createWithAttachments = async (values: FormValues) => {
    const issue = await createMut.mutateAsync(values);
    const files = attachments;
    if (files.length > 0) {
      setUploading(true);
      try {
        const results = await Promise.allSettled(
          files.map((file) => issuesApi.uploadAttachment(issue.id, file)),
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          toast.error(
            failed === files.length
              ? "Issue created, but attachments failed to upload"
              : `Issue created, but ${failed} of ${files.length} attachment(s) failed to upload`,
          );
        }
        await qc.invalidateQueries({
          queryKey: issuesKeys.attachments(issue.id),
        });
      } finally {
        setUploading(false);
      }
    }
    return issue;
  };

  const onSubmit = async (values: FormValues) => {
    const issue = await createWithAttachments(values);
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
              {(() => {
                const uploadBtn = (
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
                );

                if (attachments.length === 0) return uploadBtn;

                return (
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
                    {uploadBtn}
                  </div>
                );
              })()}
            </div>


            {/* footer */}
            <div className="flex items-center gap-2 border-t bg-muted/20 px-5 py-3">
              <div className="flex">
                <Button
                  type="submit"
                  disabled={isBusy}
                  className="rounded-r-none"
                >
                  {isBusy && (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  )}
                  Create
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      className="rounded-l-none border-l border-primary-foreground/20 px-2"
                      disabled={isBusy}
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
                        const issue = await createWithAttachments(v);
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
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-base">
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

function ProjectPicker({
  projects,
  value,
  onChange,
}: {
  projects: { id: string; name: string; youTrackProjectId: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = projects.find((p) => p.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded text-left text-sm hover:text-foreground"
        >
          {selected ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate font-medium text-foreground">
                {selected.name}
              </span>
              <EntityLogo
                name={selected.name}
                shortCode={selected.youTrackProjectId}
                seed={selected.id}
                size="sm"
                className="ml-auto"
              />
            </div>
          ) : (
            <span className="text-muted-foreground">Select project</span>
          )}
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Search projects..." />
          <CommandList>
            <CommandEmpty>No projects found.</CommandEmpty>
            <CommandGroup>
              {projects.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.youTrackProjectId} ${p.name}`}
                  onSelect={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <EntityLogo
                    name={p.name}
                    shortCode={p.youTrackProjectId}
                    seed={p.id}
                    size="sm"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{p.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {p.youTrackProjectId}
                    </span>
                  </div>
                  {p.id === value && <Check className="h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function PriorityPicker({
  value,
  onChange,
}: {
  value: IssuePriority;
  onChange: (v: IssuePriority) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = PRIORITY_OPTIONS.find((p) => p.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 text-left text-sm text-primary hover:underline underline-offset-2"
        >
          {selected?.label ?? value}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Filter items" />
          <CommandList>
            <CommandEmpty>No priority.</CommandEmpty>
            <CommandGroup>
              {PRIORITY_OPTIONS.map((p) => (
                <CommandItem
                  key={p.value}
                  value={p.label}
                  onSelect={() => {
                    onChange(p.value);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <span className="flex-1">{p.label}</span>
                  <span
                    className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white",
                      p.badgeBg,
                    )}
                  >
                    {p.badge}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
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

