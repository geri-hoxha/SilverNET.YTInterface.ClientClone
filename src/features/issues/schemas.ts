import { z } from "zod";

const issueSortFieldSchema = z.enum([
  "YouTrackReadableId",
  "Title",
  "ProjectName",
  "Priority",
  "ClientState",
  "CreatedOnUtc",
]);

export const issuesSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(50),
  projectId: z.string().optional(),
  status: z.array(z.string()).optional(),
  priority: z.array(z.string()).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  closedFrom: z.string().optional(),
  closedTo: z.string().optional(),
  search: z.string().optional(),
  sortBy: issueSortFieldSchema.optional(),
  sortDescending: z.boolean().optional(),
  saved: z.enum(["assigned", "commented", "reported", "star"]).optional(),
  savedSearchId: z.string().optional(),
});
export type IssuesSearch = z.infer<typeof issuesSearchSchema>;

export const createIssueSchema = z.object({
  projectId: z.string().min(1, "Select a project"),
  title: z.string().min(3, "Summary must be at least 3 characters").max(200),
  // Inline images/files are stored as lightweight attachment references (not
  // base64), so the description HTML stays small.
  description: z.string().max(1_000_000).optional(),
  priority: z.string().min(1, "Select a priority"),
});
export type CreateIssueFormValues = z.infer<typeof createIssueSchema>;

export const updateIssueSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
});
export type UpdateIssueFormValues = z.infer<typeof updateIssueSchema>;
