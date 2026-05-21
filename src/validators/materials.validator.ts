import { z } from "zod";

export const createMaterialSchema = z.object({
  title: z.string().min(3, "Material title must be at least 3 characters"),
  description: z.string().optional(),
  url: z.string().url("Must be a valid URL"),
});