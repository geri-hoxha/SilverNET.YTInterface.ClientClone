import { z } from "zod";

export const usersSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});
export type UsersSearch = z.infer<typeof usersSearchSchema>;

export const createUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  fullName: z.string().min(1, "Full name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationId: z.string().min(1, "Organization is required"),
  role: z.string().min(1, "Role is required"),
});
export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const userProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  username: z
    .string()
    .min(1, "Username is required")
    .regex(/^[a-zA-Z0-9._-]+$/, "Letters, numbers, dot, underscore, dash"),
  email: z.string().email("Invalid email address"),
  userType: z.enum(["Standard", "Reporter", "Guest"]),
  vcsUsernames: z.string().optional(),
  timeZoneRegion: z.string().optional(),
  timeZoneCity: z.string().optional(),
  language: z.string().optional(),
  dateFormat: z.string().optional(),
  periodFormat: z.string().optional(),
  firstDayOfWeek: z.enum(["Sunday", "Monday"]).optional(),
  defaultSorting: z.enum(["Relevance", "Updated"]).optional(),
});
export type UserProfileFormValues = z.infer<typeof userProfileSchema>;
