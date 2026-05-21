import { z } from 'zod';
export declare const updateUserSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
//# sourceMappingURL=users.validator.d.ts.map