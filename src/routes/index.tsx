import { createFileRoute, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "@/features/auth";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: isAuthenticated() ? "/issues" : "/login" });
  },
  component: () => null,
});
