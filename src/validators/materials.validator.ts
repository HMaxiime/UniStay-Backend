import { z } from "zod";

export const createMaterialSchema = z.object({
  title: z.string().min(3, "Material title must be at least 3 characters"),
  description: z.string().optional(),
  type: z.enum(["VIDEO", "PDF", "ARTICLE", "QUIZ"] as const),
  uploadedBy: z.string().uuid("uploadedBy must be a valid user id"),
  courseId: z.string().uuid("courseId must be valid").optional(),
  duration: z.number().int().positive().optional(),
});

export const updateMaterialSchema = createMaterialSchema.partial();
