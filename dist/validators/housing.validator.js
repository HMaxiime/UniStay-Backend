import { z } from 'zod';
export const createHousingSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    location: z.string().min(2, 'Location is required'),
    price: z.number().positive('Price must be a positive number'),
    availability: z.boolean().optional(),
});
//# sourceMappingURL=housing.validator.js.map