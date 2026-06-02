import { z } from "zod";

export const createHostelSchema = z.object({
  name: z.string().min(3, "Hostel name must be at least 3 characters"),
  location: z.string().min(2, "Location is required"),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export const updateHostelSchema = createHostelSchema.partial();

export const createRoomSchema = z.object({
  hostelId: z.string().uuid("Invalid hostel ID"),
  name: z.string().min(1, "Room name/number is required"),
  category: z.enum(["VIP", "STANDARD", "BUDGET"] as const),
  capacity: z.number().int().positive("Capacity must be a positive integer"),
  price: z.number().positive("Price must be a positive number"),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
});

export const updateRoomSchema = createRoomSchema.omit({ hostelId: true }).partial();

export const createBookingSchema = z.object({
  roomId: z.string().uuid("Invalid room ID"),
  checkIn: z.string().datetime({ precision: 3 }).optional().or(z.string().optional()),
  checkOut: z.string().datetime({ precision: 3 }).optional().or(z.string().optional()),
});

export const processPaymentSchema = z.object({
  paymentRef: z.string().min(3, "Payment reference is required"),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(5, "Content must be at least 5 characters"),
  targetRole: z.enum(["STUDENT", "HOST", "ADMIN", "EMPLOYER"]).optional().nullable(),
});

export const configureSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    })
  ),
});
