import { z } from 'zod';
export declare const createSkillSchema: z.ZodObject<{
    name: z.ZodString;
    category: z.ZodString;
    level: z.ZodEnum<{
        BEGINNER: "BEGINNER";
        INTERMEDIATE: "INTERMEDIATE";
        ADVANCED: "ADVANCED";
    }>;
}, z.core.$strip>;
export type CreateSkillInput = z.infer<typeof createSkillSchema>;
//# sourceMappingURL=skills.validator.d.ts.map