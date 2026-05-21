import { z } from 'zod'

export const createCourseSchema = z.object({
  title: z.string().min(3, 'Course title must be at least 3 characters'),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  category: z.string().optional(),
  uploadedBy: z.string().uuid('uploadedBy must be a valid user id'),
})

export const updateCourseSchema = createCourseSchema.partial()
