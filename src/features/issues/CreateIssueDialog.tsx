import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AtSign,
  Bold,
  Code2,
  ExternalLink,
  Eye,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Quote,
  Strikethrough,
  Tag,
  Type as TypeIcon,
  X,
} from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useProjects } from "@/features/projects/hooks";
import { useCreateIssue } from "@/features/issues/hooks";
import { EntityLogo } from "@/shared/components/EntityLogo";
import type { IssuePriority } from "@/features/issues/types";
import { cn } from "@/lib/utils";

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
  const [mode, setMode] = useState<"visual" | "markdown">("visual");

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

            {/* toolbar */}
            <div className="flex flex-wrap items-center gap-1 border-y bg-muted/40 px-3 py-1.5 text-muted-foreground">
              <Select defaultValue="normal">
                <SelectTrigger className="h-7 w-[110px] border-0 bg-transparent text-xs shadow-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal text</SelectItem>
                  <SelectItem value="h1">Heading 1</SelectItem>
                  <SelectItem value="h2">Heading 2</SelectItem>
                  <SelectItem value="h3">Heading 3</SelectItem>
                </SelectContent>
              </Select>
              <Separator orientation="vertical" className="mx-1 h-5" />
              <ToolBtn label="Bold">
                <Bold className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn label="Italic">
                <Italic className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn label="Strikethrough">
                <Strikethrough className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn label="Text color">
                <TypeIcon className="h-3.5 w-3.5" />
              </ToolBtn>
              <Separator orientation="vertical" className="mx-1 h-5" />
              <ToolBtn label="Quote">
                <Quote className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn label="Code">
                <Code2 className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn label="Link">
                <LinkIcon className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn label="Bullet list">
                <List className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn label="Numbered list">
                <ListOrdered className="h-3.5 w-3.5" />
              </ToolBtn>

              <div className="ml-auto inline-flex rounded-md border bg-background p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setMode("visual")}
                  className={cn(
                    "rounded px-2 py-0.5",
                    mode === "visual"
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Visual
                </button>
                <button
                  type="button"
                  onClick={() => setMode("markdown")}
                  className={cn(
                    "rounded px-2 py-0.5",
                    mode === "markdown"
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Markdown
                </button>
              </div>
              <Separator orientation="vertical" className="mx-1 h-5" />
              <ToolBtn label="Mention">
                <AtSign className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn label="Attachment">
                <Paperclip className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn label="Format">
                <TypeIcon className="h-3.5 w-3.5" />
              </ToolBtn>
            </div>

            {/* description */}
            <div className="flex-1 px-5 py-3">
              <Textarea
                placeholder="Type or paste a description of the issue here"
                className="min-h-[280px] resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("description")}
              />
            </div>

            {/* attachments */}
            <div className="mx-5 mb-3 flex items-center justify-center rounded-md border border-dashed py-4 text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors">
              <Paperclip className="mr-2 h-4 w-4" />
              Click to{" "}
              <span className="mx-1 text-primary underline-offset-2 hover:underline">
                browse
              </span>{" "}
              or drag files here
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
                <Select
                  value={form.watch("projectId")}
                  onValueChange={(v) =>
                    form.setValue("projectId", v, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="h-auto border-0 bg-transparent px-0 py-0 shadow-none [&>svg]:hidden focus:ring-0">
                    <SelectValue
                      placeholder={
                        <span className="text-muted-foreground">
                          Select project
                        </span>
                      }
                    >
                      {selectedProject && (
                        <div className="flex w-full items-center gap-2">
                          <span className="font-medium text-foreground">
                            {selectedProject.name}
                          </span>
                          <EntityLogo
                            name={selectedProject.name}
                            shortCode={selectedProject.youTrackProjectId}
                            seed={selectedProject.id}
                            size="sm"
                            className="ml-auto"
                          />
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="font-mono text-[10px] mr-2 text-muted-foreground">
                          {p.youTrackProjectId}
                        </span>
                        {p.name}
                      </SelectItem>
                    ))}
                    {!projects.length && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        No projects available
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.projectId && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.projectId.message}
                  </p>
                )}
              </Field>

              <Field label="Estimation">
                <span className="text-muted-foreground">?</span>
              </Field>

              <Field label="Billable">
                <span className="text-muted-foreground">No billable</span>
              </Field>

              <Field label="Client State">
                <span className="text-muted-foreground">No client state</span>
              </Field>

              <Field label="State" rightSlot={<TileBadge color="bg-sky-500">T</TileBadge>}>
                <span>Todo</span>
              </Field>

              <Field label="Due Date">
                <span className="text-muted-foreground">No due date</span>
              </Field>

              <Field label="Type" rightSlot={<TileBadge color="bg-sky-500">T</TileBadge>}>
                <span>Task</span>
              </Field>

              <Field
                label="Priority"
                rightSlot={
                  <TileBadge color={priorityColor(form.watch("priority"))}>
                    {form.watch("priority")[0]}
                  </TileBadge>
                }
              >
                <Select
                  value={form.watch("priority")}
                  onValueChange={(v) =>
                    form.setValue("priority", v as IssuePriority)
                  }
                >
                  <SelectTrigger className="h-auto border-0 bg-transparent px-0 py-0 shadow-none [&>svg]:hidden focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="Major">Major</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Assignee">
                <span className="text-muted-foreground">Unassigned</span>
              </Field>

              <Field label="Spent time">
                <span className="text-muted-foreground">?</span>
              </Field>

              <Field label="Boards">
                {selectedProject ? (
                  <Badge variant="secondary" className="gap-1 font-normal">
                    {selectedProject.name} Board
                    <X className="h-3 w-3 cursor-pointer text-muted-foreground" />
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
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

function ToolBtn({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
