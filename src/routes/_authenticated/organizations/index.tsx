import { OrganizationsListPage } from "@/features/organizations";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/organizations/")({
  component: OrganizationsListPage,
});
