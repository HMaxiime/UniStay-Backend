import { type Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
export declare const getAllBookings: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyBookings: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBookingById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createBooking: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const cancelBooking: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const completeBooking: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBookingsByListing: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=controller.d.ts.map