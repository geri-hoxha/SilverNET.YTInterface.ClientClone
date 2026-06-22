import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PERMISSIONS, requirePermission } from "@/features/auth";

export const Route = createFileRoute("/_authenticated/organizations")({
  beforeLoad: () => requirePermission(PERMISSIONS.organizationsRead),
  component: () => <Outlet />,
});
