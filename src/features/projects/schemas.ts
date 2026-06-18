import { z } from "zod";

export const projectFormSchema = z.object({
  organizationId: z.string().min(1, "Select an organization"),
  name: z.string().min(1, "Name is required").max(120),
  youTrackProjectId: z.string().min(1, "YouTrack short name required").max(20),
  isActive: z.boolean(),
});
export type ProjectFormValues = z.infer<typeof projectFormSchema>;
