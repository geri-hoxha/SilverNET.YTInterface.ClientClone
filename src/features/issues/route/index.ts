import { getRouteApi } from "@tanstack/react-router";

export const issuesRouteApi = getRouteApi("/_authenticated/issues/");
export const issueDetailRouteApi = getRouteApi("/_authenticated/issues/$id");
