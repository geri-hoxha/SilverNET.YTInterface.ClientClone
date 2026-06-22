import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PERMISSIONS, requirePermission } from "@/features/auth";

export const Route = createFileRoute("/_authenticated/projects")({
  beforeLoad: () => requirePermission(PERMISSIONS.projectsRead),
  component: () => <Outlet />,
});
