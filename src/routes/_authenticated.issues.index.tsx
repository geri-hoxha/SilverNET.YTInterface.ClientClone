import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { IssuesListPage, issuesSearchSchema } from "@/features/issues";

export const Route = createFileRoute("/_authenticated/issues/")({
  validateSearch: zodValidator(issuesSearchSchema),
  component: IssuesListPage,
});
