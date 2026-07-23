import { IssuesSearch } from "../schemas";
import type { IssueAttachment } from "../types";
import { IssueSortField, SavedSearchFilters } from "../types";

export function nullsToUndefined<T extends Record<string, unknown>>(obj: T): T {
  const result = {} as T;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    const value = obj[key];
    result[key] = (value === null ? undefined : value) as T[typeof key];
  }
  return result;
}

const SORT_FIELDS: readonly IssueSortField[] = ["YouTrackReadableId", "Title", "ProjectName", "Priority", "ClientState", "CreatedOnUtc"] as const;

/** Collapse API/URL noise so "no filter" is always the same shape. */
export function normalizeSavedCriteria(input: Partial<SavedSearchFilters & IssuesSearch> | null | undefined): SavedSearchFilters {
  const sortBy = input?.sortBy && (SORT_FIELDS as readonly string[]).includes(input.sortBy) ? (input.sortBy as IssueSortField) : undefined;

  const cleanList = (value?: string[]) => {
    if (!value?.length) return undefined;
    return [...value].map(String).sort();
  };

  return {
    projectId: input?.projectId || undefined,
    search: input?.search?.trim() || undefined,
    from: input?.from || undefined,
    to: input?.to || undefined,
    closedFrom: input?.closedFrom || undefined,
    closedTo: input?.closedTo || undefined,
    status: cleanList(input?.status),
    priority: cleanList(input?.priority),
    sortBy,
    // Direction only exists when a sort field is active
    sortDescending: sortBy ? Boolean(input?.sortDescending) : undefined,
  };
}

export function filtersMatchSaved(current: IssuesSearch, saved: SavedSearchFilters): boolean {
  const a = normalizeSavedCriteria(current);
  const b = normalizeSavedCriteria(saved);
  return JSON.stringify(a) === JSON.stringify(b);
}

export function toSavedFilters(search: IssuesSearch): SavedSearchFilters {
  return normalizeSavedCriteria(search);
}

export function hasActiveCriteria(search: IssuesSearch) {
  return Boolean(search.search || search.projectId || search.priority?.length || search.status?.length || search.from || search.to || search.closedFrom || search.closedTo);
}

export type AttachmentPreviewKind = "image" | "pdf";

export function getAttachmentPreviewKind(a: Pick<IssueAttachment, "contentType" | "fileName">): AttachmentPreviewKind | null {
  const ct = a.contentType?.toLowerCase() ?? "";
  const name = a.fileName.toLowerCase();

  if (ct.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name)) {
    return "image";
  }
  if (ct === "application/pdf" || name.endsWith(".pdf")) {
    return "pdf";
  }
  return null;
}
