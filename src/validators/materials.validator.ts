import { z } from "zod";

const optionalDuration = z.preprocess((value) => {
  if (value === undefined || value === null || value === "" || value === 0 || value === "0") {
    return undefined;
  }

  return Number(value);
}, z.number().int().positive().optional());

export const createMaterialSchema = z.object({
  title: z.string().min(3, "Material title must be at least 3 characters"),
  description: z.string().optional(),
  type: z.enum(["VIDEO", "PDF", "ARTICLE", "QUIZ"] as const),
  duration: optionalDuration,
});

export const updateMaterialSchema = createMaterialSchema.partial();
