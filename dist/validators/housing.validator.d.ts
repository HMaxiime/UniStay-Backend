import { z } from 'zod';
export declare const createHousingSchema: z.ZodObject<{
    title: z.ZodString;
    location: z.ZodString;
    price: z.ZodNumber;
    availability: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type CreateHousingInput = z.infer<typeof createHousingSchema>;
//# sourceMappingURL=housing.validator.d.ts.map