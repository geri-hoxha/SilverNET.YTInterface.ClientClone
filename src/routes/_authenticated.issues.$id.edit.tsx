import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIssue, useUpdateIssue } from "@/features/issues/hooks";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_authenticated/issues/$id/edit")({
  component: EditIssuePage,
});

function EditIssuePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const issue = useIssue(id);
  const update = useUpdateIssue(id);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "" },
  });

  useEffect(() => {
    if (issue.data) {
      form.reset({
        title: issue.data.title,
        description: issue.data.description ?? "",
      });
    }
  }, [issue.data, form]);

  const onSubmit = async (values: FormValues) => {
    await update.mutateAsync(values);
    navigate({ to: "/issues/$id", params: { id } });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link to="/issues/$id" params={{ id }}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to issue
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit issue</CardTitle>
        </CardHeader>
        <CardContent>
          {issue.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Textarea id="description" rows={8} {...form.register("description")} />
              </div>
              <p className="text-xs text-muted-foreground">
                Status changes are managed in YouTrack and cannot be edited here.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: "/issues/$id", params: { id } })}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={update.isPending}>
                  {update.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save changes
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
