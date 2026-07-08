import { IssuesSearch } from "../schemas";
import { SavedSearchFilters } from "../types";

export function toSavedFilters(search: IssuesSearch): SavedSearchFilters {
  const { page: _p, saved: _s, savedSearchId: _ssi, ...filters } = search;
  return filters;
}
