import { IssuesListPage, issuesSearchSchema } from "@/features/issues";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/issues/")({
  validateSearch: issuesSearchSchema,
  component: IssuesListPage,
});
