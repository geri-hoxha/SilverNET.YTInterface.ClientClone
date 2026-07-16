import { PERMISSIONS, requirePermission } from "@/features/auth";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/projects")({
  beforeLoad: () => requirePermission(PERMISSIONS.projectsRead),
  component: () => <Outlet />,
});
