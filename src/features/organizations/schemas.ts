import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
});
export type CreateOrganizationFormValues = z.infer<
  typeof createOrganizationSchema
>;

export const editOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  isActive: z.boolean(),
});
export type EditOrganizationFormValues = z.infer<typeof editOrganizationSchema>;
