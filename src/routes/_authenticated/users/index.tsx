import { UsersListPage, usersSearchSchema } from "@/features/users";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/users/")({
  validateSearch: usersSearchSchema,
  component: UsersListPage,
});
