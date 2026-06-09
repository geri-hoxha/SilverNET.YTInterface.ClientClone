import { createFileRoute } from "@tanstack/react-router";
import { EditIssuePage } from "@/features/issues";

export const Route = createFileRoute("/_authenticated/issues/$id/edit")({
  component: EditIssuePage,
});
