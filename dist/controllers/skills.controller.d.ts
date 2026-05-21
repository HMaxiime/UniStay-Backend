import type { Request, Response } from "express";
export declare function getSkills(req: Request, res: Response): Promise<void>;
export declare function getSkillById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createSkill(req: Request, res: Response): Promise<void>;
export declare function deleteSkill(req: Request, res: Response): Promise<void>;
export declare function updateSkill(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=skills.controller.d.ts.map