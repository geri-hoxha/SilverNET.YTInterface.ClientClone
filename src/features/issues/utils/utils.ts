import { IssuesSearch } from "../schemas";
import { SavedSearchFilters } from "../types";

export function toSavedFilters(search: IssuesSearch): SavedSearchFilters {
  const { page: _p, saved: _s, savedSearchId: _ssi, ...filters } = search;
  return filters;
}

export function nullsToUndefined<T extends Record<string, unknown>>(obj: T): T {
  const result = {} as T;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    const value = obj[key];
    result[key] = (value === null ? undefined : value) as T[typeof key];
  }
  return result;
}
