import { ProjectsListPage } from "@/features/projects";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/projects/")({
  component: ProjectsListPage,
});
