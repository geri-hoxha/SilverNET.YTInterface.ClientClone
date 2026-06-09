import { createFileRoute } from "@tanstack/react-router";
import { IssueDetailPage } from "@/features/issues";

export const Route = createFileRoute("/_authenticated/issues/$id")({
  component: IssueDetailPage,
});
