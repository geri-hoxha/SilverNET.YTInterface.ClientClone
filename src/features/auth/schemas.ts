import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});
export type LoginSearch = z.infer<typeof loginSearchSchema>;
