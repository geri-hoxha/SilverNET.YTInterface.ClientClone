import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PERMISSIONS, requirePermission } from "@/features/auth";

export const Route = createFileRoute("/_authenticated/users")({
  beforeLoad: () => requirePermission(PERMISSIONS.usersRead),
  component: () => <Outlet />,
});
