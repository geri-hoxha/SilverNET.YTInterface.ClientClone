import type { z } from "zod";
import type { issuesSearchSchema } from "../schemas";

type IssuesSearch = z.infer<typeof issuesSearchSchema>;

export const ISSUE_GRID =
  "grid grid-cols-[36px_72px_minmax(0,1fr)_72px_88px] md:grid-cols-[36px_96px_minmax(220px,1fr)_minmax(150px,0.85fr)_100px_80px_minmax(130px,0.85fr)_88px_112px_112px_minmax(120px,0.75fr)] items-center gap-2";

// Same rationale as SavedSearchesList: reset every key before merging saved
// criteria on top of live search state, so absence in the saved criteria
// actually clears the field instead of inheriting whatever was there before.
export const FILTER_RESET: Partial<IssuesSearch> = {
  projectId: undefined,
  status: undefined,
  priority: undefined,
  from: undefined,
  to: undefined,
  closedFrom: undefined,
  closedTo: undefined,
  search: undefined,
  sortBy: undefined,
  sortDescending: undefined,
  pageSize: undefined,
};
