import { createFileRoute } from "@tanstack/react-router";
import { OrganizationsListPage } from "@/features/organizations";

export const Route = createFileRoute("/_authenticated/organizations/")({
  component: OrganizationsListPage,
});
