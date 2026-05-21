import { z } from 'zod';
export const registerSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().optional(),
    location: z.string().optional(),
    role: z.enum(['STUDENT', 'HOST', 'EMPLOYER'], {
        error: 'Role must be STUDENT, HOST, or EMPLOYER',
    }),
});
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});
//# sourceMappingURL=auth.validator.js.map