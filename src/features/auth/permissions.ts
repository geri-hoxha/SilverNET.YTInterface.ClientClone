// Canonical list of permission strings the backend grants. Each role maps to a
// fixed bundle of these; authorization checks (UI visibility) use permissions,
// never role names. The API's 403 is the real enforcement — these only gate UX.
export const PERMISSIONS = {
  // Cross-organization (tenant) data access — SuperAdmin only.
  tenancyGlobal: "tenancy.global",

  // Organizations
  organizationsRead: "organizations.read",
  organizationsCreate: "organizations.create",
  organizationsUpdate: "organizations.update",

  // Projects
  projectsRead: "projects.read",
  projectsCreate: "projects.create",
  projectsUpdate: "projects.update",
  projectsPrioritiesSync: "projects.priorities.sync",
  projectsIssuesSync: "projects.issues.sync",

  // Issues
  issuesRead: "issues.read",
  issuesCreate: "issues.create",
  issuesUpdate: "issues.update",
  issuesEstimationApprove: "issues.estimation.approve",
  issuesCommentsCreate: "issues.comments.create",
  issuesAttachmentsCreate: "issues.attachments.create",

  // Users
  usersRead: "users.read",
  usersCreate: "users.create",
  usersUpdate: "users.update",
  usersAssignSuperAdmin: "users.assign_super_admin",

  // Roles
  rolesRead: "roles.read",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
