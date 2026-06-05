import { createFileRoute, redirect } from "@tanstack/react-router";

// The dedicated /issues/new route is replaced by an in-place modal triggered
// from the Issues list. Redirect any direct hits with a flag so the list can
// auto-open the dialog if desired in the future.
export const Route = createFileRoute("/_authenticated/issues/new")({
  beforeLoad: () => {
    throw redirect({ to: "/issues" });
  },
  component: () => null,
});
