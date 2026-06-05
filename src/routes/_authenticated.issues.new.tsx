import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateIssue } from "@/features/issues/hooks";

const schema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  priority: z.enum(["Low", "Normal", "Major", "Critical"]),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_authenticated/issues/new")({
  component: NewIssuePage,
});

function NewIssuePage() {
  const navigate = useNavigate();
  const create = useCreateIssue();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectId: "",
      title: "",
      description: "",
      priority: "Normal",
    },
  });

  const onSubmit = async (values: FormValues) => {
    const issue = await create.mutateAsync(values);
    navigate({ to: "/issues/$id", params: { id: issue.id } });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link to="/issues">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to issues
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create issue</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Project</Label>
              <Input
                id="projectId"
                placeholder="Project ID"
                {...form.register("projectId")}
              />
              {form.formState.errors.projectId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.projectId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={6}
                {...form.register("description")}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(v) =>
                  form.setValue("priority", v as FormValues["priority"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Major">Major</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/issues" })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create issue
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
