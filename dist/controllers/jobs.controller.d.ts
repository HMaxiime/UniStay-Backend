import type { Request, Response } from "express";
interface AuthRequest extends Request {
    userId?: string;
    role?: string;
}
export declare function getJobs(_req: Request, res: Response): Promise<void>;
export declare function getJobById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createJob(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateJob(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteJob(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=jobs.controller.d.ts.map