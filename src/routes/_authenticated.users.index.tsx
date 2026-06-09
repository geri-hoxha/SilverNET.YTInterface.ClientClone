import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { UsersListPage, usersSearchSchema } from "@/features/users";

export const Route = createFileRoute("/_authenticated/users/")({
  validateSearch: zodValidator(usersSearchSchema),
  component: UsersListPage,
});
