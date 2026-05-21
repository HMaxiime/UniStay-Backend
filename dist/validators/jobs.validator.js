import { z } from 'zod';
export const createJobSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    location: z.string().min(2, 'Location is required'),
    salary: z.number().positive('Salary must be a positive number'),
    scheduleType: z.enum(['FULL_TIME', 'PART_TIME', 'INTERNSHIP'], {
        error: 'Schedule type must be FULL_TIME, PART_TIME, or INTERNSHIP',
    }),
});
//# sourceMappingURL=jobs.validator.js.map