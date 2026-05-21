import { z } from 'zod';
export declare const createJobSchema: z.ZodObject<{
    title: z.ZodString;
    location: z.ZodString;
    salary: z.ZodNumber;
    scheduleType: z.ZodEnum<{
        FULL_TIME: "FULL_TIME";
        PART_TIME: "PART_TIME";
        INTERNSHIP: "INTERNSHIP";
    }>;
}, z.core.$strip>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
//# sourceMappingURL=jobs.validator.d.ts.map