import { z } from "zod";

const issueStatusSchema = z.enum(["Open", "InProgress", "Done", "Blocked"]);
const issuePrioritySchema = z.enum(["Low", "Normal", "Major", "Critical"]);
const issueSortFieldSchema = z.enum([
  "YouTrackReadableId",
  "Title",
  "ProjectName",
  "Priority",
  "ClientState",
  "CreatedAt",
]);

export const issuesSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(50),
  projectId: z.string().optional(),
  status: issueStatusSchema.optional(),
  priority: issuePrioritySchema.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
  sortBy: issueSortFieldSchema.optional(),
  sortDescending: z.boolean().optional(),
  saved: z.enum(["assigned", "commented", "reported", "star"]).optional(),
});
export type IssuesSearch = z.infer<typeof issuesSearchSchema>;

export const createIssueSchema = z.object({
  projectId: z.string().min(1, "Select a project"),
  title: z.string().min(3, "Summary must be at least 3 characters").max(200),
  description: z.string().max(10_000).optional(),
  priority: z.enum(["Low", "Normal", "Major", "Critical"]),
});
export type CreateIssueFormValues = z.infer<typeof createIssueSchema>;

export const updateIssueSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
});
export type UpdateIssueFormValues = z.infer<typeof updateIssueSchema>;
