import { isAuthenticated } from "@/features/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: isAuthenticated() ? "/issues" : "/login" });
  },
});
