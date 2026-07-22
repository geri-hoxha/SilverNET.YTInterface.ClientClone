import type { z } from "zod";
import type { issuesSearchSchema } from "../schemas";

type IssuesSearch = z.infer<typeof issuesSearchSchema>;

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
