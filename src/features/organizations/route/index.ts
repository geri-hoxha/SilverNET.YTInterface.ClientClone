import { getRouteApi } from "@tanstack/react-router";

export const organizationsRouteApi = getRouteApi(
  "/_authenticated/organizations/",
);
