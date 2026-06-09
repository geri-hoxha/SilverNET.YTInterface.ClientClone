import { createFileRoute } from "@tanstack/react-router";
import { ProjectsListPage } from "@/features/projects";

export const Route = createFileRoute("/_authenticated/projects/")({
  component: ProjectsListPage,
});
