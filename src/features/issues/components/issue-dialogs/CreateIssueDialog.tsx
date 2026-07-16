import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, FileText, Loader2, Paperclip, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useProjects } from "@/features/projects/hooks";
import { useMentionableUsers } from "@/features/users/hooks";
import { cn } from "@/lib/utils";
import { EntityLogo } from "@/shared/components/EntityLogo";
import { extractAttachmentRefs } from "@/shared/components/rich-text/attachmentRefs";
import { htmlToMarkdown } from "@/shared/components/rich-text/markdown";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
import { issuesApi } from "../../api";
import { issuesKeys, useCreateIssue } from "../../hooks";
import { createIssueSchema, type CreateIssueFormValues } from "../../schemas";
import { fileTypeMeta, formatBytes, uniqueFileName } from "../../utils";

// Maps a project's YouTrack priority name to a badge color. Falls back to a
// neutral color for any custom/unknown priority value.
function priorityBadgeBg(name: string): string {
  const n = name.toLowerCase();
  if (/(critical|show-?stopper|blocker|s1)/.test(n)) return "bg-red-500";
  if (/(major|high|s2)/.test(n)) return "bg-orange-500";
  if (/(normal|medium|s3)/.test(n)) return "bg-yellow-500";
  if (/(minor|low|s4)/.test(n)) return "bg-emerald-500";
  return "bg-slate-500";
}

// Picks a sensible default priority from a project's options, preferring a
// "Normal"-like value when present, otherwise the first option.
function pickDefaultPriority(options: string[]): string {
  if (options.length === 0) return "";
  const normal = options.find((o) => /normal|medium/i.test(o));
  return normal ?? options[0];
}

type FormValues = CreateIssueFormValues;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  onCreated?: (issueId: string) => void;
}

export function CreateIssueDialog({ open, onOpenChange, defaultProjectId, onCreated }: Props) {
  const qc = useQueryClient();
  const projectsQ = useProjects();
  const usersQ = useMentionableUsers();
  const mentionableUsers = usersQ.data ?? [];
  const createMut = useCreateIssue();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const inlineFilesRef = useRef<Map<string, File>>(new Map());
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isBusy = createMut.isPending || uploading;

  // Stage an inline file under a unique name and return the reference to store
  // in the description HTML.
  const stageInlineFile = (file: File): string => {
    const used = new Set<string>([...attachments.map((f) => f.name), ...inlineFilesRef.current.keys()]);
    const fileName = uniqueFileName(file.name, used);
    const staged = fileName === file.name ? file : new File([file], fileName, { type: file.type });
    inlineFilesRef.current.set(fileName, staged);
    return fileName;
  };

  const addFiles = (files: FileList | File[] | null) => {
    if (!files) return;
    const arr = Array.from(files);
    if (!arr.length) return;
    setAttachments((prev) => [...prev, ...arr]);
  };
  const removeFile = (idx: number) => setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const form = useForm<FormValues>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: {
      projectId: defaultProjectId ?? "",
      title: "",
      description: "",
      priority: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        projectId: defaultProjectId ?? "",
        title: "",
        description: "",
        priority: "",
      });
      setAttachments([]);
      inlineFilesRef.current = new Map();
    }
  }, [open, defaultProjectId, form]);

  const projects = projectsQ.data ?? [];

  const selectedProjectId = form.watch("projectId");
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const priorityOptions = selectedProject?.priorityOptions ?? [];
  const priorityKey = priorityOptions.join("|");

  // Keep the selected priority valid for the chosen project: clear it when the
  // project has no synced priorities, and default it when the current value is
  // not part of the project's options.
  useEffect(() => {
    const current = form.getValues("priority");
    if (priorityOptions.length === 0) {
      if (current) form.setValue("priority", "");
      return;
    }
    if (!priorityOptions.includes(current)) {
      form.setValue("priority", pickDefaultPriority(priorityOptions), {
        shouldValidate: form.formState.isSubmitted,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, priorityKey]);

  const createWithAttachments = async (values: FormValues) => {
    // The editor produces HTML; YouTrack stores Markdown.
    const markdown = htmlToMarkdown(values.description ?? "");
    const issue = await createMut.mutateAsync({ ...values, description: markdown });

    // Only upload inline files still referenced in the description. A paste that
    // was deleted (or undone) before Create must never become an attachment.
    // Bottom-of-dialog "Attachments" files are always intentional and stay.
    const referenced = new Set(extractAttachmentRefs(values.description ?? ""));
    const inlineEntries = [...inlineFilesRef.current.entries()].filter(([name]) => referenced.has(name));
    const files = [...attachments, ...inlineEntries.map(([, file]) => file)];

    if (files.length > 0) {
      setUploading(true);
      try {
        const results = await Promise.allSettled(files.map((file) => issuesApi.uploadAttachment(issue.id, file)));
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          toast.error(failed === files.length ? "Issue created, but attachments failed to upload" : `Issue created, but ${failed} of ${files.length} attachment(s) failed to upload`);
        }

        // Reconcile inline references: if the backend stored an inline file
        // under a different name, rewrite the Markdown so the reference still
        // resolves. (Inline results are the tail of `files`/`results`.)
        const offset = attachments.length;
        const renames: Array<[string, string]> = [];
        inlineEntries.forEach(([stagedName], i) => {
          const r = results[offset + i];
          if (r.status === "fulfilled" && r.value.fileName !== stagedName) {
            renames.push([stagedName, r.value.fileName]);
          }
        });
        if (renames.length > 0 && markdown) {
          let description = markdown;
          for (const [from, to] of renames) {
            description = description.split(`](${from})`).join(`](${to})`);
          }
          await issuesApi.update(issue.id, { title: values.title, description });
          await qc.invalidateQueries({ queryKey: issuesKeys.detail(issue.id) });
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
        className="w-[calc(100vw-1rem)] max-w-270 gap-0 overflow-hidden p-0 sm:w-full [&>button.absolute]:hidden"
        onPointerDownOutside={(e) => {
          if ((e.target as HTMLElement).closest("[data-mention-list]")) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if ((e.target as HTMLElement).closest("[data-mention-list]")) {
            e.preventDefault();
          }
        }}
        onFocusOutside={(e) => {
          if ((e.target as HTMLElement).closest("[data-mention-list]")) {
            e.preventDefault();
          }
        }}
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid max-h-[90vh] grid-cols-1 md:max-h-[85vh] md:grid-cols-[1fr_320px]">
          {/* LEFT: editor */}
          <div className="flex min-w-0 flex-col overflow-y-auto">
            <div className="flex items-start gap-2 px-5 pt-4 pb-2">
              <Input
                placeholder="Enter a summary"
                className="placeholder:text-muted-foreground/60 h-auto border-0 px-0 py-1 text-xl font-semibold shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
                {...form.register("title")}
              />
              <div className="text-muted-foreground flex items-center gap-1">
                <IconBtn title="Close" onClick={() => onOpenChange(false)} type="button">
                  <X className="h-4 w-4" />
                </IconBtn>
              </div>
            </div>
            {form.formState.errors.title && <p className="text-destructive px-5 pb-1 text-xs">{form.formState.errors.title.message}</p>}

            {/* rich text editor */}
            <div className="flex-1">
              <RichTextEditor
                value={form.watch("description") ?? ""}
                onChange={(html) => form.setValue("description", html, { shouldDirty: true })}
                placeholder="Type or paste a description of the issue here"
                onUploadFile={async (file) => stageInlineFile(file)}
                mentionUsers={mentionableUsers}
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
                      "text-muted-foreground flex w-full items-center justify-center rounded-md border border-dashed py-4 text-sm transition-colors",
                      dragOver ? "border-primary bg-primary/5 text-foreground" : "hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    <Paperclip className="mr-2 h-4 w-4" />
                    Click to <span className="text-primary mx-1 underline-offset-2 hover:underline">browse</span> or drag files here
                  </button>
                );

                if (attachments.length === 0) return uploadBtn;

                return (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {attachments.map((file, idx) => {
                      const meta = fileTypeMeta(file.name);
                      return (
                        <div key={`${file.name}-${idx}`} className={cn("group flex items-center gap-3 rounded-md border px-3 py-2", meta.bg, meta.border)}>
                          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white uppercase", meta.badge)}>
                            {meta.label ? meta.label : <FileText className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-foreground truncate text-sm font-medium">{file.name}</div>
                            <div className="text-muted-foreground text-xs">
                              {meta.typeLabel} · {formatBytes(file.size)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            title="Remove"
                            className="text-muted-foreground hover:bg-background hover:text-foreground rounded p-1 opacity-60 group-hover:opacity-100"
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
            <div className="bg-background sticky bottom-0 z-10 mt-auto flex items-center gap-2 border-t px-5 py-3">
              <div className="flex">
                <Button className="h-8 bg-blue-600 text-white hover:bg-blue-700" type="submit" disabled={isBusy}>
                  {isBusy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Create
                </Button>
                {/* <DropdownMenu>
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
                </DropdownMenu> */}
              </div>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>

          {/* RIGHT: metadata sidebar */}
          <aside className="bg-muted/20 overflow-y-auto border-l">
            <div className="space-y-4 px-4 py-4">
              <Field label="Project">
                <ProjectPicker projects={projects} value={form.watch("projectId")} onChange={(id) => form.setValue("projectId", id, { shouldValidate: true })} />
                {form.formState.errors.projectId && <p className="text-destructive mt-1 text-xs">{form.formState.errors.projectId.message}</p>}
              </Field>

              <Field label="Priority" rightSlot={form.watch("priority") ? <TileBadge color={priorityBadgeBg(form.watch("priority"))}>S</TileBadge> : undefined}>
                <PriorityPicker options={priorityOptions} value={form.watch("priority")} onChange={(v) => form.setValue("priority", v, { shouldValidate: true })} hasProject={!!selectedProjectId} />
                {form.formState.errors.priority && <p className="text-destructive mt-1 text-xs">{form.formState.errors.priority.message}</p>}
              </Field>
            </div>
          </aside>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, rightSlot }: { label: string; children: React.ReactNode; rightSlot?: React.ReactNode }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{label}</div>
      <div className="mt-1.5 flex items-center gap-2 text-base">
        <div className="min-w-0 flex-1 truncate">{children}</div>
        {rightSlot}
      </div>
    </div>
  );
}

function TileBadge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white", color)}>{children}</span>;
}

function ProjectPicker({ projects, value, onChange }: { projects: { id: string; name: string; youTrackProjectId: string }[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = projects.find((p) => p.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="hover:text-foreground flex w-full items-center justify-between gap-2 rounded text-left text-sm">
          {selected ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-foreground truncate font-medium">{selected.name}</span>
              <EntityLogo name={selected.name} shortCode={selected.youTrackProjectId} seed={selected.id} size="sm" className="ml-auto" />
            </div>
          ) : (
            <span className="text-muted-foreground">Select project</span>
          )}
          <ChevronsUpDown className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-70 p-0" align="end">
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
                  <EntityLogo name={p.name} shortCode={p.youTrackProjectId} seed={p.id} size="sm" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{p.name}</span>
                    <span className="text-muted-foreground font-mono text-[10px]">{p.youTrackProjectId}</span>
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

function PriorityPicker({ options, value, onChange, hasProject }: { options: string[]; value: string; onChange: (v: string) => void; hasProject: boolean }) {
  const [open, setOpen] = useState(false);

  const noPriorities = hasProject && options.length === 0;
  const placeholder = noPriorities ? "No priorities synced" : "Select priority";

  const handleOpenChange = (next: boolean) => {
    if (next && !hasProject) {
      toast.error("Please select a project first");
      return;
    }
    if (next && noPriorities) {
      toast.error("This project has no priorities synced from YouTrack");
      return;
    }
    setOpen(next);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button type="button" className="text-primary flex w-full items-center gap-2 text-left text-sm underline-offset-2 hover:underline">
          {value || placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-65 p-0" align="end">
        <Command>
          <CommandInput placeholder="Filter items" />
          <CommandList>
            <CommandEmpty>No priority.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <span className="flex-1">{option}</span>
                  <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white", priorityBadgeBg(option))}>S</span>
                  {option === value && <Check className="h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function IconBtn({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className={cn("text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-7 w-7 items-center justify-center rounded", props.className)}>
      {children}
    </button>
  );
}
