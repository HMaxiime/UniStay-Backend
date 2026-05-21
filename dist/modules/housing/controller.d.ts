import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
export declare const getListings: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getListingById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createListing: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateListing: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteListing: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const verifyListing: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyListings: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getRoommateMatches: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const bookListing: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=controller.d.ts.map