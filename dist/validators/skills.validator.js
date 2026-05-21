import { z } from 'zod';
export const createSkillSchema = z.object({
    name: z.string().min(2, 'Skill name must be at least 2 characters'),
    category: z.string().min(2, 'Category is required'),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], {
        error: 'Level must be BEGINNER, INTERMEDIATE, or ADVANCED',
    }),
});
//# sourceMappingURL=skills.validator.js.map