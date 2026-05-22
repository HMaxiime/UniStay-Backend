import type { Response ,  Request } from "express";
import { startAssignmentSchema } from "../validators/learning.validator.js";
import { startAssignment } from "../utils/learning.service.js";

export async function startAssignmentResult(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const data = startAssignmentSchema.parse(req.body);
    if (!userId) return res.status(401).json({ error: "Authentication required" });
    const result = await startAssignment(userId, data.assignmentId);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message ?? "Failed to start assignment" });
  }
}
