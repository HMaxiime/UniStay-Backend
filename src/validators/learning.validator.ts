import { z } from "zod";

export const createMaterialSkillSchema = z.object({
  materialId: z.string().uuid("materialId must be valid"),
  skillId: z.string().uuid("skillId must be valid"),
});

export const createAssignmentSchema = z.object({
  title: z.string().min(3, "Assignment title must be at least 3 characters"),
  materialId: z.string().uuid("materialId must be valid"),
  skillId: z.string().uuid("skillId must be valid"),
  isStandalone: z.boolean().optional(),
  timeLimit: z.number().int().positive().optional(),
  questionCount: z.number().int().positive(),
  passingScore: z.number().int().min(0).max(100).optional(),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const createQuestionSchema = z.object({
  assignmentId: z.string().uuid("assignmentId must be valid"),
  text: z.string().min(3, "Question text must be at least 3 characters"),
});

export const updateQuestionSchema = createQuestionSchema.pick({ text: true }).partial();

export const createOptionSchema = z.object({
  questionId: z.string().uuid("questionId must be valid"),
  text: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean().optional(),
});

export const updateOptionSchema = createOptionSchema.pick({ text: true, isCorrect: true }).partial();

export const createEnrollmentSchema = z.object({
  userId: z.string().uuid("userId must be valid").optional(),
  courseId: z.string().uuid("courseId must be valid"),
});

export const startAssignmentSchema = z.object({
  userId: z.string().uuid("userId must be valid").optional(),
  assignmentId: z.string().uuid("assignmentId must be valid"),
});

export const submitAssignmentSchema = z.object({
  userId: z.string().uuid("userId must be valid").optional(),
  assignmentResultId: z.string().uuid("assignmentResultId must be valid"),
  answers: z.array(
    z.object({
      questionId: z.string().uuid("questionId must be valid"),
      selectedOptionId: z.string().uuid("selectedOptionId must be valid"),
    })
  ).min(1, "At least one answer is required"),
});
