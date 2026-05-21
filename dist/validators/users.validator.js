import { z } from 'zod';
export const updateUserSchema = z.object({
    fullName: z.string().min(2).optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
});
//# sourceMappingURL=users.validator.js.map