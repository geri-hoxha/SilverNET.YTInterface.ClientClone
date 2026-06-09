import { getRouteApi } from "@tanstack/react-router";

export const usersRouteApi = getRouteApi("/_authenticated/users/");
export const userDetailRouteApi = getRouteApi("/_authenticated/users/$id");
