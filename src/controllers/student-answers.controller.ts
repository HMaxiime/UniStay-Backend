import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { submitAssignmentSchema } from "../validators/learning.validator.js";
import { submitAssignment } from "../utils/learning.service.js";

export async function submitStudentAnswers(req: AuthRequest, res: Response) {
  try {
    const data = submitAssignmentSchema.parse(req.body);
    const userId = req.userId ?? data.userId;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const result = await submitAssignment(userId, data.assignmentResultId, data.answers);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message ?? "Failed to submit answers" });
  }
}
