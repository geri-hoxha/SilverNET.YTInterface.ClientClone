import { createFileRoute, redirect } from "@tanstack/react-router";
import { tokenStore } from "@/shared/api/tokens";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const stored = tokenStore.get();
    if (stored) throw redirect({ to: "/issues" });
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
