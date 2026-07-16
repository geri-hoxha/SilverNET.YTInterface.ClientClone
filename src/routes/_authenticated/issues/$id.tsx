import { IssueDetailPage } from "@/features/issues";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/issues/$id")({
  component: IssueDetailPage,
});
